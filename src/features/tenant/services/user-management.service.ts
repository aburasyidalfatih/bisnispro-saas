import { db } from "@/lib/db"
import bcrypt from "bcryptjs"

// ==========================================
// Query: List Users in Tenant
// ==========================================
export async function listTenantUsers(tenantId: string, role?: string | null) {
  const whereClause: any = { tenantId }
  if (role) whereClause.role = role

  const data = await db.tenantUser.findMany({
    where: whereClause,
    include: {
      user: { select: { id: true, name: true, email: true, phone: true, isActive: true, createdAt: true } },
    },
    orderBy: { user: { createdAt: "desc" } },
  })

  return data.map((tu) => ({
    id: tu.user.id,
    tenantUserId: tu.id,
    name: tu.user.name,
    email: tu.user.email,
    phone: tu.user.phone,
    role: tu.role,
    isActive: tu.user.isActive,
    createdAt: tu.user.createdAt,
  }))
}

// ==========================================
// Mutation: Add User to Tenant
// ==========================================
export async function addUserToTenant(params: {
  tenantId: string
  callerUserId: string
  isSuperAdmin: boolean
  name: string
  email: string
  phone?: string
  role: string
  password?: string
}) {
  const { tenantId, callerUserId, isSuperAdmin, name, role, phone, password } = params
  const email = params.email.toLowerCase()

  // Cek izin
  if (!isSuperAdmin) {
    const tu = await db.tenantUser.findUnique({
      where: { tenantId_userId: { tenantId, userId: callerUserId } },
    })
    if (!tu || !["owner", "admin"].includes(tu.role)) {
      throw new Error("Tidak punya izin")
    }
  }

  // Cek kuota admin untuk paket free
  if (role === "admin") {
    const tenant = await db.tenant.findUnique({ where: { id: tenantId } })
    if (tenant?.plan === "free") {
      const adminCount = await db.tenantUser.count({ where: { tenantId, role: "admin" } })
      if (adminCount >= 1) {
        throw new Error("Kuota maksimal 1 admin tambahan untuk paket Free. Silakan upgrade paket untuk menambah.")
      }
    }
  }

  let user = await db.user.findUnique({ where: { email } })

  if (user) {
    const existing = await db.tenantUser.findUnique({
      where: { tenantId_userId: { tenantId, userId: user.id } },
    })

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
        throw new Error(`Email ini sudah terdaftar sebagai ${existingRoleLabel}. Silakan gunakan email lain untuk membuat akun ${targetRoleLabel}.`)
      }

      if (passwordUpdated) {
        return { message: "User sudah ada, password diperbarui", userId: user.id }
      }
      throw new Error(`User sudah terdaftar sebagai ${existingRoleLabel}`)
    }
  } else {
    const fallbackPassword = "12345678"
    const hashedPassword = await bcrypt.hash(password || fallbackPassword, 12)
    user = await db.user.create({
      data: { name, email, phone, password: hashedPassword },
    })
  }

  await db.tenantUser.create({
    data: { tenantId, userId: user.id, role },
  })

  return { message: "User berhasil ditambahkan", userId: user.id }
}

// ==========================================
// Mutation: Edit User
// ==========================================
export async function editTenantUser(params: {
  tenantUserId: string
  callerUserId: string
  isSuperAdmin: boolean
  name: string
  email: string
  phone?: string
  password?: string
}) {
  const { tenantUserId, callerUserId, isSuperAdmin, name, phone, password } = params
  const email = params.email.toLowerCase()

  const targetTu = await db.tenantUser.findUnique({
    where: { id: tenantUserId },
    include: { user: true }
  })

  if (!targetTu) throw new Error("User tidak ditemukan")

  if (!isSuperAdmin) {
    const callerTu = await db.tenantUser.findUnique({
      where: { tenantId_userId: { tenantId: targetTu.tenantId, userId: callerUserId } }
    })
    if (!callerTu || !["owner", "admin"].includes(callerTu.role)) {
      throw new Error("Tidak punya izin untuk mengedit user dari tenant ini")
    }
  }

  const existingEmailUser = await db.user.findUnique({ where: { email } })
  if (existingEmailUser && existingEmailUser.id !== targetTu.userId) {
    throw new Error("Email sudah digunakan oleh user lain")
  }

  const updateData: any = { name, email, phone }
  if (password && password.length >= 8) {
    updateData.password = await bcrypt.hash(password, 12)
  }

  await db.user.update({
    where: { id: targetTu.userId },
    data: updateData
  })

  return { message: "User berhasil diperbarui" }
}

// ==========================================
// Mutation: Delete User from Tenant
// ==========================================
export async function deleteTenantUser(tenantUserId: string, callerUserId: string, isSuperAdmin: boolean) {
  const targetTu = await db.tenantUser.findUnique({ where: { id: tenantUserId } })
  if (!targetTu) throw new Error("User tidak ditemukan")

  if (!isSuperAdmin) {
    const callerTu = await db.tenantUser.findUnique({
      where: { tenantId_userId: { tenantId: targetTu.tenantId, userId: callerUserId } }
    })
    if (!callerTu || !["owner", "admin"].includes(callerTu.role)) {
      throw new Error("Tidak punya izin untuk menghapus user dari tenant ini")
    }
    if (targetTu.role === "owner" && callerTu.role !== "owner") {
      throw new Error("Admin tidak bisa menghapus Owner")
    }
  }

  await db.tenantUser.delete({ where: { id: tenantUserId } })
  return { message: "User dihapus dari tenant" }
}
