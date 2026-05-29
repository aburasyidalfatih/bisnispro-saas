import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sendEmail } from "@/features/notification/services/notification.service"
import { auth } from "@/lib/auth"

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.isSuperAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { campaignId, testEmail } = await req.json()
    if (!campaignId || !testEmail) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const campaign = await db.dripCampaign.findUnique({ where: { id: campaignId } })
    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 })
    }

    // Dummy data untuk pengetesan
    const dummyOwnerName = session.user.name || "Bapak/Ibu Admin"
    const dummySchoolName = "Sekolah Uji Coba SchoolPro"

    const subject = campaign.subject
      .replace(/{{name}}/g, dummyOwnerName)
      .replace(/{{schoolName}}/g, dummySchoolName)
    
    let rawContent = campaign.content
      .replace(/{{name}}/g, dummyOwnerName)
      .replace(/{{schoolName}}/g, dummySchoolName)

    rawContent = rawContent.replace(/https:\/\/schoolpro\.id\/admin/g, `https://sekolah-uji-coba.schoolpro.id/admin`)

    const trackableContent = rawContent.replace(/(https?:\/\/[^\s<>'")]+)/g, (url) => {
      return `<table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin: 24px 0;"><tr><td><a href="${url}" style="display: inline-block; padding: 14px 28px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; text-align: center;">Buka Tautan</a></td></tr></table><span style="font-size: 12px; color: #94a3b8; word-break: break-all;">Atau copy link: <br/>${url}</span>`
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
                  <td style="background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%); padding: 40px 30px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 700; letter-spacing: -0.025em;">SchoolPro Edukasi</h1>
                    <p style="color: #e0e7ff; margin: 8px 0 0 0; font-size: 15px; font-weight: 500;">Membantu Anda Mengembangkan Sekolah</p>
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
                      Ini adalah email pengujian (Test Email) dari Dasbor SchoolPro.
                    </p>
                    <p style="margin: 0; color: #94a3b8; font-size: 12px;">
                      &copy; ${new Date().getFullYear()} SchoolPro Indonesia. All rights reserved.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `

    await sendEmail(testEmail, `[TEST] ${subject}`, htmlContent)

    return NextResponse.json({ message: "Test email sent successfully" })
  } catch (error: any) {
    console.error("Test Email Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
