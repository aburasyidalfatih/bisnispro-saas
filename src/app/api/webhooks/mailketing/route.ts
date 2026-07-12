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

      // Cek apakah ini email pendaftaran yang masih PENDING
      const app = await db.tenantApplication.findFirst({
        where: { adminEmail: email, status: "PENDING" }
      })
      if (app) {
        await db.tenantApplication.delete({ where: { id: app.id } })
        logger.info(`Auto-deleted fake application ${app.id} due to email bounce`)
      }
    } else if (event.includes("open")) {
      await db.emailQueueLog.update({
        where: { id: lastLog.id },
        data: { openedAt: now }
      })

      // Update emailOpenedAt untuk pendaftar PENDING
      const app = await db.tenantApplication.findFirst({
        where: { adminEmail: email, status: "PENDING" }
      })
      if (app) {
        await db.tenantApplication.update({
          where: { id: app.id },
          data: { emailOpenedAt: now }
        })
      }

      // Update DripLog untuk Email Edukasi
      const tenant = await db.tenant.findFirst({ where: { email } })
      if (tenant) {
        const latestDrip = await db.dripLog.findFirst({
           where: { tenantId: tenant.id },
           orderBy: { sentAt: "desc" }
        })
        if (latestDrip) {
           await db.dripLog.update({
              where: { id: latestDrip.id },
              data: { isOpened: true, openedAt: now }
           })
        }
      }
    } else if (event.includes("click")) {
      await db.emailQueueLog.update({
        where: { id: lastLog.id },
        data: { clickedAt: now }
      })

      // Update DripLog untuk Email Edukasi
      const tenant = await db.tenant.findFirst({ where: { email } })
      if (tenant) {
        const latestDrip = await db.dripLog.findFirst({
           where: { tenantId: tenant.id },
           orderBy: { sentAt: "desc" }
        })
        if (latestDrip) {
           await db.dripLog.update({
              where: { id: latestDrip.id },
              data: { isClicked: true, clickedAt: now }
           })
        }
      }
    }

    return NextResponse.json({ success: true, message: "Webhook processed" })
  } catch (error: any) {
    logger.error("Mailketing Webhook Error", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
