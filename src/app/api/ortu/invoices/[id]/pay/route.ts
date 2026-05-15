import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { createTransaction } from "@/lib/services/payment"

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { method, walletId, customerName, customerEmail, customerPhone } = await req.json()
    const invoiceId = params.id

    if (!method) {
      return NextResponse.json({ error: "Metode pembayaran harus dipilih" }, { status: 400 })
    }

    // Verify invoice
    const invoice = await db.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        student: {
          include: {
            parents: {
              where: { userId: session.user.id }
            }
          }
        }
      }
    })

    if (!invoice || invoice.student.parents.length === 0) {
      return NextResponse.json({ error: "Tagihan tidak ditemukan atau Anda tidak memiliki akses" }, { status: 403 })
    }

    if (invoice.status === "PAID") {
      return NextResponse.json({ error: "Tagihan ini sudah lunas" }, { status: 400 })
    }

    // 1. Pay with Wallet
    if (method === "WALLET") {
      if (!walletId) return NextResponse.json({ error: "Wallet ID tidak valid" }, { status: 400 })

      const wallet = await db.walletAccount.findUnique({ where: { id: walletId } })
      if (!wallet || wallet.balance < invoice.amountDue) {
        return NextResponse.json({ error: "Saldo tabungan tidak mencukupi" }, { status: 400 })
      }

      // Perform atomic transaction
      await db.$transaction(async (tx) => {
        // Deduct balance
        // Gunakan atomic decrement
        const updatedWallet = await tx.walletAccount.update({
          where: { id: wallet.id },
          data: { balance: { decrement: invoice.amountDue } }
        })
        const newBalance = updatedWallet.balance

        // Add Transaction record
        await tx.walletTransaction.create({
          data: {
            walletId: wallet.id,
            tenantId: invoice.tenantId,
            type: "WITHDRAWAL",
            amount: invoice.amountDue,
            balanceBefore: wallet.balance,
            balanceAfter: newBalance,
            referenceId: invoice.code,
            description: `Pembayaran Tagihan: ${invoice.title}`,
            status: "SUCCESS"
          }
        })

        // Update Invoice
        await tx.invoice.update({
          where: { id: invoice.id },
          data: {
            status: "PAID",
            amountPaid: invoice.amount,
            amountDue: 0
          }
        })
      })

      return NextResponse.json({ message: "Pembayaran berhasil menggunakan tabungan" })
    }

    // 2. Pay via Manual Bank Transfer
    if (method.startsWith("MANUAL_")) {
      const tenantData = await db.tenant.findUnique({
         where: { id: invoice.tenantId },
         select: { settings: true }
      })
      const manualBanks = (tenantData?.settings as any)?.manualBanks || []
      const idx = parseInt(method.split("_")[1])
      const selectedBank = manualBanks[idx]

      if (!selectedBank) {
         return NextResponse.json({ error: "Rekening manual tidak ditemukan" }, { status: 400 })
      }

      const payment = await db.invoicePayment.create({
         data: {
            invoiceId: invoice.id,
            tenantId: invoice.tenantId,
            reference: `MANUAL-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            amount: invoice.amountDue,
            method: `TRANSFER`,
            status: "PENDING",
            notes: JSON.stringify({
               bankName: selectedBank.bank,
               accountNumber: selectedBank.account,
               accountName: selectedBank.name,
            })
         }
      })

      return NextResponse.json({
         message: "Transaksi manual berhasil dibuat",
         redirectUrl: `/ortu/tagihan/${invoice.id}/manual/${payment.id}`
      })
    }

    // 3. Pay via Tripay Gateway
    const tripayResult = await createTransaction({
      tenantId: invoice.tenantId,
      plan: "INVOICE",
      amount: invoice.amountDue,
      method: method,
      customerName: customerName || session.user.name || "Customer",
      customerEmail: customerEmail || session.user.email || "customer@example.com",
      customerPhone: customerPhone || "",
      metadata: {
        invoiceId: invoice.id,
      }
    })

    if (!tripayResult.success) {
      return NextResponse.json({ error: tripayResult.message || "Gagal menghubungi Payment Gateway" }, { status: 500 })
    }

    return NextResponse.json({ 
      message: "Transaksi berhasil dibuat", 
      checkoutUrl: tripayResult.data.checkout_url 
    })

  } catch (error: any) {
    console.error("Invoice payment error:", error)
    return NextResponse.json({ error: error.message || "Terjadi kesalahan server" }, { status: 500 })
  }
}
