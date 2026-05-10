import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { requireTenantMembership } from "@/lib/api-utils"
import { z } from "zod"

const orderSchema = z.object({
  tenantId: z.string(),
  merchantId: z.string(),
  studentWalletId: z.string(), // ID WalletAccount siswa
  pin: z.string().length(6, "PIN harus 6 digit"),
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number().min(1),
  })).min(1),
})

/**
 * POST /api/canteen/orders
 * Membuat order kantin dan langsung mendebet wallet siswa.
 * Merchant panel (panel-kantin) memanggil ini via scan QR siswa.
 */
export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const parsed = orderSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const { tenantId, merchantId, studentWalletId, pin, items } = parsed.data

  // 1. Verifikasi merchant milik user yang login
  const merchant = await db.canteenMerchant.findFirst({
    where: { id: merchantId, tenantId, userId: session.user.id, isActive: true },
  })
  if (!merchant) return NextResponse.json({ error: "Merchant tidak valid" }, { status: 403 })

  // 2. Fetch semua produk dari DB untuk validasi harga & stok
  const productIds = items.map(i => i.productId)
  const products = await db.canteenProduct.findMany({
    where: { id: { in: productIds }, merchantId, isActive: true },
  })

  if (products.length !== items.length) {
    return NextResponse.json({ error: "Beberapa produk tidak ditemukan atau tidak aktif" }, { status: 400 })
  }

  // 3. Hitung total & validasi stok
  const orderItems = items.map(item => {
    const product = products.find(p => p.id === item.productId)!
    if (product.stock !== -1 && product.stock < item.quantity) {
      throw new Error(`Stok ${product.name} tidak mencukupi`)
    }
    return {
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity: item.quantity,
      subtotal: product.price * item.quantity,
    }
  })

  const total = orderItems.reduce((acc, i) => acc + i.subtotal, 0)

  // 4. Fetch wallet siswa
  const wallet = await db.walletAccount.findUnique({
    where: { id: studentWalletId },
    include: { student: { select: { id: true, name: true, tenantId: true } } },
  })

  if (!wallet || wallet.tenantId !== tenantId) {
    return NextResponse.json({ error: "Wallet siswa tidak valid" }, { status: 400 })
  }
  if (!wallet.isActive) {
    return NextResponse.json({ error: "Wallet siswa tidak aktif" }, { status: 400 })
  }
  if (wallet.balance < total) {
    return NextResponse.json({
      error: `Saldo tidak cukup. Saldo: Rp ${wallet.balance.toLocaleString("id-ID")}, Total: Rp ${total.toLocaleString("id-ID")}`,
    }, { status: 400 })
  }
  if (!wallet.pin) {
    return NextResponse.json({ error: "Siswa belum mengatur PIN keamanan. Harap atur PIN di Dashboard Orang Tua." }, { status: 400 })
  }
  if (wallet.pin !== pin) {
    return NextResponse.json({ error: "PIN yang dimasukkan salah!" }, { status: 400 })
  }

  // Cek Daily Limit
  if (wallet.dailyLimit && wallet.dailyLimit > 0) {
    // Hitung total pengeluaran hari ini
    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date()
    endOfDay.setHours(23, 59, 59, 999)

    const todayExpenses = await db.walletTransaction.aggregate({
      where: {
        walletId: wallet.id,
        type: "PAYMENT",
        status: "SUCCESS",
        createdAt: { gte: startOfDay, lte: endOfDay }
      },
      _sum: { amount: true }
    })

    const spentToday = todayExpenses._sum.amount || 0
    if (spentToday + total > wallet.dailyLimit) {
      return NextResponse.json({
        error: `Transaksi melebihi limit harian. Sisa limit hari ini: Rp ${(wallet.dailyLimit - spentToday).toLocaleString("id-ID")}`
      }, { status: 400 })
    }
  }

  // 5. Transaksi atomik
  const order = await db.$transaction(async (tx) => {
    // Debet wallet siswa secara atomik untuk cegah race condition
    const updatedWallet = await tx.walletAccount.update({ 
      where: { id: wallet.id }, 
      data: { balance: { decrement: total } } 
    })

    if (updatedWallet.balance < 0) {
      throw new Error("Saldo tidak cukup setelah divalidasi") // Akan membatalkan transaksi
    }

    const newMerchantBalance = merchant.balance + total

    // Catat WalletTransaction
    await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        tenantId,
        type: "PAYMENT",
        amount: total,
        balanceBefore: wallet.balance, // Snapshot the previous known balance
        balanceAfter: updatedWallet.balance,
        description: `Kantin: ${merchant.name}`,
        status: "SUCCESS",
      },
    })

    // Kredit saldo merchant
    await tx.canteenMerchant.update({ where: { id: merchant.id }, data: { balance: newMerchantBalance } })

    // Kurangi stok produk (jika finite)
    for (const item of orderItems) {
      const product = products.find(p => p.id === item.productId)!
      if (product.stock !== -1) {
        await tx.canteenProduct.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        })
      }
    }

    // Buat order
    const newOrder = await tx.canteenOrder.create({
      data: {
        tenantId,
        merchantId,
        studentId: wallet.studentId,
        total,
        status: "COMPLETED",
        pinVerified: true,
        items: { create: orderItems },
      },
      include: { items: true, student: { select: { name: true } } },
    })

    return newOrder
  })

  return NextResponse.json({
    message: "Transaksi berhasil",
    order,
    balanceAfter: wallet.balance - total,
  }, { status: 201 })
}

// GET: Riwayat order (admin atau merchant)
export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const url = new URL(req.url)
  const tenantId = url.searchParams.get("tenantId")
  const merchantId = url.searchParams.get("merchantId")
  const studentId = url.searchParams.get("studentId")
  const page = parseInt(url.searchParams.get("page") || "1")
  const take = 20

  if (!tenantId) return NextResponse.json({ error: "tenantId diperlukan" }, { status: 400 })

  const { error } = await requireTenantMembership(tenantId)
  if (error) return error

  const where: any = { tenantId }
  if (merchantId) where.merchantId = merchantId
  if (studentId) where.studentId = studentId

  const [orders, total] = await Promise.all([
    db.canteenOrder.findMany({
      where,
      include: {
        student: { select: { name: true } },
        merchant: { select: { name: true } },
        items: true,
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * take,
      take,
    }),
    db.canteenOrder.count({ where }),
  ])

  return NextResponse.json({ data: orders, meta: { total, page, totalPages: Math.ceil(total / take) } })
}
