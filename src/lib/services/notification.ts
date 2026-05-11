import { db } from "@/lib/db"
import nodemailer from "nodemailer"
import { logger } from "@/lib/logger"

// ==================== EMAIL ====================

async function getEmailTransporter(tenantId?: string) {
  if (tenantId) {
    const tenant = await db.tenant.findUnique({
      where: { id: tenantId },
      select: { settings: true },
    })
    const settings = (tenant?.settings as Record<string, any>) || {}
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
  
  try {
    const res = await config.transporter.sendMail({
      from: config.fromName ? `"${config.fromName}" <${config.from}>` : config.from,
      to,
      subject,
      html,
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
    where: { key: { in: ["STARSENDER_API_URL", "STARSENDER_API_KEY", "STARSENDER_DEVICE_ID", "WA_ACTIVE_PROVIDER", "META_WA_PHONE_NUMBER_ID", "META_WA_ACCESS_TOKEN", "STARSENDER_DELAY_MIN", "STARSENDER_DELAY_MAX"] } },
  })
  const map = Object.fromEntries(
    platformSettings.filter((s) => s.value).map((s) => [s.key, s.value!])
  )
  return {
    provider: map.WA_ACTIVE_PROVIDER || "internal",
    apiUrl: map.STARSENDER_API_URL || process.env.STARSENDER_API_URL || "https://api.starsender.online/api",
    apiKey: map.STARSENDER_API_KEY || process.env.STARSENDER_API_KEY || "",
    deviceId: map.STARSENDER_DEVICE_ID || process.env.STARSENDER_DEVICE_ID,
    metaPhoneId: map.META_WA_PHONE_NUMBER_ID,
    metaToken: map.META_WA_ACCESS_TOKEN,
    delayMin: Number(map.STARSENDER_DELAY_MIN || 0),
    delayMax: Number(map.STARSENDER_DELAY_MAX || 0),
  }
}


/**
 * Fungsi pengiriman WA terpusat — Memprioritaskan Internal Gateway, fallback ke StarSender.
 */
export async function sendWhatsApp(
  phone: string,
  message: string,
  tenantId?: string
): Promise<{ success: boolean; error?: string }> {
  
  const config = await getWaConfig(tenantId)

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

  // 1. Coba gunakan Internal Gateway jika ada sesi yang CONNECTED (dan provider = internal)
  if (!config.provider || config.provider === "internal") {
    try {
      const session = await db.waSession.findUnique({
        where: { tenantId: tenantId || "platform" }
      })

      if (session?.status === "CONNECTED") {
        const WA_GATEWAY_URL = process.env.WA_GATEWAY_URL || "http://localhost:4000"
        const INTERNAL_SECRET = process.env.INTERNAL_API_SECRET || ""

        const res = await fetch(`${WA_GATEWAY_URL}/api/wa/send`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-internal-secret": INTERNAL_SECRET
          },
          body: JSON.stringify({
            tenantId: tenantId || "platform",
            to: phone,
            text: message
          })
        })

        if (res.ok) {
          return { success: true }
        } else {
          const errText = await res.text()
          logger.error("Internal WA Gateway send failed", { phone, status: res.status, body: errText })
        }
      }
    } catch (err) {
      // Abaikan jika tidak ada tabel atau error koneksi DB saat cari session
    }
  }

  // 2. Fallback ke StarSender (Legacy / starsender provider)
  if (!config.apiKey) {
    return { success: false, error: "WA gateway belum dikonfigurasi" }
  }

  try {
    // Implement random delay if configured
    if (config.delayMin && config.delayMax && config.delayMax > 0) {
      const minMs = config.delayMin * 1000;
      const maxMs = config.delayMax * 1000;
      const delay = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
      if (delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

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
            params.tenantId
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
