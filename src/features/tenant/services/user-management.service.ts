import { db, withTenant } from "@/lib/db"
import bcrypt from "bcryptjs"

// ==========================================
// Query: List Users in Tenant
// ==========================================
export async function listTenantUsers(tenantId: string, role?: string | null) {
  const tenantDb = withTenant(tenantId)
  const whereClause: any = { tenantId }
  if (role) whereClause.role = role

  const data = await tenantDb.tenantUser.findMany({
    where: whereClause,
    include: {
      user: { select: { id: true, name: true, email: true, phone: true, isActive: true, createdAt: true } },
    },
    orderBy: { user: { createdAt: "desc" } },
  })

  // Fetch staff records if role is guru or fetching all
  let staffMap = new Map<string, string>()
  if (!role || role === "guru") {
    const userIds = data.map((tu) => tu.user.id)
    const staffRecords = await tenantDb.staff.findMany({
      where: { tenantId, userId: { in: userIds } },
      select: { id: true, userId: true }
    })
    staffRecords.forEach(s => {
      if (s.userId) staffMap.set(s.userId, s.id)
    })
  }

  return data.map((tu) => ({
    id: tu.user.id,
    tenantUserId: tu.id,
    name: tu.user.name,
    email: tu.user.email,
    phone: tu.user.phone,
    role: tu.role,
    isActive: tu.user.isActive,
    createdAt: tu.user.createdAt,
    staffId: staffMap.get(tu.user.id) || null,
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
  const tenantDb = withTenant(tenantId)

  // Cek izin
  if (!isSuperAdmin) {
    const tu = await tenantDb.tenantUser.findUnique({
      where: { tenantId_userId: { tenantId, userId: callerUserId } },
    })
    if (!tu || !["owner", "admin"].includes(tu.role)) {
      throw new Error("Tidak punya izin")
    }
  }

  // Cek kuota admin untuk paket free
  if (role === "admin") {
    const tenant = await tenantDb.tenant.findUnique({ where: { id: tenantId } })
    if (tenant?.plan === "free") {
      const adminCount = await tenantDb.tenantUser.count({ where: { tenantId, role: "admin" } })
      if (adminCount >= 1) {
        throw new Error("Kuota maksimal 1 admin tambahan untuk paket Free. Silakan upgrade paket untuk menambah.")
      }
    }
  }

  let user = await db.user.findUnique({ where: { email } })

  if (user) {
    const existing = await tenantDb.tenantUser.findUnique({
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

  await tenantDb.tenantUser.create({
    data: { tenantId, userId: user.id, role },
  })

  // JIKA role === "guru", otomatis buat profil Staff (GTK)
  if (role === "guru") {
    const existingStaff = await tenantDb.staff.findFirst({
      where: { tenantId, userId: user.id }
    })
    
    if (!existingStaff) {
      // Ambil sortOrder terakhir
      const lastStaff = await tenantDb.staff.findFirst({
        where: { tenantId },
        orderBy: { sortOrder: 'desc' },
        select: { sortOrder: true }
      })
      const nextOrder = lastStaff ? lastStaff.sortOrder + 1 : 0
      
      await tenantDb.staff.create({
        data: {
          tenantId,
          userId: user.id,
          name,
          email,
          phone: phone || null,
          role: "Guru",
          sortOrder: nextOrder,
        }
      })
    }
  }

  // Audit trail
  await tenantDb.auditLog.create({
    data: {
      tenantId,
      action: "USER_ADDED",
      entity: "User",
      newData: { targetUserId: user.id, name, role }
    }
  }).catch(() => {})

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
  const tenantDb = withTenant(targetTu.tenantId)

  if (!isSuperAdmin) {
    const callerTu = await tenantDb.tenantUser.findUnique({
      where: { tenantId_userId: { tenantId: targetTu.tenantId, userId: callerUserId } }
    })
    if (!callerTu || !["owner", "admin"].includes(callerTu.role)) {
      throw new Error("Tidak punya izin untuk mengedit user dari tenant ini")
    }

    // Blokir Admin mengedit Owner
    if (callerTu.role === "admin" && targetTu.role === "owner") {
      throw new Error("Admin tidak diizinkan mengubah data Owner")
    }
  }

  const existingEmailUser = await db.user.findUnique({ where: { email } })
  if (existingEmailUser && existingEmailUser.id !== targetTu.userId) {
    throw new Error("Email sudah digunakan oleh user lain")
  }

  const updateData: any = { name, email, phone }
  
  // Hanya Owner atau user itu sendiri yang bisa mengganti password via endpoint ini
  if (password && password.length >= 8) {
    if (!isSuperAdmin) {
      const isSelf = callerUserId === targetTu.userId
      const callerTu = await tenantDb.tenantUser.findUnique({
        where: { tenantId_userId: { tenantId: targetTu.tenantId, userId: callerUserId } }
      })
      if (!isSelf && callerTu?.role !== "owner") {
        throw new Error("Hanya Owner yang dapat mengubah password user lain")
      }
    }
    updateData.password = await bcrypt.hash(password, 12)
  }

  await db.user.update({
    where: { id: targetTu.userId },
    data: updateData
  })

  // Sinkronkan ke Staff jika role adalah guru
  if (targetTu.role === "guru") {
    const existingStaff = await tenantDb.staff.findFirst({
      where: { tenantId: targetTu.tenantId, userId: targetTu.userId }
    })
    if (existingStaff) {
      await tenantDb.staff.update({
        where: { id: existingStaff.id },
        data: { name, email, phone: phone || null }
      })
    }
  }

  // Audit trail
  await tenantDb.auditLog.create({
    data: {
      tenantId: targetTu.tenantId,
      action: "USER_EDITED",
      entity: "User",
      newData: { targetUserId: targetTu.userId, name, email }
    }
  }).catch(() => {})

  return { message: "User berhasil diperbarui" }
}

// ==========================================
// Mutation: Delete User from Tenant
// ==========================================
export async function deleteTenantUser(tenantUserId: string, callerUserId: string, isSuperAdmin: boolean) {
  const targetTu = await db.tenantUser.findUnique({ where: { id: tenantUserId } })
  if (!targetTu) throw new Error("User tidak ditemukan")
  const tenantDb = withTenant(targetTu.tenantId)

  if (!isSuperAdmin) {
    const callerTu = await tenantDb.tenantUser.findUnique({
      where: { tenantId_userId: { tenantId: targetTu.tenantId, userId: callerUserId } }
    })
    if (!callerTu || !["owner", "admin"].includes(callerTu.role)) {
      throw new Error("Tidak punya izin untuk menghapus user dari tenant ini")
    }
    if (targetTu.role === "owner" && callerTu.role !== "owner") {
      throw new Error("Admin tidak bisa menghapus Owner")
    }
  }

  await tenantDb.tenantUser.delete({ where: { id: tenantUserId } })

  // Audit trail
  await tenantDb.auditLog.create({
    data: {
      tenantId: targetTu.tenantId,
      action: "USER_DELETED",
      entity: "User",
      newData: { targetUserId: targetTu.userId, tenantUserId }
    }
  }).catch(() => {})

  return { message: "User dihapus dari tenant" }
}
