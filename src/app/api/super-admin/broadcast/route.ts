import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { sendEmail, sendWhatsApp } from "@/lib/services/notification"
import { logger } from "@/lib/logger"

// Fungsi utilitas untuk penundaan (delay)
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.isSuperAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const body = await req.json()
    const { target, channel, subject, message, delaySeconds } = body

    if (!message) {
      return NextResponse.json({ error: "Pesan wajib diisi" }, { status: 400 })
    }

    // 1. Ambil data penerima berdasarkan target
    let recipients: { name: string; email?: string | null; phone?: string | null; schoolName?: string }[] = []

    if (target === "all_tenants") {
      const tenants = await db.tenant.findMany({
        where: { isActive: true },
        include: { users: { include: { user: true } } }
      })
      
      tenants.forEach(tenant => {
        const owner = tenant.users.find(u => u.role === "owner")?.user
        if (owner) {
          recipients.push({
            name: owner.name || "Admin",
            email: owner.email,
            phone: owner.phone,
            schoolName: tenant.name
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
        schoolName: app.schoolName
      }))
    }
    else if (target === "free_tenants" || target === "pro_tenants") {
      const plan = target === "free_tenants" ? "free" : "pro"
      const tenants = await db.tenant.findMany({
        where: { plan, isActive: true },
        include: { users: { include: { user: true } } }
      })
      tenants.forEach(tenant => {
        const owner = tenant.users.find(u => u.role === "owner")?.user
        if (owner) {
          recipients.push({
            name: owner.name || "Admin",
            email: owner.email,
            phone: owner.phone,
            schoolName: tenant.name
          })
        }
      })
    }
    else if (target === "all_affiliates") {
      const affiliates = await db.affiliateProfile.findMany({
        where: { isActive: true },
        include: { user: true }
      })
      recipients = affiliates.map(aff => ({
        name: aff.user.name || "Mitra",
        email: aff.user.email,
        phone: aff.user.phone,
        schoolName: "Afiliasi" // Fallback variable
      }))
    }

    if (recipients.length === 0) {
      return NextResponse.json({ error: "Tidak ada penerima di segmen ini" }, { status: 400 })
    }

    // Filter duplikat berdasarkan email/nomor hp agar tidak kena spam
    const uniqueRecipients = Array.from(new Map(
      recipients.map(r => [r.email || r.phone || r.name, r])
    ).values())

    // 2. Jalankan proses di background (tanpa await untuk response utama)
    const delayMs = (delaySeconds || 5) * 1000

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
            .replace(/{{schoolName}}/g, recipient.schoolName || "")

          const sendPromises = []

          // Email
          if ((channel === "email" || channel === "both") && recipient.email) {
            let finalSubject = subject
              .replace(/{{name}}/g, recipient.name || "")
              .replace(/{{schoolName}}/g, recipient.schoolName || "")

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
          if ((channel === "whatsapp" || channel === "both") && recipient.phone) {
            sendPromises.push(
              sendWhatsApp(recipient.phone, finalMessage).then(res => {
                if (!res.success) throw new Error(res.error)
              }).catch(e => {
                logger.error("Broadcast WA Error", e, { phone: recipient.phone })
                throw e
              })
            )
          }

          // Tunggu pengiriman untuk user ini selesai
          await Promise.allSettled(sendPromises)
          successCount++

          // Terapkan delay jika ini bukan pengiriman terakhir dan menggunakan WA
          if (index < uniqueRecipients.length - 1 && channel !== "email") {
            await sleep(delayMs)
          }

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
