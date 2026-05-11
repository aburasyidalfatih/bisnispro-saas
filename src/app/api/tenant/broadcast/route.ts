import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { sendWhatsApp } from "@/lib/services/notification"
import { logger } from "@/lib/logger"

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export async function POST(req: Request) {
  const session = await auth()
  
  // Ensure the user is authenticated and has a tenant
  const tenantId = session?.user?.tenants?.[0]?.tenantId
  const role = session?.user?.tenants?.[0]?.role
  
  if (!tenantId || (role !== "owner" && role !== "admin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const body = await req.json()
    const { target, channel, message, delaySeconds } = body

    if (!message) {
      return NextResponse.json({ error: "Pesan wajib diisi" }, { status: 400 })
    }

    // 1. Get recipients based on target and tenant
    const targetRoles = []
    if (target === "all_gtk") targetRoles.push("guru")
    if (target === "all_parents") targetRoles.push("orangtua")
    if (target === "all") targetRoles.push("guru", "orangtua")

    if (targetRoles.length === 0) {
      return NextResponse.json({ error: "Target penerima tidak valid" }, { status: 400 })
    }

    const tenantUsers = await db.tenantUser.findMany({
      where: {
        tenantId,
        role: { in: targetRoles }
      },
      include: {
        user: true
      }
    })

    const recipients = tenantUsers
      .map(tu => ({
        name: tu.user.name,
        phone: tu.user.phone
      }))
      .filter(r => r.phone) // Only those with phone numbers

    if (recipients.length === 0) {
      return NextResponse.json({ error: "Tidak ada penerima dengan nomor WhatsApp yang valid" }, { status: 400 })
    }

    // Remove duplicates
    const uniqueRecipients = Array.from(new Map(
      recipients.map(r => [r.phone, r])
    ).values())

    // 2. Background Processing
    const delayMs = (delaySeconds || 5) * 1000

    const processBroadcast = async () => {
      logger.info(`Starting tenant broadcast to ${uniqueRecipients.length} recipients`, { target, channel, tenantId })
      
      let successCount = 0
      let failCount = 0

      for (const [index, recipient] of uniqueRecipients.entries()) {
        try {
          let finalMessage = message
            .replace(/{{name}}/g, recipient.name || "")
            .replace(/{{phone}}/g, recipient.phone || "")

          if (recipient.phone) {
            await sendWhatsApp(recipient.phone, finalMessage)
            successCount++
          }

          if (index < uniqueRecipients.length - 1) {
            await sleep(delayMs)
          }

        } catch (error) {
          failCount++
          logger.error("Tenant Broadcast recipient failed", error, { recipient })
        }
      }

      logger.info(`Tenant Broadcast completed. Success: ${successCount}, Failed: ${failCount}`)
    }

    // Trigger process in background
    processBroadcast().catch(e => logger.error("Fatal Background Tenant Broadcast Error", e))

    return NextResponse.json({ 
      message: `Broadcast sedang diproses untuk ${uniqueRecipients.length} nomor tujuan.`,
      count: uniqueRecipients.length
    })

  } catch (error) {
    logger.error("Tenant Broadcast trigger error", error)
    return NextResponse.json({ error: "Gagal memulai broadcast" }, { status: 500 })
  }
}
