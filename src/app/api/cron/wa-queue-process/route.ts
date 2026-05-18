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

    let enqueued = 0

    for (const msg of pendingMessages) {
      try {
        // Dorong kembali pesan yang nyangkut ke BullMQ
        const { waQueue } = await import("@/lib/queue")
        await waQueue.add(
          "send-wa",
          { tenantId: msg.tenantId || null, number: msg.targetNumber, message: msg.message, waQueueLogId: msg.id },
          { jobId: msg.id } // Gunakan ID log agar tidak duplikat di BullMQ
        )
        enqueued++
      } catch (err: any) {
        logger.error(`WA Cron: Failed to enqueue log ${msg.id}`, err)
      }
    }

    logger.info(`WA Queue Cron: Done. Enqueued=${enqueued}`)

    // Cleanup logs older than 3 days
    const threeDaysAgo = new Date()
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)
    const cleanupRes = await db.waQueueLog.deleteMany({
      where: { createdAt: { lt: threeDaysAgo } }
    })
    
    return NextResponse.json({ processed: pendingMessages.length, enqueued, cleanedUp: cleanupRes.count })
  } catch (error: any) {
    logger.error("WA Queue Cron error", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}


