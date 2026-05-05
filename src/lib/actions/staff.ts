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
    const email = parsed.email.trim()
    let user = await db.user.findUnique({ where: { email } })

    if (!user) {
      const bcrypt = await import("bcryptjs")
      const tempPassword = crypto.randomBytes(8).toString("base64url")
      const hashedPassword = await bcrypt.hash(tempPassword, 12)
      user = await db.user.create({
        data: { name: parsed.name, email, password: hashedPassword },
      })
    }

    const existingTu = await db.tenantUser.findUnique({
      where: { tenantId_userId: { tenantId, userId: user.id } },
    })

    if (!existingTu) {
      await db.tenantUser.create({
        data: { tenantId, userId: user.id, role: "guru" },
      })
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
  
  const tenant = await db.tenant.findUnique({ where: { id: tenantId }, select: { slug: true } })
  if (tenant) {
    const { invalidatePublicTenantCache } = await import("@/lib/services/tenant-public")
    await invalidatePublicTenantCache(tenant.slug)
    revalidatePath(`/site/${tenant.slug}/gtk`, "page")
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
    const email = parsed.email.trim()
    let user = await db.user.findUnique({ where: { email } })

    if (!user) {
      const bcrypt = await import("bcryptjs")
      const tempPassword = crypto.randomBytes(8).toString("base64url")
      const hashedPassword = await bcrypt.hash(tempPassword, 12)
      user = await db.user.create({
        data: { name: parsed.name, email, password: hashedPassword },
      })
    }

    const existingTu = await db.tenantUser.findUnique({
      where: { tenantId_userId: { tenantId, userId: user.id } },
    })

    if (!existingTu) {
      await db.tenantUser.create({
        data: { tenantId, userId: user.id, role: "guru" },
      })
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
  
  const tenant = await db.tenant.findUnique({ where: { id: tenantId }, select: { slug: true } })
  if (tenant) {
    const { invalidatePublicTenantCache } = await import("@/lib/services/tenant-public")
    await invalidatePublicTenantCache(tenant.slug)
    revalidatePath(`/site/${tenant.slug}/gtk`, "page")
    revalidatePath("/gtk", "page")
    revalidatePath("/", "layout")
  }
  
  revalidatePath("/(dashboard)/dashboard/website/gtk", "page")
}

export async function deleteStaff(id: string, tenantId: string) {
  await requireTenantAccess(tenantId)
  
  await db.staff.delete({
    where: { id, tenantId }
  })
  
  const tenant = await db.tenant.findUnique({ where: { id: tenantId }, select: { slug: true } })
  if (tenant) {
    const { invalidatePublicTenantCache } = await import("@/lib/services/tenant-public")
    await invalidatePublicTenantCache(tenant.slug)
    revalidatePath(`/site/${tenant.slug}/gtk`, "page")
    revalidatePath("/gtk", "page")
    revalidatePath("/", "layout")
  }
  
  revalidatePath("/(dashboard)/dashboard/website/gtk", "page")
}

