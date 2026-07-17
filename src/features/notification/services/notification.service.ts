import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { sendEmail } from "./email.service"
import { sendWhatsApp, TemplateData } from "./whatsapp.service"
import { createInAppNotification } from "./inapp.service"

// Re-export semua fungsi agar file lain yang mengimport notification.service.ts tidak error
export * from "./email.service"
export * from "./whatsapp.service"
export * from "./inapp.service"

// ==================== UNIFIED SEND ====================

export async function sendNotification(params: {
  tenantId?: string
  userId: string
  title: string
  message: string
  type?: string
  channels?: ("inapp" | "email" | "whatsapp")[]
  waTemplateData?: TemplateData
  metadata?: { actionUrl?: string; [key: string]: any }
}) {
  const channels = params.channels || ["inapp"]

  const [settings, user] = await Promise.all([
    db.notificationSetting.findMany({ where: { userId: params.userId } }),
    db.user.findUnique({ where: { id: params.userId } }),
  ])

  for (const channel of channels) {
    const setting = settings.find((s) => s.channel === channel)
    if (setting && !setting.enabled) continue

    switch (channel) {
      case "inapp":
        await createInAppNotification(params)
        break
      case "email":
        if (user?.email) {
          const actionHtml = params.metadata?.actionUrl 
            ? `<br><br><a href="https://${process.env.NEXT_PUBLIC_APP_DOMAIN}${params.metadata.actionUrl}" style="display:inline-block;padding:10px 20px;background-color:#4F46E5;color:white;text-decoration:none;border-radius:6px;font-weight:bold;">Tindak Lanjut</a>` 
            : ""
          await sendEmail(
            user.email,
            params.title,
            `<p>${params.message}</p>${actionHtml}`,
            params.tenantId
          )
        }
        break
      case "whatsapp":
        if (user?.phone) {
          const actionText = params.metadata?.actionUrl 
            ? `\n\n🔗 *Tindak Lanjut:* https://${process.env.NEXT_PUBLIC_APP_DOMAIN}${params.metadata.actionUrl}` 
            : ""
          await sendWhatsApp(
            user.phone,
            `${params.title}\n\n${params.message}${actionText}`,
            params.tenantId,
            params.waTemplateData
          )
        }
        break
    }
  }
}

export async function notifyTenantAdmins(tenantId: string, params: {
  title: string
  message: string
  type?: "info" | "success" | "warning" | "error"
  channels?: ("inapp" | "email" | "whatsapp")[]
  metadata?: { actionUrl?: string; [key: string]: any }
}) {
  const admins = await db.tenantUser.findMany({
    where: {
      tenantId,
      role: { in: ["admin", "owner"] }
    },
    include: { user: true }
  })

  for (const admin of admins) {
    if (admin.userId) {
      await sendNotification({
        tenantId,
        userId: admin.userId,
        title: params.title,
        message: params.message,
        type: params.type || "info",
        channels: params.channels || ["inapp", "email", "whatsapp"],
        metadata: params.metadata
      })
    }
  }
}

export async function processTemplateNotification({
  tenantId,
  templateId,
  variables,
  targetUserId,
}: {
  tenantId: string
  templateId: string
  variables: Record<string, string>
  targetUserId?: string
}) {
  const tenant = await db.tenant.findUnique({
    where: { id: tenantId },
    select: { settings: true, name: true },
  })

  if (!tenant) return

  const settings = (tenant.settings as Record<string, any>) || {}
  
  const defaults: Record<string, {title: string, message: string}> = {
    invoice_created: {
      title: "Tagihan Baru: {{invoiceTitle}}",
      message: "Halo, ada tagihan baru untuk ananda {{studentName}} sebesar Rp {{amount}}. Jatuh tempo pada {{dueDate}}. Silakan lakukan pembayaran melalui aplikasi."
    },
    payment_success: {
      title: "Pembayaran Berhasil: {{invoiceTitle}}",
      message: "Terima kasih, pembayaran sebesar Rp {{amountPaid}} untuk tagihan {{invoiceTitle}} ananda {{studentName}} telah berhasil kami terima."
    },
    wallet_topup: {
      title: "Top-up Saldo Berhasil",
      message: "Top-up saldo E-Kantin ananda {{studentName}} sebesar Rp {{amount}} telah berhasil. Saldo saat ini: Rp {{newBalance}}."
    },
    attendance_alert: {
      title: "Info Kehadiran: {{studentName}}",
      message: "Ananda {{studentName}} tercatat dengan status: {{status}} pada pukul {{time}}."
    },
    canteen_transaction: {
      title: "Transaksi E-Kantin",
      message: "Info Transaksi: Ananda {{studentName}} baru saja melakukan pembelian di {{merchantName}} sebesar Rp {{amount}}. Sisa saldo dompet saat ini: Rp {{newBalance}}."
    },
    discipline_alert: {
      title: "Pemberitahuan Kedisiplinan Siswa",
      message: "Bapak/Ibu Wali Murid, menginformasikan bahwa ananda {{studentName}} mendapat catatan terkait: {{violation}} (Poin: {{points}}). Harap hubungi pihak BK {{schoolName}} untuk detail lebih lanjut."
    },
    invoice_overdue: {
      title: "Peringatan Jatuh Tempo: {{invoiceTitle}}",
      message: "Pemberitahuan dari {{schoolName}}. Tagihan {{invoiceTitle}} ananda {{studentName}} sebesar Rp {{amountDue}} telah/akan jatuh tempo pada {{dueDate}}. Mohon segera lakukan pembayaran."
    }
  }

  let titleTemplate = settings[`${templateId}_title`] || defaults[templateId]?.title || "Pemberitahuan"
  let messageTemplate = settings[`${templateId}_message`] || defaults[templateId]?.message || ""

  const enableEmail = settings[`${templateId}_enable_email`] ?? true
  const enableWa = settings[`${templateId}_enable_wa`] ?? true
  const enableApp = settings[`${templateId}_enable_app`] ?? true

  const channels: ("email" | "whatsapp" | "inapp")[] = []
  if (enableEmail) channels.push("email")
  if (enableWa) channels.push("whatsapp")
  if (enableApp) channels.push("inapp")

  if (channels.length === 0 || !targetUserId) return

  // Automatically inject schoolName
  if (!variables["schoolName"]) {
    variables["schoolName"] = tenant.name
  }

  // Replace variables
  let title = titleTemplate
  let message = messageTemplate
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, "g")
    title = title.replace(regex, value)
    message = message.replace(regex, value)
  }

  // Khusus penanganan PDF link agar tidak merusak urutan/jumlah variabel Meta Template
  let buttonVariables: string[] | undefined
  const wavioVars = { ...variables }
  
  if (wavioVars.pdfUrl) {
    message += `\n\n📄 Unduh Invoice PDF:\n${wavioVars.pdfUrl}`
    buttonVariables = [wavioVars.pdfUrl.split('/').slice(3).join('/')] // Ambil relative path e.g. 'api/public/...'
    delete wavioVars.pdfUrl
  }

  await sendNotification({
    tenantId,
    userId: targetUserId,
    title,
    message,
    type: "info",
    channels,
    waTemplateData: {
      name: settings[`WAVIO_TEMPLATE_${templateId}`] || templateId,
      variables: wavioVars, // Variabel sisa yang sudah dibersihkan
      buttonVariables
    }
  })
}

export async function sendTemplateNotification(payload: {
  tenantId: string
  templateId: string
  variables: Record<string, string>
  targetUserId?: string
}) {
  if (!payload.targetUserId) return
  // Process langsung (Inngest tidak aktif di Docker)
  try {
    await processTemplateNotification(payload)
  } catch (err: any) {
    logger.error("sendTemplateNotification failed", err)
  }
}
