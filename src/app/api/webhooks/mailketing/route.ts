import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"

/**
 * Webhook handler untuk Mailketing.
 * URL endpoint: POST /api/webhooks/mailketing
 * Menerima event: bounce, open, click, unsubscribe
 */
export async function POST(req: Request) {
  try {
    const body = await req.json()
    logger.info("Mailketing Webhook Received", body)

    // Deteksi tipe event dari Mailketing (bisa "event", "type", atau "status" tergantung payload asli)
    const event = (body.event || body.type || body.status || "").toString().toLowerCase()
    const email = (body.email || body.recipient || "").toString().toLowerCase()

    if (!email) {
      return NextResponse.json({ message: "No email provided in payload" }, { status: 400 })
    }

    // Cari log pengiriman terakhir ke email ini yang berstatus SENT
    const lastLog = await db.emailQueueLog.findFirst({
      where: { to: email, status: "SENT" },
      orderBy: { createdAt: "desc" }
    })

    if (!lastLog) {
      return NextResponse.json({ message: "No matching email log found" }, { status: 200 })
    }

    const now = new Date()

    if (event.includes("bounce") || event.includes("failed")) {
      await db.emailQueueLog.update({
        where: { id: lastLog.id },
        data: { status: "BOUNCED", bouncedAt: now, errorMessage: JSON.stringify(body) }
      })
    } else if (event.includes("open")) {
      await db.emailQueueLog.update({
        where: { id: lastLog.id },
        data: { openedAt: now }
      })
    } else if (event.includes("click")) {
      await db.emailQueueLog.update({
        where: { id: lastLog.id },
        data: { clickedAt: now }
      })
    }

    return NextResponse.json({ success: true, message: "Webhook processed" })
  } catch (error: any) {
    logger.error("Mailketing Webhook Error", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
