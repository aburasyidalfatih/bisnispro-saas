import { db } from "@/lib/db"
import { emailQueue } from "@/lib/queue"
import { startOfDay } from "date-fns"

export async function processDailyDrip() {
  const todayStart = startOfDay(new Date())
  
  // Ambil nama platform dari settings
  const platformNameSetting = await db.platformSetting.findUnique({ where: { key: "platform_name" } })
  const platformName = platformNameSetting?.value || "BisnisPro"
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

        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://bisnispro.id"
        const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "bisnispro.id"
        
        const tenantUrl = tenant.domain 
          ? `https://${tenant.domain}` 
          : `https://${tenant.slug}.${rootDomain}`

        let rawContent = campaignToSend.content
          .replace(/{{name}}/g, owner.name)
          .replace(/{{businessName}}/g, tenant.name)
          .replace(/{{schoolName}}/g, tenant.name)

        rawContent = rawContent.replace(/https:\/\/bisnispro\.id\/admin/g, `${tenantUrl}/admin`)

        const trackableContent = rawContent.replace(/(https?:\/\/[^\s<>'"\)]+)/g, (url) => {
          const encodedUrl = encodeURIComponent(url)
          const trackingUrl = `${appUrl}/api/track/click?logId=${dripLog.id}&url=${encodedUrl}`
          return `<table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin: 24px 0;"><tr><td><a href="${trackingUrl}" style="display: inline-block; padding: 14px 28px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; text-align: center;">Buka Tautan</a></td></tr></table><span style="font-size: 12px; color: #94a3b8; word-break: break-all;">Atau copy link: <br/>${url}</span>`
        })

        const formattedContent = trackableContent.replace(/\n/g, '<br/>')

        const htmlContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 20px; background-color: #f4f7f6; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td align="center">
                  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06); overflow: hidden;">
                    <tr>
                      <td style="background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); padding: 40px 30px; text-align: center;">
                        <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 700; letter-spacing: -0.025em;">${platformName} Edukasi</h1>
                        <p style="color: #e0e7ff; margin: 8px 0 0 0; font-size: 15px; font-weight: 500;">Membantu Anda Mengembangkan Perusahaan</p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 40px 30px; color: #374151; font-size: 16px; line-height: 1.7;">
                        ${formattedContent}
                      </td>
                    </tr>
                    <tr>
                      <td style="background-color: #f8fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
                        <p style="margin: 0 0 10px 0; color: #64748b; font-size: 13px; line-height: 1.5;">
                          Email ini dikirim secara otomatis oleh sistem <strong>${platformName}</strong>.
                        </p>
                        <p style="margin: 0; color: #94a3b8; font-size: 12px;">
                          &copy; ${new Date().getFullYear()} ${platformName} Indonesia. All rights reserved.
                        </p>
                      </td>
                    </tr>
                  </table>
                  <img src="${appUrl}/api/track/open?logId=${dripLog.id}" width="1" height="1" style="display:none;" />
                </td>
              </tr>
            </table>
          </body>
          </html>
        `

        const subject = campaignToSend.subject
          .replace(/{{name}}/g, owner.name)
          .replace(/{{businessName}}/g, tenant.name)
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
