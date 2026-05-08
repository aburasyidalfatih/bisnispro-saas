import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireTenantAccess } from "@/lib/guards/tenant-guard"
import { z } from "zod"
import { auth } from "@/lib/auth"

const paySchema = z.object({
  tenantId: z.string(),
  amount: z.number().min(1),
  method: z.enum(["WALLET", "TRANSFER", "CASH", "TRIPAY"]),
  proofUrl: z.string().optional(),
  notes: z.string().optional(),
})

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const parsed = paySchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const { tenantId, amount, method, proofUrl, notes } = parsed.data

  const { error } = await requireTenantAccess(tenantId)
  if (error) return error

  // Fetch invoice
  const invoice = await db.invoice.findFirst({
    where: { id, tenantId, deletedAt: null },
    include: { student: { include: { walletAccount: true } } },
  })
  if (!invoice) return NextResponse.json({ error: "Tagihan tidak ditemukan" }, { status: 404 })
  if (invoice.status === "PAID") return NextResponse.json({ error: "Tagihan sudah lunas" }, { status: 400 })

  // Jika bayar via Wallet, validasi saldo dan debet otomatis
  if (method === "WALLET") {
    const wallet = invoice.student.walletAccount
    if (!wallet) return NextResponse.json({ error: "Siswa tidak memiliki wallet" }, { status: 400 })
    if (wallet.balance < amount) return NextResponse.json({ error: "Saldo tidak mencukupi" }, { status: 400 })

    await db.$transaction(async (tx) => {
      const newBalance = wallet.balance - amount
      // Debet wallet
      await tx.walletAccount.update({
        where: { id: wallet.id },
        data: { balance: newBalance },
      })
      // Catat transaksi wallet
      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          tenantId,
          type: "PAYMENT",
          amount,
          balanceBefore: wallet.balance,
          balanceAfter: newBalance,
          referenceId: invoice.code,
          description: `Pembayaran: ${invoice.title}`,
          status: "SUCCESS",
        },
      })
      // Buat InvoicePayment langsung VERIFIED
      const totalPaid = invoice.amountPaid + amount
      const isDone = totalPaid >= invoice.amount
      await tx.invoicePayment.create({
        data: {
          invoiceId: id,
          tenantId,
          amount,
          method: "WALLET",
          status: "VERIFIED",
          verifiedAt: new Date(),
          verifiedBy: session.user.id,
          paidAt: new Date(),
          notes,
        },
      })
      // Update invoice
      await tx.invoice.update({
        where: { id },
        data: {
          amountPaid: totalPaid,
          amountDue: invoice.amount - totalPaid,
          status: isDone ? "PAID" : "PARTIAL",
        },
      })
      // Catat ke Cashflow
      await tx.cashflow.create({
        data: {
          tenantId,
          type: "INCOME",
          category: "SPP",
          amount,
          description: `${invoice.title} — ${invoice.student.name}`,
          referenceId: invoice.code,
        },
      })
    })

    return NextResponse.json({ message: "Pembayaran via Wallet berhasil" })
  }

  // Metode lain (TRANSFER/CASH/TRIPAY) → status PENDING, tunggu verifikasi admin
  const newAmountPaid = invoice.amountPaid + amount
  const invoicePayment = await db.invoicePayment.create({
    data: {
      invoiceId: id,
      tenantId,
      amount,
      method,
      proofUrl,
      status: "PENDING",
      notes,
      paidAt: new Date(),
    },
  })

  return NextResponse.json({
    message: "Pembayaran tercatat, menunggu verifikasi admin",
    paymentId: invoicePayment.id,
  }, { status: 201 })
}

// Admin verifikasi pembayaran manual
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: invoiceId } = await params
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { tenantId, paymentId, action, notes } = await req.json() // action: VERIFIED | REJECTED

  const { error } = await requireTenantAccess(tenantId)
  if (error) return error

  const payment = await db.invoicePayment.findUnique({
    where: { id: paymentId },
    include: { invoice: true },
  })
  if (!payment) return NextResponse.json({ error: "Data pembayaran tidak ditemukan" }, { status: 404 })

  await db.$transaction(async (tx) => {
    await tx.invoicePayment.update({
      where: { id: paymentId },
      data: {
        status: action,
        verifiedAt: new Date(),
        verifiedBy: session.user.id,
        notes,
      },
    })

    if (action === "VERIFIED") {
      const invoice = payment.invoice
      const newAmountPaid = invoice.amountPaid + payment.amount
      const isDone = newAmountPaid >= invoice.amount
      await tx.invoice.update({
        where: { id: invoice.id },
        data: {
          amountPaid: newAmountPaid,
          amountDue: invoice.amount - newAmountPaid,
          status: isDone ? "PAID" : "PARTIAL",
        },
      })
      // Catat Cashflow
      await tx.cashflow.create({
        data: {
          tenantId,
          type: "INCOME",
          category: "SPP",
          amount: payment.amount,
          description: invoice.title,
          referenceId: invoice.code,
        },
      })
    }
  })

  return NextResponse.json({ message: `Pembayaran ${action === "VERIFIED" ? "diverifikasi" : "ditolak"}` })
}
