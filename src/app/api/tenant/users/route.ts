import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

// GET: daftar user di tenant
export async function GET(req: Request) {
  const url = new URL(req.url)
  const tenantId = url.searchParams.get("tenantId")
  if (!tenantId) return NextResponse.json({ error: "tenantId harus diisi" }, { status: 400 })

  const { error } = await (await import("@/lib/api-utils")).requireTenantMembership(tenantId)
  if (error) return error

  const role = url.searchParams.get("role")

  const whereClause: any = { tenantId }
  if (role) {
    whereClause.role = role
  }

  const data = await db.tenantUser.findMany({
    where: whereClause,
    include: {
      user: { select: { id: true, name: true, email: true, phone: true, isActive: true, createdAt: true } },
    },
    orderBy: { user: { createdAt: "desc" } },
  })

  const result = data.map((tu) => ({
    id: tu.user.id,
    tenantUserId: tu.id,
    name: tu.user.name,
    email: tu.user.email,
    phone: tu.user.phone,
    role: tu.role,
    isActive: tu.user.isActive,
    createdAt: tu.user.createdAt,
  }))

  return NextResponse.json({ data: result })
}

// POST: tambah user baru ke tenant
export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { addUserSchema } = await import("@/lib/validations/tenant")
  const { parseBody } = await import("@/lib/api-utils")
  const parsed = await parseBody(req, addUserSchema)
  if (parsed.error) return parsed.error
  let { tenantId, name, email, phone, role, password } = parsed.data
  email = email.toLowerCase()

  // Cek izin (owner/admin)
  if (!session.user.isSuperAdmin) {
    const tu = await db.tenantUser.findUnique({
      where: { tenantId_userId: { tenantId, userId: session.user.id } },
    })
    if (!tu || !["owner", "admin"].includes(tu.role)) {
      return NextResponse.json({ error: "Tidak punya izin" }, { status: 403 })
    }
  }
  // Cek kuota admin untuk paket free
  if (role === "admin") {
    const tenant = await db.tenant.findUnique({ where: { id: tenantId } })
    if (tenant?.plan === "free") {
      const adminCount = await db.tenantUser.count({ where: { tenantId, role: "admin" } })
      if (adminCount >= 1) {
        return NextResponse.json({ 
          error: "Kuota maksimal 1 admin tambahan untuk paket Free. Silakan upgrade paket untuk menambah." 
        }, { status: 403 })
      }
    }
  }

  // Cek apakah email sudah ada
  let user = await db.user.findUnique({ where: { email } })

  if (user) {
    const existing = await db.tenantUser.findUnique({
      where: { tenantId_userId: { tenantId, userId: user.id } },
    })
    
    // Jika admin memberikan password baru saat menambahkan ulang user yang sudah ada
    let passwordUpdated = false
    if (password && !(user as any).isSuperAdmin) {
      const hashedPassword = await bcrypt.hash(password, 12)
      await db.user.update({
        where: { id: user.id },
        data: { password: hashedPassword }
      })
      passwordUpdated = true
    }

    if (existing) {
      const roleMap: Record<string, string> = { guru: "Guru", orangtua: "Orang Tua", admin: "Admin", siswa: "Siswa", owner: "Owner" }
      const existingRoleLabel = roleMap[existing.role] || existing.role
      const targetRoleLabel = roleMap[role] || role

      if (existing.role !== role) {
        return NextResponse.json({ error: `Email ini sudah terdaftar sebagai ${existingRoleLabel}. Silakan gunakan email lain untuk membuat akun ${targetRoleLabel}.` }, { status: 400 })
      }

      if (passwordUpdated) {
        return NextResponse.json({ message: "User sudah ada, password diperbarui", userId: user.id })
      }
      return NextResponse.json({ error: `User sudah terdaftar sebagai ${existingRoleLabel}` }, { status: 400 })
    }
  } else {
    // Gunakan password yang diberikan atau default "12345678" agar admin bisa memberitahu user
    const fallbackPassword = "12345678"
    const hashedPassword = await bcrypt.hash(password || fallbackPassword, 12)
    user = await db.user.create({
      data: { name, email, phone, password: hashedPassword },
    })
  }

  await db.tenantUser.create({
    data: { tenantId, userId: user.id, role },
  })

  return NextResponse.json({ message: "User berhasil ditambahkan", userId: user.id })
}

// DELETE: hapus user dari tenant
export async function DELETE(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { deleteUserSchema } = await import("@/lib/validations/tenant")
  const { parseBody } = await import("@/lib/api-utils")
  const parsed = await parseBody(req, deleteUserSchema)
  if (parsed.error) return parsed.error
  const { tenantUserId } = parsed.data

  const targetTu = await db.tenantUser.findUnique({ where: { id: tenantUserId } })
  if (!targetTu) return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 })

  if (!session.user.isSuperAdmin) {
    const callerTu = await db.tenantUser.findUnique({
      where: { tenantId_userId: { tenantId: targetTu.tenantId, userId: session.user.id } }
    })
    
    if (!callerTu || !["owner", "admin"].includes(callerTu.role)) {
      return NextResponse.json({ error: "Tidak punya izin untuk menghapus user dari tenant ini" }, { status: 403 })
    }
    
    if (targetTu.role === "owner" && callerTu.role !== "owner") {
      return NextResponse.json({ error: "Admin tidak bisa menghapus Owner" }, { status: 403 })
    }
  }

  await db.tenantUser.delete({ where: { id: tenantUserId } })
  return NextResponse.json({ message: "User dihapus dari tenant" })
}
