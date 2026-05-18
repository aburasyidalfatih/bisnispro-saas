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

  static async createBulkInvoices(data: CreateBulkInvoiceDTO) {
    const billingType = await db.billingType.findUnique({
      where: { id: data.billingTypeId }
    })

    if (!billingType) throw new Error("Billing Type tidak ditemukan")

    // Ambil semua siswa aktif di tenant ini
    const students = await db.student.findMany({
      where: { tenantId: data.tenantId, deletedAt: null },
      select: { id: true }
    })

    if (students.length === 0) return { count: 0 }

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

    // Offload notifikasi ke background job
    // (Dalam kasus ribuan siswa, notifikasi disarankan ditaruh ke queue lain untuk menghindari timeout, 
    // tapi karena worker diproses di background, kita bisa memanggil fungsi broadcast langsung secara batch di sini jika perlu, 
    // atau biarkan user melihat tagihan di app)

    return { count: createdCount.count }
  }

  static async processPayment(data: PayInvoiceDTO) {
    const { tenantId, invoiceId, amount, method, proofUrl, notes, userId } = data

    const invoice = await db.invoice.findFirst({
      where: { id: invoiceId, tenantId, deletedAt: null },
      include: { student: { include: { walletAccount: true, parents: true } } },
    })

    if (!invoice) throw new Error("Tagihan tidak ditemukan")
    if (invoice.status === "PAID") throw new Error("Tagihan sudah lunas")

    if (method === "WALLET") {
      const wallet = invoice.student.walletAccount
      if (!wallet) throw new Error("Siswa tidak memiliki wallet")
      if (wallet.balance < amount) throw new Error("Saldo tidak mencukupi")

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
      include: { 
        invoice: {
          include: { student: { include: { parents: true } } }
        } 
      },
    })

    if (!payment) throw new Error("Data pembayaran tidak ditemukan")
    if (payment.tenantId !== tenantId) throw new Error("Unauthorized")
    if (payment.status !== "PENDING") throw new Error("Pembayaran sudah diproses sebelumnya (Idempotency Protected)")

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

    return { message: `Pembayaran ${action === "VERIFIED" ? "diverifikasi" : "ditolak"}` }
  }
}
