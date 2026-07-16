import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { apiHandler } from "@/lib/api-utils"

/**
 * Endpoint webhook untuk menerima notifikasi status pesan dari Wavio API.
 * Method: POST
 * URL: /api/webhooks/wavio
 */
export const POST = apiHandler(async (req: Request) => {
  try {
    const rawBody = await req.text()
    
    let payload: any
    try {
      payload = JSON.parse(rawBody)
    } catch (e) {
      logger.error("[Wavio Webhook] Invalid JSON received", rawBody)
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
    }

    logger.info("[Wavio Webhook] Received webhook payload", payload)

    // Deteksi struktur payload
    // Biasanya webhook WA / Wavio memiliki id pesan dan status
    const messageId = payload?.data?.message_id || payload?.message_id || payload?.id
    const status = payload?.data?.status || payload?.status
    const errorMsg = payload?.data?.error || payload?.error || null

    if (messageId && status) {
      // Perbarui log pesan di database
      await (db as any).wavioMessageLog.updateMany({
        where: { messageId },
        data: { 
          status: status.toUpperCase(), 
          errorMsg,
          updatedAt: new Date()
        }
      })
      logger.info(`[Wavio Webhook] Updated message ${messageId} to status ${status}`)
    } else {
      logger.warn("[Wavio Webhook] Unrecognized payload format", payload)
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    logger.error("[Wavio Webhook] Internal Error", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}, { rateLimit: 60, rateLimitWindowMs: 60000 })
