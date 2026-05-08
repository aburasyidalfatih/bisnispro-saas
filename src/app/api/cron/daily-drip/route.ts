import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sendEmail } from "@/lib/services/notification"
import { subDays, startOfDay, endOfDay } from "date-fns"

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  // Verifikasi keamanan CRON Job
  const authHeader = req.headers.get('authorization')
  if (process.env.NODE_ENV === "production" && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const today = startOfDay(new Date())
    
    // 1. Ambil semua template campaign yang aktif
    const campaigns = await db.dripCampaign.findMany({
      where: { isActive: true }
    })

    if (campaigns.length === 0) {
      return NextResponse.json({ message: "No active campaigns found" })
    }

    let emailsSent = 0
    let logs = []

    // 2. Proses tiap campaign (Hari 2, Hari 3, dst)
    for (const campaign of campaigns) {
      // Cari tanggal pendaftaran target. Contoh: Jika ini Day 2, berarti cari tenant yang mendaftar 2 hari lalu.
      const targetDate = subDays(today, campaign.dayOffset)
      
      const tenants = await db.tenant.findMany({
        where: {
          createdAt: {
            gte: targetDate,
            lte: endOfDay(targetDate)
          },
          isActive: true
        },
        include: {
          users: {
            where: { role: { in: ['owner', 'admin'] } },
            include: { user: true },
            take: 1 // Kirim ke 1 admin saja per tenant
          }
        }
      })

      for (const tenant of tenants) {
        // Cek apakah email untuk campaign ini sudah pernah dikirim ke tenant ini (mencegah double send)
        const alreadySent = await db.dripLog.findFirst({
          where: { tenantId: tenant.id, campaignId: campaign.id }
        })

        if (!alreadySent && tenant.users.length > 0) {
          const owner = tenant.users[0].user
          if (owner?.email) {
            try {
              // 3. Replace variabel {{name}} dan {{schoolName}}
              const subject = campaign.subject
                .replace(/{{name}}/g, owner.name)
                .replace(/{{schoolName}}/g, tenant.name)
              
              const content = campaign.content
                .replace(/{{name}}/g, owner.name)
                .replace(/{{schoolName}}/g, tenant.name)

              // Konversi baris baru (Enter) menjadi tag <br/> agar rapi di email HTML
              const htmlContent = `
                <div style="font-family: sans-serif; color: #333; line-height: 1.6;">
                  ${content.replace(/\n/g, '<br/>')}
                </div>
              `

              // 4. Kirim Email
              await sendEmail(owner.email, subject, htmlContent)
              
              // 5. Catat ke database
              await db.dripLog.create({
                data: {
                  tenantId: tenant.id,
                  campaignId: campaign.id
                }
              })

              emailsSent++
              logs.push(`Sent campaign Day ${campaign.dayOffset} to ${owner.email} (${tenant.name})`)
            } catch (err: any) {
              console.error(`Failed to send to ${owner.email}:`, err.message)
            }
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
