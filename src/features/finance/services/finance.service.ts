import { db } from "@/lib/db"
import { nanoid } from "nanoid"
import { format } from "date-fns"
import { id as localeId } from "date-fns/locale"

export interface CreateInvoiceDTO {
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

export interface CreateBulkInvoiceDTO {
  tenantId: string;
  billingTypeId: string; // Harus pakai template (misal: SPP Kelas 1)
  title: string;
  dueDate: string | Date;
  month?: number;
  year?: number;
  notes?: string;
  userId: string;
}

export interface PayInvoiceDTO {
  tenantId: string;
  invoiceId: string;
  amount: number;
  method: "WALLET" | "TRANSFER" | "CASH" | "TRIPAY";
  proofUrl?: string;
  notes?: string;
  userId: string;
}

export interface VerifyPaymentDTO {
  tenantId: string;
  paymentId: string;
  action: "VERIFIED" | "REJECTED";
  notes?: string;
  userId: string;
}

export type FinanceResultDTO<T = any> = {
  success: boolean
  data?: T
  error?: string
}

export class FinanceService {
  static async createInvoice(data: CreateInvoiceDTO): Promise<FinanceResultDTO> {
    try {
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

      return { success: true, data: invoice }
    } catch (error: any) {
      return { success: false, error: "Gagal membuat tagihan" }
    }
  }

  private static async sendInvoiceNotification(invoice: any) {
    const student = await db.student.findUnique({
      where: { id: invoice.studentId },
      include: { parents: true }
    })

    const tenant = await db.tenant.findUnique({
      where: { id: invoice.tenantId },
      select: { name: true }
    })

    if (student && student.parents.length > 0) {
      const { sendTemplateNotification } = await import("@/lib/services/notification")
      
      for (const parent of student.parents) {
        if (!parent.userId) continue

        await sendTemplateNotification({
          tenantId: invoice.tenantId,
          templateId: "invoice_created",
          variables: {
            studentName: student.name,
            amount: invoice.amountDue.toLocaleString('id-ID'),
            dueDate: format(new Date(invoice.dueDate), "d MMMM yyyy", { locale: localeId }),
            schoolName: tenant?.name || "Sekolah",
            invoiceTitle: invoice.title
          },
          targetUserId: parent.userId
        })
      }
    }
  }

  static async createBulkInvoices(data: CreateBulkInvoiceDTO): Promise<FinanceResultDTO> {
    try {
      const billingType = await db.billingType.findUnique({
        where: { id: data.billingTypeId }
      })

      if (!billingType) return { success: false, error: "Billing Type tidak ditemukan" }

      // Ambil semua siswa aktif di tenant ini
      const students = await db.student.findMany({
        where: { tenantId: data.tenantId, deletedAt: null },
        select: { id: true }
      })

      if (students.length === 0) return { success: true, data: { count: 0 } }

      const invoicesData = students.map(student => {
        const code = `INV-${(data.year || new Date().getFullYear())}-${((data.month || new Date().getMonth() + 1)).toString().padStart(2, "0")}-${nanoid(6).toUpperCase()}`
        return {
          tenantId: data.tenantId,
          code,
          studentId: student.id,
          title: data.title,
          amount: billingType.amount,
          amountDue: billingType.amount,
          dueDate: new Date(data.dueDate),
          month: data.month,
          year: data.year ?? new Date().getFullYear(),
          notes: data.notes,
          billingTypeId: data.billingTypeId,
          status: "UNPAID",
        }
      })

      // Insert massal
      const createdCount = await db.invoice.createMany({
        data: invoicesData,
        skipDuplicates: true
      })

      return { success: true, data: { count: createdCount.count } }
    } catch (error: any) {
      return { success: false, error: "Gagal membuat tagihan massal" }
    }
  }

  static async processPayment(data: PayInvoiceDTO): Promise<FinanceResultDTO> {
    try {
      const { tenantId, invoiceId, amount, method, proofUrl, notes, userId } = data

      const invoice = await db.invoice.findFirst({
        where: { id: invoiceId, tenantId, deletedAt: null },
        include: { student: { include: { walletAccount: true, parents: true } } },
      })

      if (!invoice) return { success: false, error: "Tagihan tidak ditemukan" }
      if (invoice.status === "PAID") return { success: false, error: "Tagihan sudah lunas" }

      if (method === "WALLET") {
        const wallet = invoice.student.walletAccount
        if (!wallet) return { success: false, error: "Siswa tidak memiliki wallet" }
        if (wallet.balance < amount) return { success: false, error: "Saldo tidak mencukupi" }

        await db.$transaction(async (tx) => {
          // Atomic decrement to prevent Race Conditions
          const updatedWallet = await tx.walletAccount.update({
            where: { id: wallet.id },
            data: { balance: { decrement: amount } },
          })
          const newBalance = updatedWallet.balance
          const balanceBefore = newBalance + amount

          await tx.walletTransaction.create({
            data: {
              walletId: wallet.id,
              tenantId,
              type: "PAYMENT",
              amount,
              balanceBefore: balanceBefore,
              balanceAfter: newBalance,
              referenceId: invoice.code,
              description: `Pembayaran: ${invoice.title}`,
              status: "SUCCESS",
            },
          })

          const updatedInvoice = await tx.invoice.update({
            where: { id: invoiceId },
            data: {
              amountPaid: { increment: amount },
              amountDue: { decrement: amount },
            },
          })

          // Atomic Status Update
          if (updatedInvoice.amountPaid >= updatedInvoice.amount && updatedInvoice.status !== "PAID") {
             await tx.invoice.update({ where: { id: invoiceId }, data: { status: "PAID" } })
          } else if (updatedInvoice.amountPaid < updatedInvoice.amount && updatedInvoice.status === "UNPAID") {
             await tx.invoice.update({ where: { id: invoiceId }, data: { status: "PARTIAL" } })
          }

          // Memastikan InvoicePayment dicatat untuk pembayaran Wallet
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

        // Offload Notification to Background Job
        const parents = invoice.student.parents || []
        if (parents.length > 0) {
          import("@/lib/services/notification").then(({ sendTemplateNotification }) => {
            for (const parent of parents) {
              if (!parent.userId) continue
              sendTemplateNotification({
                tenantId,
                templateId: "payment_success",
                variables: {
                  studentName: invoice.student.name,
                  invoiceTitle: invoice.title,
                  amountPaid: amount.toLocaleString("id-ID"),
                },
                targetUserId: parent.userId
              }).catch(err => console.error(err))
            }
          })
        }

        return { success: true, data: { status: "VERIFIED", message: "Pembayaran via Wallet berhasil" } }
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

      return { success: true, data: { status: "PENDING", message: "Pembayaran tercatat, menunggu verifikasi admin", paymentId: invoicePayment.id } }
    } catch (error: any) {
      return { success: false, error: "Gagal memproses pembayaran" }
    }
  }

  static async verifyPayment(data: VerifyPaymentDTO): Promise<FinanceResultDTO> {
    try {
      const { tenantId, paymentId, action, notes, userId } = data

      const payment = await db.invoicePayment.findUnique({
        where: { id: paymentId },
        include: { 
          invoice: {
            include: { student: { include: { parents: true } } }
          } 
        },
      })

      if (!payment) return { success: false, error: "Data pembayaran tidak ditemukan" }
      if (payment.tenantId !== tenantId) return { success: false, error: "Unauthorized" }
      if (payment.status !== "PENDING") return { success: false, error: "Pembayaran sudah diproses sebelumnya (Idempotency Protected)" }

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

          const updatedInvoice = await tx.invoice.update({
            where: { id: invoice.id },
            data: {
              amountPaid: { increment: payment.amount },
              amountDue: { decrement: payment.amount },
            },
          })

          if (updatedInvoice.amountPaid >= updatedInvoice.amount && updatedInvoice.status !== "PAID") {
             await tx.invoice.update({ where: { id: invoice.id }, data: { status: "PAID" } })
          } else if (updatedInvoice.amountPaid < updatedInvoice.amount && updatedInvoice.status === "UNPAID") {
             await tx.invoice.update({ where: { id: invoice.id }, data: { status: "PARTIAL" } })
          }

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

      if (action === "VERIFIED") {
        const student = payment.invoice.student
        if (student && student.parents.length > 0) {
          import("@/lib/services/notification").then(({ sendTemplateNotification }) => {
            for (const parent of student.parents) {
              if (!parent.userId) continue
              sendTemplateNotification({
                tenantId,
                templateId: "payment_success",
                variables: {
                  studentName: student.name,
                  invoiceTitle: payment.invoice.title,
                  amountPaid: payment.amount.toLocaleString("id-ID"),
                },
                targetUserId: parent.userId
              }).catch(err => console.error(err))
            }
          })
        }
      }

      return { success: true, data: { message: `Pembayaran ${action === "VERIFIED" ? "diverifikasi" : "ditolak"}` } }
    } catch (error: any) {
      return { success: false, error: "Terjadi kesalahan saat memverifikasi pembayaran" }
    }
  }
}
