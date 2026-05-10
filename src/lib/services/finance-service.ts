import { db } from "@/lib/db"
import { nanoid } from "nanoid"
import { sendNotification } from "@/lib/services/notification"
import { format } from "date-fns"
import { id as localeId } from "date-fns/locale"

interface CreateInvoiceDTO {
  tenantId: string;
  studentId: string;
  billingTypeId?: string;
  title: string;
  amount: number;
  dueDate: string | Date;
  month?: number;
  year?: number;
  notes?: string;
  installments?: { dueDate: string; amount: number }[];
}

interface PayInvoiceDTO {
  tenantId: string;
  invoiceId: string;
  amount: number;
  method: "WALLET" | "TRANSFER" | "CASH" | "TRIPAY";
  proofUrl?: string;
  notes?: string;
  userId: string;
}

interface VerifyPaymentDTO {
  tenantId: string;
  paymentId: string;
  action: "VERIFIED" | "REJECTED";
  notes?: string;
  userId: string;
}

export class FinanceService {
  static async createInvoice(data: CreateInvoiceDTO) {
    // Generate kode unik
    const code = `INV-${new Date().getFullYear()}-${(new Date().getMonth() + 1).toString().padStart(2, "0")}-${nanoid(6).toUpperCase()}`

    const invoice = await db.$transaction(async (tx) => {
      const inv = await tx.invoice.create({
        data: {
          tenantId: data.tenantId,
          code,
          studentId: data.studentId,
          title: data.title,
          amount: data.amount,
          amountDue: data.amount,
          dueDate: new Date(data.dueDate),
          month: data.month,
          year: data.year ?? new Date().getFullYear(),
          notes: data.notes,
          billingTypeId: data.billingTypeId,
          status: "UNPAID",
        },
      })

      // Buat cicilan jika ada
      if (data.installments && data.installments.length > 0) {
        await tx.installment.createMany({
          data: data.installments.map((ins) => ({
            invoiceId: inv.id,
            tenantId: data.tenantId,
            dueDate: new Date(ins.dueDate),
            amount: ins.amount,
          })),
        })
      }

      return inv
    })

    // Send Notification to Parents asynchronously
    this.sendInvoiceNotification(invoice).catch(err => {
      console.error("Gagal mengirim notifikasi invoice:", err)
    })

    return invoice
  }

  private static async sendInvoiceNotification(invoice: any) {
    const student = await db.student.findUnique({
      where: { id: invoice.studentId },
      include: { parents: true }
    })

    if (student && student.parents.length > 0) {
      const title = `Tagihan Baru: ${invoice.title}`
      const message = `Halo, ada tagihan baru untuk ananda ${student.name} sebesar Rp ${invoice.amountDue.toLocaleString('id-ID')}. Jatuh tempo pada ${format(invoice.dueDate, "d MMMM yyyy", { locale: localeId })}. Silakan lakukan pembayaran melalui aplikasi.`
      
      for (const parent of student.parents) {
          await sendNotification({
            tenantId: invoice.tenantId,
            userId: parent.userId,
            title,
            message,
            type: "warning",
            channels: ["inapp", "email", "whatsapp"]
          })
      }
    }
  }

  static async processPayment(data: PayInvoiceDTO) {
    const { tenantId, invoiceId, amount, method, proofUrl, notes, userId } = data

    const invoice = await db.invoice.findFirst({
      where: { id: invoiceId, tenantId, deletedAt: null },
      include: { student: { include: { walletAccount: true } } },
    })

    if (!invoice) throw new Error("Tagihan tidak ditemukan")
    if (invoice.status === "PAID") throw new Error("Tagihan sudah lunas")

    if (method === "WALLET") {
      const wallet = invoice.student.walletAccount
      if (!wallet) throw new Error("Siswa tidak memiliki wallet")
      if (wallet.balance < amount) throw new Error("Saldo tidak mencukupi")

      await db.$transaction(async (tx) => {
        const newBalance = wallet.balance - amount
        await tx.walletAccount.update({
          where: { id: wallet.id },
          data: { balance: newBalance },
        })

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

        const totalPaid = invoice.amountPaid + amount
        const isDone = totalPaid >= invoice.amount

        await tx.invoicePayment.create({
          data: {
            invoiceId,
            tenantId,
            amount,
            method: "WALLET",
            status: "VERIFIED",
            verifiedAt: new Date(),
            verifiedBy: userId,
            paidAt: new Date(),
            notes,
          },
        })

        await tx.invoice.update({
          where: { id: invoiceId },
          data: {
            amountPaid: totalPaid,
            amountDue: invoice.amount - totalPaid,
            status: isDone ? "PAID" : "PARTIAL",
          },
        })

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

      return { status: "VERIFIED", message: "Pembayaran via Wallet berhasil" }
    }

    // Metode lain (TRANSFER/CASH/TRIPAY) → status PENDING, tunggu verifikasi admin
    const invoicePayment = await db.invoicePayment.create({
      data: {
        invoiceId,
        tenantId,
        amount,
        method,
        proofUrl,
        status: "PENDING",
        notes,
        paidAt: new Date(),
      },
    })

    return { status: "PENDING", message: "Pembayaran tercatat, menunggu verifikasi admin", paymentId: invoicePayment.id }
  }

  static async verifyPayment(data: VerifyPaymentDTO) {
    const { tenantId, paymentId, action, notes, userId } = data

    const payment = await db.invoicePayment.findUnique({
      where: { id: paymentId },
      include: { invoice: true },
    })

    if (!payment) throw new Error("Data pembayaran tidak ditemukan")
    if (payment.tenantId !== tenantId) throw new Error("Unauthorized")

    await db.$transaction(async (tx) => {
      await tx.invoicePayment.update({
        where: { id: paymentId },
        data: {
          status: action,
          verifiedAt: new Date(),
          verifiedBy: userId,
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

    return { message: `Pembayaran ${action === "VERIFIED" ? "diverifikasi" : "ditolak"}` }
  }
}
