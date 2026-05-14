import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import bcrypt from "bcryptjs"
import { logger } from "@/lib/logger"

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.isSuperAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const { tenantId, newPassword } = await req.json()

    if (!tenantId || !newPassword) {
      return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 })
    }

    // Cari owner atau admin tenant (kecuali super admin)
    const targetUser = await db.tenantUser.findFirst({
      where: { 
        tenantId,
        role: { in: ["owner", "admin"] },
        user: { isSuperAdmin: false }
      },
      include: { user: true }
    })

    if (!targetUser) {
      return NextResponse.json({ error: "Akun pengelola sekolah tidak ditemukan" }, { status: 404 })
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10)

    await db.user.update({
      where: { id: targetUser.userId },
      data: { password: hashedPassword }
    })

    return NextResponse.json({ 
      message: `Password untuk ${targetUser.user.email} berhasil direset` 
    })
  } catch (error) {
    logger.error("Reset password failed", error, { path: "/api/super-admin/tenants/reset-password" })
    return NextResponse.json({ error: "Gagal mereset password" }, { status: 500 })
  }
}
