import { db } from "@/lib/db"
import nodemailer from "nodemailer"
import { logger } from "@/lib/logger"

export async function getEmailTransporter(tenantId?: string) {
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
  if (!config) {
    // Tetap catat ke antrean jika SMTP belum ada (siapa tahu nanti diisi)
    await db.emailQueueLog.create({
      data: {
        to, subject, html, tenantId, status: "PENDING", errorMessage: "SMTP belum dikonfigurasi"
      }
    }).catch(e => logger.error("Failed queuing email", e))
    return { success: false, error: "SMTP belum dikonfigurasi" }
  }
  
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
    
    // Log as SENT
    await db.emailQueueLog.create({
      data: {
        to,
        subject,
        html: wrappedHtml,
        tenantId,
        status: "SENT",
        sentAt: new Date()
      }
    }).catch(e => logger.error("Failed logging email sent", e))

    return { success: true, res }
  } catch (error: any) {
    logger.error("Email send failed, queuing for retry", error)
    
    // Log as PENDING for retry
    await db.emailQueueLog.create({
      data: {
        to,
        subject,
        html: wrappedHtml,
        tenantId,
        status: "PENDING",
        errorMessage: error.message
      }
    }).catch(e => logger.error("Failed queuing email", e))

    return { success: false, error: error.message }
  }
}

export async function processEmailQueueCron() {
  // Ambil maksimal 50 antrean PENDING
  const queues = await db.emailQueueLog.findMany({
    where: {
      status: "PENDING",
      retryCount: { lt: 3 }
    },
    take: 50,
    orderBy: { createdAt: "asc" }
  })

  if (queues.length === 0) return { processed: 0 }

  let successCount = 0
  let failCount = 0

  for (const q of queues) {
    const config = await getEmailTransporter(q.tenantId || undefined)
    
    if (!config) {
      await db.emailQueueLog.update({
        where: { id: q.id },
        data: {
          retryCount: q.retryCount + 1,
          errorMessage: "SMTP belum dikonfigurasi",
          status: q.retryCount + 1 >= 3 ? "FAILED" : "PENDING"
        }
      })
      failCount++
      continue
    }

    try {
      await config.transporter.sendMail({
        from: config.fromName ? `"${config.fromName}" <${config.from}>` : config.from,
        to: q.to,
        subject: q.subject,
        html: q.html,
      })

      await db.emailQueueLog.update({
        where: { id: q.id },
        data: { status: "SENT", sentAt: new Date() }
      })
      successCount++
    } catch (error: any) {
      await db.emailQueueLog.update({
        where: { id: q.id },
        data: {
          retryCount: q.retryCount + 1,
          errorMessage: error.message,
          status: q.retryCount + 1 >= q.maxRetries ? "FAILED" : "PENDING"
        }
      })
      failCount++
    }
  }

  return { processed: queues.length, successCount, failCount }
}
