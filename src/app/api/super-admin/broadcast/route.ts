import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { sendEmail, sendWhatsApp } from "@/features/notification/services/notification.service"
import { logger } from "@/lib/logger"


export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.isSuperAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const body = await req.json()
    const { target, channel, subject, message } = body

    if (!message) {
      return NextResponse.json({ error: "Pesan wajib diisi" }, { status: 400 })
    }

    // 1. Ambil data penerima berdasarkan target
    let recipients: { name: string; email?: string | null; phone?: string | null; businessName?: string; userId?: string; tenantId?: string }[] = []

    if (target === "all_tenants") {
      const owners = await db.tenantUser.findMany({
        where: { role: "owner", tenant: { isActive: true } },
        select: { user: { select: { id: true, name: true, email: true, phone: true } }, tenant: { select: { id: true, name: true } } }
      })
      
      owners.forEach(tu => {
        const owner = tu.user
        if (owner) {
          recipients.push({
            name: owner.name || "Admin",
            email: owner.email,
            phone: owner.phone,
            businessName: tu.tenant.name,
            userId: owner.id,
            tenantId: tu.tenant.id
          })
        }
      })
    } 
    else if (target === "pending_tenants") {
      const pendingApps = await db.tenantApplication.findMany({
        where: { status: "PENDING" }
      })
      recipients = pendingApps.map(app => ({
        name: app.adminName,
        email: app.adminEmail,
        phone: app.adminPhone,
        businessName: app.businessName
      }))
    }
    else if (target === "free_tenants" || target === "pro_tenants") {
      const plan = target === "free_tenants" ? "free" : "pro"
      const owners = await db.tenantUser.findMany({
        where: { role: "owner", tenant: { plan, isActive: true } },
        select: { user: { select: { id: true, name: true, email: true, phone: true } }, tenant: { select: { id: true, name: true } } }
      })
      
      owners.forEach(tu => {
        const owner = tu.user
        if (owner) {
          recipients.push({
            name: owner.name || "Admin",
            email: owner.email,
            phone: owner.phone,
            businessName: tu.tenant.name,
            userId: owner.id,
            tenantId: tu.tenant.id
          })
        }
      })
    }
    else if (target === "all_affiliates") {
      const affiliates = await db.affiliateProfile.findMany({
        where: { isActive: true },
        select: { userId: true, user: { select: { id: true, name: true, email: true, phone: true } } }
      })
      recipients = affiliates.map(aff => ({
        name: aff.user.name || "Mitra",
        email: aff.user.email,
        phone: aff.user.phone,
        businessName: "Afiliasi", // Fallback variable
        userId: aff.userId
      }))
    }

    if (recipients.length === 0) {
      return NextResponse.json({ error: "Tidak ada penerima di segmen ini" }, { status: 400 })
    }

    // Filter duplikat berdasarkan email/nomor hp agar tidak kena spam
    const uniqueRecipients = Array.from(new Map(
      recipients.map(r => [r.email || r.phone || r.name, r])
    ).values())

    const processBroadcast = async () => {
      logger.info(`Starting broadcast to ${uniqueRecipients.length} recipients`, { target, channel })
      
      let successCount = 0
      let failCount = 0

      for (const [index, recipient] of uniqueRecipients.entries()) {
        try {
          // Replace dynamic variables
          let finalMessage = message
            .replace(/{{name}}/g, recipient.name || "")
            .replace(/{{email}}/g, recipient.email || "")
            .replace(/{{phone}}/g, recipient.phone || "")
            .replace(/{{businessName}}/g, recipient.businessName || "")

          const sendPromises = []

          // Email
          if ((channel === "email" || channel === "both" || channel === "all") && recipient.email) {
            let finalSubject = subject
              .replace(/{{name}}/g, recipient.name || "")
              .replace(/{{businessName}}/g, recipient.businessName || "")

            sendPromises.push(
              sendEmail(
                recipient.email,
                finalSubject,
                `<div style="font-family: sans-serif; padding: 20px; color: #333;">
                  <p>${finalMessage.replace(/\n/g, "<br>")}</p>
                 </div>`
              ).catch(e => {
                logger.error("Broadcast Email Error", e, { email: recipient.email })
                throw e
              })
            )
          }

          // WhatsApp
          if ((channel === "whatsapp" || channel === "both" || channel === "all") && recipient.phone) {
            sendPromises.push(
              sendWhatsApp(recipient.phone, finalMessage).then(res => {
                if (!res.success) throw new Error(res.error)
              }).catch(e => {
                logger.error("Broadcast WA Error", e, { phone: recipient.phone })
                throw e
              })
            )
          }

          // In-App Notification (Lonceng)
          if ((channel === "notification" || channel === "all") && recipient.userId) {
            let finalSubject = subject || "Pengumuman Sistem"
            finalSubject = finalSubject
              .replace(/{{name}}/g, recipient.name || "")
              .replace(/{{businessName}}/g, recipient.businessName || "")

            sendPromises.push(
              db.notification.create({
                data: {
                  userId: recipient.userId,
                  tenantId: recipient.tenantId,
                  title: finalSubject,
                  message: finalMessage,
                  type: "info",
                  channel: "inapp"
                }
              }).catch(e => {
                logger.error("Broadcast Notification Error", e, { userId: recipient.userId })
                throw e
              })
            )
          }

          // Tunggu pengiriman untuk user ini selesai
          await Promise.allSettled(sendPromises)
          successCount++

        } catch (error) {
          failCount++
          logger.error("Broadcast recipient failed", error, { recipient })
        }
      }

      logger.info(`Broadcast completed. Success: ${successCount}, Failed: ${failCount}`)
    }

    // Trigger process in background (works safely in dockerized nextjs Node server)
    processBroadcast().catch(e => logger.error("Fatal Background Broadcast Error", e))

    return NextResponse.json({ 
      message: `Broadcast sedang diproses untuk ${uniqueRecipients.length} penerima.`,
      count: uniqueRecipients.length
    })

  } catch (error) {
    logger.error("Broadcast trigger error", error)
    return NextResponse.json({ error: "Gagal memulai broadcast" }, { status: 500 })
  }
}

