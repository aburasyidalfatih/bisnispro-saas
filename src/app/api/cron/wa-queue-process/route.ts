import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { getWaConfig } from "@/lib/services/notification"

/**
 * CRON: Proses ulang pesan WA yang stuck di status PENDING.
 * Dijalankan setiap 5 menit via crontab VPS.
 * TANPA delay per-pesan (delay hanya untuk real-time send, bukan retry).
 */
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000)

    const pendingMessages = await db.waQueueLog.findMany({
      where: {
        status: "PENDING",
        createdAt: { lt: oneMinuteAgo }
      },
      orderBy: { createdAt: "asc" },
      take: 10,
    })

    if (pendingMessages.length === 0) {
      return NextResponse.json({ processed: 0, message: "No stuck messages" })
    }

    logger.info(`WA Queue Cron: Processing ${pendingMessages.length} stuck messages`)

    // Get WA config once
    const config = await getWaConfig()
    
    if (!config.apiKey && config.provider !== "meta") {
      logger.error("WA Queue Cron: No WA gateway configured")
      return NextResponse.json({ error: "WA gateway not configured" }, { status: 500 })
    }

    let sent = 0
    let failed = 0

    for (const msg of pendingMessages) {
      try {
        // Kirim langsung ke StarSender TANPA delay (delay sudah seharusnya hanya untuk real-time)
        const result = await sendDirectNoDelay(msg.targetNumber, msg.message, config)

        if (result.success) {
          await db.waQueueLog.update({
            where: { id: msg.id },
            data: { status: "SENT", sentAt: new Date() }
          })
          sent++
          logger.info(`WA Cron: Sent to ${msg.targetNumber} (log: ${msg.id})`)
        } else {
          await db.waQueueLog.update({
            where: { id: msg.id },
            data: { status: "FAILED", error: result.error || "Unknown error", sentAt: new Date() }
          })
          failed++
          logger.error(`WA Cron: Failed for ${msg.targetNumber}: ${result.error}`)
        }

        // Small delay between messages to be polite to API (2 seconds, not 120!)
        if (pendingMessages.indexOf(msg) < pendingMessages.length - 1) {
          await new Promise(r => setTimeout(r, 2000))
        }
      } catch (err: any) {
        await db.waQueueLog.update({
          where: { id: msg.id },
          data: { status: "FAILED", error: err.message, sentAt: new Date() }
        }).catch(() => {})
        failed++
      }
    }

    logger.info(`WA Queue Cron: Done. Sent=${sent}, Failed=${failed}`)
    return NextResponse.json({ processed: pendingMessages.length, sent, failed })
  } catch (error: any) {
    logger.error("WA Queue Cron error", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * Kirim WA langsung ke StarSender/Meta TANPA delay.
 * Digunakan khusus oleh cron untuk retry stuck messages.
 */
async function sendDirectNoDelay(
  phone: string, 
  message: string, 
  config: Awaited<ReturnType<typeof getWaConfig>>
): Promise<{ success: boolean; error?: string }> {
  try {
    // META API
    if (config.provider === "meta") {
      if (!config.metaPhoneId || !config.metaToken) {
        return { success: false, error: "Meta API credentials not configured" }
      }
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
        return { success: false, error: `Meta API error: ${res.status} - ${errText}` }
      }
      return { success: true }
    }

    // STARSENDER
    if (!config.apiKey) {
      return { success: false, error: "StarSender API key not configured" }
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
      return { success: false, error: `StarSender error: ${res.status} - ${errText}` }
    }

    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}
