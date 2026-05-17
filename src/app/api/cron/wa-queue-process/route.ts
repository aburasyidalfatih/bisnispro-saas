import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { sendWhatsAppDirect } from "@/lib/services/notification"

/**
 * CRON: Proses ulang pesan WA yang stuck di status PENDING.
 * Dijalankan setiap 5 menit via crontab VPS.
 * Hanya memproses pesan yang sudah PENDING > 1 menit (menghindari duplikasi dengan proses inline).
 */
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000)

    // Ambil pesan PENDING yang sudah > 1 menit (stuck)
    const pendingMessages = await db.waQueueLog.findMany({
      where: {
        status: "PENDING",
        createdAt: { lt: oneMinuteAgo }
      },
      orderBy: { createdAt: "asc" },
      take: 20, // Batch max 20 per run
    })

    if (pendingMessages.length === 0) {
      return NextResponse.json({ processed: 0, message: "No stuck messages" })
    }

    logger.info(`WA Queue Cron: Processing ${pendingMessages.length} stuck messages`)

    let sent = 0
    let failed = 0

    for (const msg of pendingMessages) {
      try {
        const res = await sendWhatsAppDirect(msg.targetNumber, msg.message, msg.tenantId)

        if (res.success) {
          await db.waQueueLog.update({
            where: { id: msg.id },
            data: { status: "SENT", sentAt: new Date() }
          })
          sent++
        } else {
          await db.waQueueLog.update({
            where: { id: msg.id },
            data: { status: "FAILED", error: res.error || "Unknown error", sentAt: new Date() }
          })
          failed++
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
