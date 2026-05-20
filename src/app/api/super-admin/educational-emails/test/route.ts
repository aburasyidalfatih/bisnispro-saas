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
      return `<a href="${url}" style="display:inline-block; margin-top:10px; margin-bottom:10px; padding:12px 24px; background-color:#2563eb; color:#ffffff; text-decoration:none; border-radius:6px; font-weight:600;">🔗 Buka Tautan</a><br/><span style="font-size:12px; color:#6b7280;">(${url})</span>`
    })
    
    const formattedContent = trackableContent.replace(/\n/g, '<br/>')

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
      </head>
      <body style="margin: 0; padding: 20px; background-color: #f3f4f6; font-family: Arial, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; border: 1px solid #e5e7eb;">
          <div style="background-color: #2563eb; padding: 30px 20px; text-align: center; border-top-left-radius: 8px; border-top-right-radius: 8px;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: bold;">SchoolPro Edukasi</h1>
          </div>
          <div style="padding: 30px; color: #374151; font-size: 16px; line-height: 1.6;">
            ${formattedContent}
          </div>
          <div style="background-color: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 13px; border-bottom-left-radius: 8px; border-bottom-right-radius: 8px; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0 0 8px 0;">Ini adalah email pengujian (Test Email) dari Dasbor SchoolPro.</p>
            <p style="margin: 0;">&copy; ${new Date().getFullYear()} SchoolPro Indonesia. All rights reserved.</p>
          </div>
        </div>
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
