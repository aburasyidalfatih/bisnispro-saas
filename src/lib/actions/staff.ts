"use server"

import { requireTenantAccess } from "@/lib/guards/tenant-guard"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { staffSchema } from "@/lib/validations/staff"
import { revalidatePath } from "next/cache"
import crypto from "crypto"



export async function getStaff(tenantId: string) {
  await requireTenantAccess(tenantId)
  
  return await db.staff.findMany({
    where: { tenantId },
    orderBy: { sortOrder: 'asc' },
  })
}

export async function getStaffById(id: string, tenantId: string) {
  await requireTenantAccess(tenantId)
  
  return await db.staff.findUnique({
    where: { id, tenantId }
  })
}

export async function createStaff(tenantId: string, data: any) {
  await requireTenantAccess(tenantId)
  
  const parsed = staffSchema.parse(data)
  
  let userId: string | null = null

  // Jika email diisi, buat akun User untuk "Data Master -> Menu Guru"
  if (parsed.email && parsed.email.trim() !== '') {
    const email = parsed.email.trim().toLowerCase()
    let user = await db.user.findUnique({ where: { email } })

    if (!user) {
      const bcrypt = await import("bcryptjs")
      const tempPassword = parsed.password && parsed.password.trim() !== '' ? parsed.password.trim() : crypto.randomBytes(8).toString("base64url")
      const hashedPassword = await bcrypt.hash(tempPassword, 12)
      user = await db.user.create({
        data: { name: parsed.name, email, password: hashedPassword },
      })
    } else if (parsed.password && parsed.password.trim() !== '') {
      // Jika user sudah ada dan admin memasukkan password baru, update passwordnya
      const bcrypt = await import("bcryptjs")
      const hashedPassword = await bcrypt.hash(parsed.password.trim(), 12)
      user = await db.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      })
    }

    const existingTu = await db.tenantUser.findUnique({
      where: { tenantId_userId: { tenantId, userId: user.id } },
    })

    if (!existingTu) {
      await db.tenantUser.create({
        data: { tenantId, userId: user.id, role: "guru" },
      })
    } else if (existingTu.role !== "guru") {
      const roleMap: Record<string, string> = { guru: "Guru", orangtua: "Orang Tua", admin: "Admin", siswa: "Siswa", owner: "Owner" }
      const existingRoleLabel = roleMap[existingTu.role] || existingTu.role
      throw new Error(`Email ini sudah terdaftar sebagai ${existingRoleLabel}. Silakan gunakan email lain untuk membuat profil Guru.`)
    }

    userId = user.id
  }
  
  const staff = await db.staff.create({
    data: {
      name: parsed.name,
      role: parsed.role,
      bio: parsed.bio,
      imageUrl: parsed.imageUrl,
      sortOrder: parsed.sortOrder,
      email: parsed.email || null,
      phone: parsed.phone || null,
      subject: parsed.subject || null,
      education: parsed.education || null,
      userId,
      tenantId,
    }
  })

  // Auto-sync logic removed to prevent overriding explicit website settings
  
  const tenant = await db.tenant.findUnique({ where: { id: tenantId }, select: { slug: true } })
  if (tenant) {
    const { invalidatePublicTenantCache } = await import("@/lib/services/tenant-public")
    await invalidatePublicTenantCache(tenant.slug)
    revalidatePath(`/site/${tenant.slug}/gtk`, "page")
    revalidatePath(`/site/${tenant.slug}`, "page")
    revalidatePath("/gtk", "page")
    revalidatePath("/", "layout")
  }
  
  revalidatePath("/(dashboard)/dashboard/website/gtk", "page")
  return staff
}

export async function updateStaff(id: string, tenantId: string, data: any) {
  await requireTenantAccess(tenantId)
  
  const parsed = staffSchema.parse(data)
  
  let userId: string | null = null

  if (parsed.email && parsed.email.trim() !== '') {
    const email = parsed.email.trim().toLowerCase()
    let user = await db.user.findUnique({ where: { email } })

    if (!user) {
      const bcrypt = await import("bcryptjs")
      const tempPassword = parsed.password && parsed.password.trim() !== '' ? parsed.password.trim() : crypto.randomBytes(8).toString("base64url")
      const hashedPassword = await bcrypt.hash(tempPassword, 12)
      user = await db.user.create({
        data: { name: parsed.name, email, password: hashedPassword },
      })
    } else if (parsed.password && parsed.password.trim() !== '') {
      // Jika user sudah ada dan admin memasukkan password baru, update passwordnya
      const bcrypt = await import("bcryptjs")
      const hashedPassword = await bcrypt.hash(parsed.password.trim(), 12)
      user = await db.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      })
    }

    const existingTu = await db.tenantUser.findUnique({
      where: { tenantId_userId: { tenantId, userId: user.id } },
    })

    if (!existingTu) {
      await db.tenantUser.create({
        data: { tenantId, userId: user.id, role: "guru" },
      })
    } else if (existingTu.role !== "guru") {
      const roleMap: Record<string, string> = { guru: "Guru", orangtua: "Orang Tua", admin: "Admin", siswa: "Siswa", owner: "Owner" }
      const existingRoleLabel = roleMap[existingTu.role] || existingTu.role
      throw new Error(`Email ini sudah terdaftar sebagai ${existingRoleLabel}. Silakan gunakan email lain untuk membuat profil Guru.`)
    }

    userId = user.id
  }

  await db.staff.update({
    where: { id, tenantId },
    data: {
      name: parsed.name,
      role: parsed.role,
      bio: parsed.bio,
      imageUrl: parsed.imageUrl,
      sortOrder: parsed.sortOrder,
      email: parsed.email || null,
      phone: parsed.phone || null,
      subject: parsed.subject || null,
      education: parsed.education || null,
      userId,
    }
  })

  // Auto-sync logic removed to prevent overriding explicit website settings
  
  const tenant = await db.tenant.findUnique({ where: { id: tenantId }, select: { slug: true } })
  if (tenant) {
    const { invalidatePublicTenantCache } = await import("@/lib/services/tenant-public")
    await invalidatePublicTenantCache(tenant.slug)
    revalidatePath(`/site/${tenant.slug}/gtk`, "page")
    revalidatePath(`/site/${tenant.slug}`, "page")
    revalidatePath("/gtk", "page")
    revalidatePath("/", "layout")
  }
  
  revalidatePath("/(dashboard)/dashboard/website/gtk", "page")
}

export async function deleteStaff(id: string, tenantId: string) {
  await requireTenantAccess(tenantId)

  // Ambil data staff sebelum dihapus untuk cek role
  const staffToDelete = await db.staff.findUnique({ where: { id, tenantId }, select: { role: true } })
  
  await db.staff.delete({
    where: { id, tenantId }
  })

  // Clear principal settings logic removed to prevent unintended side effects on website settings
  
  const tenant = await db.tenant.findUnique({ where: { id: tenantId }, select: { slug: true } })
  if (tenant) {
    const { invalidatePublicTenantCache } = await import("@/lib/services/tenant-public")
    await invalidatePublicTenantCache(tenant.slug)
    revalidatePath(`/site/${tenant.slug}/gtk`, "page")
    revalidatePath(`/site/${tenant.slug}`, "page")
    revalidatePath("/gtk", "page")
    revalidatePath("/", "layout")
  }
  
  revalidatePath("/(dashboard)/dashboard/website/gtk", "page")
}

/**
 * Helper: Sinkronkan data Kepala Sekolah dari Staff ke tenant.settings
 * Memastikan foto & nama kepsek konsisten antara halaman /gtk dan homepage
 */
async function syncPrincipalToSettings(tenantId: string, name: string, imageUrl: string | null) {
  try {
    const tenant = await db.tenant.findUnique({
      where: { id: tenantId },
      select: { settings: true },
    })

    const currentSettings = (tenant?.settings as Record<string, any>) || {}
    const updatedSettings = {
      ...currentSettings,
      principalName: name,
      ...(imageUrl ? { principalImage: imageUrl } : {}),
    }

    await db.tenant.update({
      where: { id: tenantId },
      data: { settings: updatedSettings },
    })
  } catch (error) {
    // Non-critical: log tapi jangan gagalkan operasi utama
    console.error("[syncPrincipalToSettings] Gagal sync:", error)
  }
}
