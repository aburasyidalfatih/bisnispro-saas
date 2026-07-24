import { NextResponse } from "next/server"
import crypto from "crypto"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { sendEmail } from "@/features/notification/services/notification.service"
import { inviteSchema } from "@/features/tenant/schemas/tenant.schema"
import { parseBody } from "@/lib/api-utils"
import { logger } from "@/lib/logger"

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const parsed = await parseBody(req, inviteSchema)
    if (parsed.error) return parsed.error
    const { tenantId, email, role } = parsed.data

    // Cek izin
    const tu = await db.tenantUser.findUnique({
      where: { tenantId_userId: { tenantId, userId: session.user.id } },
    })
    if (!tu || !["owner", "admin"].includes(tu.role)) {
      return NextResponse.json({ error: "Tidak punya izin" }, { status: 403 })
    }

    // Cek apakah sudah jadi member
    const existingUser = await db.user.findUnique({ where: { email } })
    if (existingUser) {
      const alreadyMember = await db.tenantUser.findUnique({
        where: { tenantId_userId: { tenantId, userId: existingUser.id } },
      })
      if (alreadyMember) return NextResponse.json({ error: "User sudah menjadi anggota" }, { status: 400 })
    }

    // Hapus undangan lama
    await db.invitation.deleteMany({ where: { tenantId, email } })

    const token = crypto.randomBytes(32).toString("hex")
    const invitation = await db.invitation.create({
      data: {
        tenantId,
        email,
        role,
        token,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    })

    const tenant = await db.tenant.findUnique({ where: { id: tenantId } })
    const acceptUrl = `${process.env.AUTH_URL}/invite/accept?token=${token}`

    await sendEmail(
      email,
      `Undangan bergabung ke ${tenant?.name} — BisnisPro`,
      `<div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #4f46e5, #7c3aed); padding: 24px; border-radius: 12px 12px 0 0; color: white;">
          <h2 style="margin: 0;">📩 Undangan Bergabung</h2>
          <p style="margin: 4px 0 0; opacity: 0.9;">${tenant?.name || "BisnisPro"}</p>
        </div>
        <div style="background: #f8fafc; padding: 24px; border: 1px solid #e2e8f0; line-height: 1.6;">
          <p>Halo,</p>
          <p>Anda diundang untuk bergabung ke <strong>${tenant?.name}</strong> sebagai <strong>${role}</strong>.</p>
          <div style="text-align: center; margin: 24px 0;">
            <a href="${acceptUrl}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #4f46e5, #7c3aed); color: #fff; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 15px;">Terima Undangan</a>
          </div>
          <p style="color: #64748b; font-size: 13px;">Undangan ini berlaku selama 7 hari. Jika Anda tidak merasa mengajukan ini, abaikan email ini.</p>
        </div>
        <div style="background: #f1f5f9; padding: 12px 24px; border-radius: 0 0 12px 12px; text-align: center; color: #94a3b8; font-size: 12px;">
          BisnisPro — Platform Edukasi Terintegrasi
        </div>
      </div>`
    ).catch(() => {})

    return NextResponse.json({ message: "Undangan terkirim", invitation })
  } catch (error) {
    logger.error("Invite failed", error, { path: "/api/tenant/invite" })
    return NextResponse.json({ error: "Terjadi kesalahan" }, { status: 500 })
  }
}
