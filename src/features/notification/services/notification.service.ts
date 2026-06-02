import { db } from "@/lib/db"
import nodemailer from "nodemailer"
import { logger } from "@/lib/logger"

// ==================== EMAIL ====================

async function getEmailTransporter(tenantId?: string) {
  if (tenantId) {
    const tenant = await db.tenant.findUnique({
      where: { id: tenantId },
      select: { settings: true, plan: true },
    })
    
    // Hanya paket berbayar (pro/enterprise/premium) yang bisa pakai SMTP sendiri
    // Jika paket free, maka otomatis jatuh ke SMTP platform
    if (tenant && (tenant.plan === "pro" || tenant.plan === "enterprise" || tenant.plan === "premium")) {
      const settings = (tenant.settings as Record<string, any>) || {}
      if (settings.smtp?.smtpHost && settings.smtp?.smtpUser && settings.smtp?.smtpPass) {
        return {
          transporter: nodemailer.createTransport({
            host: settings.smtp.smtpHost,
            port: Number(settings.smtp.smtpPort) || 587,
            secure: Number(settings.smtp.smtpPort) === 465,
            auth: { user: settings.smtp.smtpUser, pass: settings.smtp.smtpPass },
          }),
          from: settings.smtp.smtpFrom || settings.smtp.smtpUser,
          fromName: settings.smtp.smtpFromName || "",
        }
      }
    }
  }
  // Fallback ke platform settings dari database
  const platformSettings = await db.platformSetting.findMany({
    where: { key: { in: ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS", "SMTP_FROM"] } },
  })
  const map = Object.fromEntries(
    platformSettings.filter((s) => s.value).map((s) => [s.key, s.value!])
  )

  const host = map.SMTP_HOST || process.env.SMTP_HOST
  const port = Number(map.SMTP_PORT || process.env.SMTP_PORT) || 587
  const user = map.SMTP_USER || process.env.SMTP_USER
  const pass = map.SMTP_PASS || process.env.SMTP_PASS
  const from = map.SMTP_FROM || process.env.SMTP_FROM || user

  if (!host || !user || !pass) {
    return null
  }

  return {
    transporter: nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    }),
    from: from,
    fromName: "SchoolPro",
  }
}

export async function sendEmail(to: string, subject: string, html: string, tenantId?: string) {
  const config = await getEmailTransporter(tenantId)
  if (!config) return { success: false, error: "SMTP belum dikonfigurasi" }
  
  // Pastikan html dibungkus dengan tag standar agar tidak dibaca kosong oleh klien email tertentu
  const wrappedHtml = html.toLowerCase().includes("<html") ? html : `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: sans-serif;">
  ${html}
</body>
</html>
  `.trim()

  try {
    const res = await config.transporter.sendMail({
      from: config.fromName ? `"${config.fromName}" <${config.from}>` : config.from,
      to,
      subject,
      html: wrappedHtml,
    })
    return { success: true, res }
  } catch (error: any) {
    logger.error("Email send failed", error)
    return { success: false, error: error.message }
  }
}

// ==================== WHATSAPP (Platform Gateway) ====================

export interface WaConfig {
  apiUrl: string
  apiKey: string
  deviceId?: string
  provider?: string
  metaPhoneId?: string
  metaToken?: string
  wavioApiKey?: string
  wavioNumberId?: string
  delayMin?: number
  delayMax?: number
}

/**
 * Mengambil konfigurasi WhatsApp per-tenant atau fallback ke platform settings.
 * Digunakan untuk notifikasi kontekstual dalam dashboard tenant.
 */
export async function getWaConfig(tenantId?: string): Promise<WaConfig> {
  if (tenantId) {
    const tenant = await db.tenant.findUnique({
      where: { id: tenantId },
      select: { settings: true },
    })
    const settings = (tenant?.settings as Record<string, any>) || {}
    if (settings.whatsapp?.waApiKey) {
      return {
        apiUrl: settings.whatsapp.waApiUrl || "https://api.starsender.online/api",
        apiKey: settings.whatsapp.waApiKey,
        deviceId: settings.whatsapp.waDeviceId,
        provider: "starsender",
        delayMin: Number(settings.whatsapp.waDelayMin || 0),
        delayMax: Number(settings.whatsapp.waDelayMax || 0),
      }
    }
  }
  // Fallback ke platform settings dari database, lalu env var
  const platformSettings = await db.platformSetting.findMany({
    where: { key: { in: ["STARSENDER_API_URL", "STARSENDER_API_KEY", "STARSENDER_DEVICE_ID", "WA_ACTIVE_PROVIDER", "META_WA_PHONE_NUMBER_ID", "META_WA_ACCESS_TOKEN", "WAVIO_API_KEY", "WAVIO_NUMBER_ID", "STARSENDER_DELAY_MIN", "STARSENDER_DELAY_MAX"] } },
  })
  const map = Object.fromEntries(
    platformSettings.filter((s) => s.value).map((s) => [s.key, s.value!])
  )
  
  let provider = map.WA_ACTIVE_PROVIDER || "internal";
  
  // Permintaan khusus: Jangan gunakan Wavio untuk Tenant. Hanya untuk Super Admin.
  if (tenantId && provider === "wavio") {
    provider = "starsender";
  }

  return {
    provider,
    apiUrl: map.STARSENDER_API_URL || process.env.STARSENDER_API_URL || "https://api.starsender.online/api",
    apiKey: map.STARSENDER_API_KEY || process.env.STARSENDER_API_KEY || "",
    deviceId: map.STARSENDER_DEVICE_ID || process.env.STARSENDER_DEVICE_ID,
    metaPhoneId: map.META_WA_PHONE_NUMBER_ID,
    metaToken: map.META_WA_ACCESS_TOKEN,
    wavioApiKey: map.WAVIO_API_KEY,
    wavioNumberId: map.WAVIO_NUMBER_ID,
    delayMin: Number(map.WA_DELAY_MIN) || Number(map.STARSENDER_DELAY_MIN) || 0,
    delayMax: Number(map.WA_DELAY_MAX) || Number(map.STARSENDER_DELAY_MAX) || 0,
  }
}


import { enqueueWhatsApp } from "./wa-queue.service"

export interface TemplateData {
  name: string
  language?: string
  variables?: Record<string, string>
}

/**
 * Fungsi pengiriman WA terpusat — Memprioritaskan Internal Gateway, fallback ke StarSender.
 * Fungsi ini melempar pesan ke dalam BullMQ agar aman dari restart server.
 */
export async function sendWhatsApp(
  phone: string,
  message: string,
  tenantId?: string,
  templateData?: TemplateData
): Promise<{ success: boolean; error?: string }> {
  return enqueueWhatsApp(phone, message, tenantId, templateData);
}

/**
 * Fungsi eksekusi asli yang akan dipanggil oleh Worker BullMQ atau untuk Uji Coba langsung.
 */
export async function sendWhatsAppDirect(
  phone: string,
  message: string,
  tenantId?: string | null,
  templateData?: TemplateData
): Promise<{ success: boolean; error?: string }> {
  
  try {
        const config = await getWaConfig(tenantId || undefined)

        // Implement random delay for ALL providers
        const safeMin = config.delayMin && config.delayMin > 0 ? config.delayMin : 3;
        const safeMax = config.delayMax && config.delayMax > 0 ? config.delayMax : 8;
        
        const minMs = safeMin * 1000;
        const maxMs = Math.max(minMs, safeMax * 1000);
        
        const delay = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
        if (delay > 0) {
          await new Promise(r => setTimeout(r, delay));
        }

        // 0. META OFFICIAL API
        if (config.provider === "meta") {
          if (!config.metaPhoneId || !config.metaToken) {
            return { success: false, error: "Meta API credentials not configured" }
          }
          try {
            let toPhone = phone.replace(/\D/g, "")
            if (toPhone.startsWith("0")) toPhone = "62" + toPhone.slice(1)
            
            const res = await fetch(`https://graph.facebook.com/v18.0/${config.metaPhoneId}/messages`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${config.metaToken}`,
              },
              body: JSON.stringify({
                messaging_product: "whatsapp",
                to: toPhone,
                type: "text",
                text: { body: message },
              }),
            })

            if (!res.ok) {
              const errText = await res.text()
              logger.error("Meta WA send failed", { phone, status: res.status, body: errText })
              return { success: false, error: `Meta API error: ${res.status}` }
            }
            return { success: true }
          } catch (err: any) {
            logger.error("Meta WA exception", err, { phone })
            return { success: false, error: err.message }
          }
        }

        // 1. WAVIO API
        if (config.provider === "wavio") {
          if (!config.wavioApiKey || !config.wavioNumberId) {
            return { success: false, error: "Wavio API credentials not configured" }
          }
          try {
            let toPhone = phone.replace(/\D/g, "")
            if (toPhone.startsWith("0")) toPhone = "62" + toPhone.slice(1)
            if (!toPhone.startsWith("+")) toPhone = "+" + toPhone
            
            let wavioUrl = `https://api.wavio.web.id/api/v1/public/messages/send`
            let requestBody: any = {
              numberId: config.wavioNumberId,
              to: toPhone,
              text: message,
            }

            if (templateData && templateData.name) {
              wavioUrl = `https://api.wavio.web.id/api/v1/public/messages/send-template`
              
              // Wavio expects components for variables?
              // The API docs say components: array
              const components = []
              if (templateData.variables && Object.keys(templateData.variables).length > 0) {
                 const parameters = Object.keys(templateData.variables).map(key => ({
                    type: "text",
                    text: templateData.variables![key]
                 }))
                 components.push({
                   type: "body",
                   parameters
                 })
              }

              requestBody = {
                numberId: config.wavioNumberId,
                to: toPhone,
                templateName: templateData.name,
                templateLanguage: templateData.language || "id",
                components,
              }
            }
            
            const res = await fetch(wavioUrl, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "X-API-Key": config.wavioApiKey,
              },
              body: JSON.stringify(requestBody),
            })

            const result = await res.json().catch(() => ({}))
            if (!res.ok || !result.success) {
              logger.error("Wavio send failed", { phone, status: res.status, body: result })
              return { success: false, error: `Wavio API error: ${result.message || res.status}` }
            }
            return { success: true }
          } catch (err: any) {
            logger.error("Wavio WA exception", err, { phone })
            return { success: false, error: err.message }
          }
        }

        // Internal Gateway Has Been Removed

        // 2. Fallback ke StarSender (Legacy / starsender provider)
        if (!config.apiKey) {
          return { success: false, error: "WA gateway belum dikonfigurasi" }
        }

        try {

          const body: Record<string, string> = {
            messageType: "text",
            to: phone,
            body: message,
          }
          if (config.deviceId) body.deviceId = config.deviceId

          const res = await fetch(`${config.apiUrl}/send`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: config.apiKey,
            },
            body: JSON.stringify(body),
          })

          if (!res.ok) {
            const errText = await res.text()
            logger.error("WA send failed (StarSender)", { phone, status: res.status, body: errText })
            return { success: false, error: `StarSender error: ${res.status}` }
          }

          return { success: true }
        } catch (err: any) {
          logger.error("WA send exception (StarSender)", err, { phone })
          return { success: false, error: err.message }
        }
      } catch (err: any) {
        logger.error("Fatal queue exception", err)
        return { success: false, error: err.message }
      }
}

// ==================== IN-APP NOTIFICATION ====================

export async function createInAppNotification(params: {
  tenantId?: string
  userId: string
  title: string
  message: string
  type?: string
}) {
  return db.notification.create({
    data: {
      tenantId: params.tenantId,
      userId: params.userId,
      title: params.title,
      message: params.message,
      type: params.type || "info",
      channel: "inapp",
    },
  })
}

// ==================== UNIFIED SEND ====================

export async function sendNotification(params: {
  tenantId?: string
  userId: string
  title: string
  message: string
  type?: string
  channels?: ("inapp" | "email" | "whatsapp")[]
  waTemplateData?: TemplateData
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
          await sendEmail(
            user.email,
            params.title,
            `<p>${params.message}</p>`,
            params.tenantId
          )
        }
        break
      case "whatsapp":
        if (user?.phone) {
          await sendWhatsApp(
            user.phone,
            `${params.title}\n\n${params.message}`,
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
        channels: params.channels || ["inapp", "email", "whatsapp"]
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

  await sendNotification({
    tenantId,
    userId: targetUserId,
    title,
    message,
    type: "info",
    channels,
    waTemplateData: {
      name: settings[`WAVIO_TEMPLATE_${templateId}`] || templateId,
      variables // we pass raw variables, Wavio/Meta will receive them in Object.keys order
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
