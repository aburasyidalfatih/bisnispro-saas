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
          // Catat ke log DULU agar kita punya ID untuk ditaruh di link tracking
          const dripLog = await db.dripLog.create({
            data: {
              tenantId: tenant.id,
              campaignId: campaignToSend.id
            }
          })

          const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://schoolpro.id"

          // Buat regex untuk membungkus semua tag <a href="..."> menjadi tautan tracking
          // Note: Ini mensyaratkan content ditulis dalam format HTML <a> atau kita regex link mentah
          // Karena content diedit user di dashboard, biasanya ada link seperti https://schoolpro.id/super-admin/settings
          // Lebih baik kita replace link http/https yang ada di dalam text
          
          const rawContent = campaignToSend.content
            .replace(/{{name}}/g, owner.name)
            .replace(/{{schoolName}}/g, tenant.name)

          // Ganti link mentah (https://...) dengan link wrapper
          // Regex ini mendeteksi url yang berawalan http atau https
          const trackableContent = rawContent.replace(/(https?:\/\/[^\s]+)/g, (url) => {
            const encodedUrl = encodeURIComponent(url)
            return `${appUrl}/api/track/click?logId=${dripLog.id}&url=${encodedUrl}`
          })

          const htmlContent = `
            <div style="font-family: sans-serif; color: #333; line-height: 1.6;">
              ${trackableContent.replace(/\n/g, '<br/>')}
              <img src="${appUrl}/api/track/open?logId=${dripLog.id}" width="1" height="1" style="display:none;" />
            </div>
          `

          const subject = campaignToSend.subject
            .replace(/{{name}}/g, owner.name)
            .replace(/{{schoolName}}/g, tenant.name)

          // Kirim email
          await sendEmail(owner.email, subject, htmlContent)

          emailsSent++
          logs.push(`Sent campaign Day ${campaignToSend.dayOffset} to ${owner.email} (${tenant.name})`)
        } catch (err: any) {
          console.error(`Failed to send to ${owner.email}:`, err.message)
          // Hapus log jika gagal kirim, agar besok bisa dicoba lagi
          if (campaignToSend) {
             await db.dripLog.deleteMany({
               where: { tenantId: tenant.id, campaignId: campaignToSend.id }
             }).catch(() => {})
          }
        }
      }
    }

    return NextResponse.json({ success: true, emailsSent, logs })
  } catch (error: any) {
    console.error("Daily Drip Cron Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
