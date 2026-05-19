import { db } from "@/lib/db"
import { emailQueue } from "@/lib/queue"
import { startOfDay } from "date-fns"

export async function processDailyDrip() {
  const todayStart = startOfDay(new Date())
  
  // Ambil nama platform dari settings
  const platformNameSetting = await db.platformSetting.findUnique({ where: { key: "platform_name" } })
  const platformName = platformNameSetting?.value || "SchoolPro"
  // 1. Ambil semua template campaign yang aktif, urutkan berdasarkan dayOffset
  const campaigns = await db.dripCampaign.findMany({
    where: { isActive: true },
    orderBy: { dayOffset: 'asc' }
  })

  if (campaigns.length === 0) {
    return { message: "No active campaigns found" }
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
      if (tenant.createdAt < todayStart) {
        campaignToSend = campaigns[0]
      }
    } else {
      if (lastLog.sentAt < todayStart) {
        const lastIndex = campaigns.findIndex(c => c.id === lastLog.campaignId)
        if (lastIndex !== -1 && lastIndex + 1 < campaigns.length) {
          campaignToSend = campaigns[lastIndex + 1]
        }
      }
    }

    if (campaignToSend) {
      try {
        const dripLog = await db.dripLog.create({
          data: {
            tenantId: tenant.id,
            campaignId: campaignToSend.id
          }
        })

        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://schoolpro.id"
        const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "schoolpro.id"
        
        const tenantUrl = tenant.domain 
          ? `https://${tenant.domain}` 
          : `https://${tenant.slug}.${rootDomain}`

        let rawContent = campaignToSend.content
          .replace(/{{name}}/g, owner.name)
          .replace(/{{schoolName}}/g, tenant.name)

        rawContent = rawContent.replace(/https:\/\/schoolpro\.id\/admin/g, `${tenantUrl}/admin`)

        const trackableContent = rawContent.replace(/(https?:\/\/[^\s<>'"\)]+)/g, (url) => {
          const encodedUrl = encodeURIComponent(url)
          const trackingUrl = `${appUrl}/api/track/click?logId=${dripLog.id}&url=${encodedUrl}`
          return `<a href="${trackingUrl}" style="display:inline-block; margin-top:10px; margin-bottom:10px; padding:12px 24px; background-color:#2563eb; color:#ffffff; text-decoration:none; border-radius:6px; font-weight:600;">🔗 Buka Tautan</a><br/><span style="font-size:12px; color:#6b7280;">(${url})</span>`
        })

        const formattedContent = trackableContent.replace(/\n/g, '<br/>')

        const htmlContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
          </head>
          <body style="margin: 0; padding: 20px; background-color: #f3f4f6; font-family: 'Segoe UI', Arial, sans-serif;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden;">
              <div style="background: linear-gradient(135deg, #4f46e5, #7c3aed); padding: 30px 20px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: bold;">${platformName} Edukasi</h1>
              </div>
              <div style="padding: 30px; color: #374151; font-size: 16px; line-height: 1.6;">
                ${formattedContent}
              </div>
              <div style="background-color: #f1f5f9; padding: 20px; text-align: center; color: #94a3b8; font-size: 12px; border-top: 1px solid #e2e8f0;">
                <p style="margin: 0 0 8px 0;">Email ini dikirim secara otomatis oleh sistem <strong>${platformName}</strong>.</p>
                <p style="margin: 0;">&copy; ${new Date().getFullYear()} ${platformName} Indonesia. All rights reserved.</p>
              </div>
              <img src="${appUrl}/api/track/open?logId=${dripLog.id}" width="1" height="1" style="display:none;" />
            </div>
          </body>
          </html>
        `

        const subject = campaignToSend.subject
          .replace(/{{name}}/g, owner.name)
          .replace(/{{schoolName}}/g, tenant.name)

        await emailQueue.add("send-educational-email", {
          to: owner.email,
          subject,
          htmlContent,
          logId: dripLog.id,
          tenantId: tenant.id,
          campaignId: campaignToSend.id
        })

        emailsSent++
        logs.push(`Sent campaign Day ${campaignToSend.dayOffset} to ${owner.email} (${tenant.name})`)
      } catch (err: any) {
        console.error(`Failed to send to ${owner.email}:`, err.message)
        if (campaignToSend) {
           await db.dripLog.deleteMany({
             where: { tenantId: tenant.id, campaignId: campaignToSend.id }
           }).catch(() => {})
        }
      }
    }
  }

  return { success: true, emailsSent, logs }
}
