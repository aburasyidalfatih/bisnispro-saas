import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sendEmail } from "@/lib/services/notification"
import { startOfDay } from "date-fns"

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  // Verifikasi keamanan CRON Job
  const authHeader = req.headers.get('authorization')
  if (process.env.NODE_ENV === "production" && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const todayStart = startOfDay(new Date())
    
    // 1. Ambil semua template campaign yang aktif, urutkan berdasarkan dayOffset
    const campaigns = await db.dripCampaign.findMany({
      where: { isActive: true },
      orderBy: { dayOffset: 'asc' }
    })

    if (campaigns.length === 0) {
      return NextResponse.json({ message: "No active campaigns found" })
    }

    let emailsSent = 0
    let logs = []

    // 2. Ambil semua tenant yang aktif beserta riwayat email terakhir mereka
    const tenants = await db.tenant.findMany({
      where: { isActive: true },
      include: {
        users: {
          where: { role: { in: ['owner', 'admin'] } },
          include: { user: true },
          take: 1
        },
        dripLogs: {
          include: { campaign: true },
          orderBy: { sentAt: 'desc' },
          take: 1 // Ambil 1 log terakhir
        }
      }
    })

    // 3. Evaluasi setiap tenant
    for (const tenant of tenants) {
      if (tenant.users.length === 0) continue

      const owner = tenant.users[0].user
      if (!owner?.email) continue

      const lastLog = tenant.dripLogs[0]
      let campaignToSend = null

      if (!lastLog) {
        // Belum pernah mendapat email edukasi sama sekali.
        // Berikan campaign pertama, tapi pastikan mereka bukan mendaftar HARI INI
        // (Harus sudah melewati H+1 pendaftaran agar wajar)
        if (tenant.createdAt < todayStart) {
          campaignToSend = campaigns[0]
        }
      } else {
        // Sudah pernah mendapat email. Pastikan email terakhir TIDAK dikirim hari ini (1 hari = 1 email)
        if (lastLog.sentAt < todayStart) {
          // Cari urutan campaign berikutnya
          const lastIndex = campaigns.findIndex(c => c.id === lastLog.campaignId)
          if (lastIndex !== -1 && lastIndex + 1 < campaigns.length) {
            campaignToSend = campaigns[lastIndex + 1]
          }
        }
      }

      // Jika ada email yang harus dikirim ke tenant ini hari ini
      if (campaignToSend) {
        try {
          // Replace variabel
          const subject = campaignToSend.subject
            .replace(/{{name}}/g, owner.name)
            .replace(/{{schoolName}}/g, tenant.name)
          
          const content = campaignToSend.content
            .replace(/{{name}}/g, owner.name)
            .replace(/{{schoolName}}/g, tenant.name)

          const htmlContent = `
            <div style="font-family: sans-serif; color: #333; line-height: 1.6;">
              ${content.replace(/\n/g, '<br/>')}
            </div>
          `

          // Kirim email
          await sendEmail(owner.email, subject, htmlContent)
          
          // Catat ke log
          await db.dripLog.create({
            data: {
              tenantId: tenant.id,
              campaignId: campaignToSend.id
            }
          })

          emailsSent++
          logs.push(`Sent campaign Day ${campaignToSend.dayOffset} to ${owner.email} (${tenant.name})`)
        } catch (err: any) {
          console.error(`Failed to send to ${owner.email}:`, err.message)
        }
      }
    }

    return NextResponse.json({ success: true, emailsSent, logs })
  } catch (error: any) {
    console.error("Daily Drip Cron Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
