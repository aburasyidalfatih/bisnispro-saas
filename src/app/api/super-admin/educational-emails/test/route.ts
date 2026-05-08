import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sendEmail } from "@/lib/services/notification"
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
    
    const content = campaign.content
      .replace(/{{name}}/g, dummyOwnerName)
      .replace(/{{schoolName}}/g, dummySchoolName)

    const formattedContent = content.replace(/\n/g, '<br/>').replace(/(https?:\/\/[^\s]+)/g, (url) => {
      return `<a href="${url}" style="display:inline-block; margin-top:10px; margin-bottom:10px; padding:12px 24px; background-color:#2563eb; color:#ffffff; text-decoration:none; border-radius:6px; font-weight:600;">🔗 Buka Tautan</a><br/><span style="font-size:12px; color:#6b7280;">(${url})</span>`
    })

    const htmlContent = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9fafb; border-radius: 12px; overflow: hidden; border: 1px solid #e5e7eb;">
        <div style="background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%); padding: 32px 20px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: 0.5px;">SchoolPro Edukasi</h1>
        </div>
        <div style="padding: 40px 32px; background-color: #ffffff; color: #374151; font-size: 16px; line-height: 1.7;">
          ${formattedContent}
        </div>
        <div style="background-color: #f3f4f6; padding: 24px; text-align: center; color: #6b7280; font-size: 13px; border-top: 1px solid #e5e7eb;">
          <p style="margin: 0 0 8px 0;">Ini adalah email pengujian (Test Email) dari Dasbor SchoolPro.</p>
          <p style="margin: 0;">&copy; ${new Date().getFullYear()} SchoolPro Indonesia. All rights reserved.</p>
        </div>
      </div>
    `

    await sendEmail(testEmail, `[TEST] ${subject}`, htmlContent)

    return NextResponse.json({ message: "Test email sent successfully" })
  } catch (error: any) {
    console.error("Test Email Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
