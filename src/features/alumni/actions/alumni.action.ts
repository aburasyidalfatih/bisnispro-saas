"use server"

import { requireTenantAccess } from "@/lib/guards/tenant-guard"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { alumniSchema } from "@/features/alumni/schemas/alumni.schema"
import { revalidatePath } from "next/cache"



export async function getAlumni(tenantId: string) {
  await requireTenantAccess(tenantId)
  
  return await db.alumni.findMany({
    where: { tenantId },
    orderBy: [{ sortOrder: 'asc' }, { graduationYear: 'desc' }],
  })
}

export async function getAlumniById(id: string, tenantId: string) {
  await requireTenantAccess(tenantId)
  
  return await db.alumni.findUnique({
    where: { id, tenantId }
  })
}

export async function createAlumni(tenantId: string, data: any) {
  await requireTenantAccess(tenantId)
  
  const parsed = alumniSchema.parse(data)
  
  const alumni = await db.alumni.create({
    data: {
      ...parsed,
      tenantId,
    }
  })
  const tenant = await db.tenant.findUnique({ where: { id: tenantId }, select: { slug: true } })
  if (tenant) {
    const { invalidatePublicTenantCache } = await import("@/features/tenant/services/tenant-public.service")
    await invalidatePublicTenantCache(tenant.slug)
    revalidatePath("/", "layout")
  }

  
  revalidatePath("/(dashboard)/dashboard/website/alumni", "page")
  return alumni
}

export async function updateAlumni(id: string, tenantId: string, data: any) {
  await requireTenantAccess(tenantId)
  
  const parsed = alumniSchema.parse(data)
  
  await db.alumni.update({
    where: { id, tenantId },
    data: parsed
  })
  const tenant = await db.tenant.findUnique({ where: { id: tenantId }, select: { slug: true } })
  if (tenant) {
    const { invalidatePublicTenantCache } = await import("@/features/tenant/services/tenant-public.service")
    await invalidatePublicTenantCache(tenant.slug)
    revalidatePath("/", "layout")
  }

  
  revalidatePath("/(dashboard)/dashboard/website/alumni", "page")
}

export async function deleteAlumni(id: string, tenantId: string) {
  await requireTenantAccess(tenantId)
  
  await db.alumni.delete({
    where: { id, tenantId }
  })
  const tenant = await db.tenant.findUnique({ where: { id: tenantId }, select: { slug: true } })
  if (tenant) {
    const { invalidatePublicTenantCache } = await import("@/features/tenant/services/tenant-public.service")
    await invalidatePublicTenantCache(tenant.slug)
    revalidatePath("/", "layout")
  }

  
  revalidatePath("/(dashboard)/dashboard/website/alumni", "page")
}

export async function updateAlumniOrder(tenantId: string, orderedIds: string[]) {
  await requireTenantAccess(tenantId)
  
  for (let i = 0; i < orderedIds.length; i++) {
    await db.alumni.update({
      where: { id: orderedIds[i], tenantId },
      data: { sortOrder: i }
    })
  }

  const tenant = await db.tenant.findUnique({ where: { id: tenantId }, select: { slug: true } })
  if (tenant) {
    const { invalidatePublicTenantCache } = await import("@/features/tenant/services/tenant-public.service")
    await invalidatePublicTenantCache(tenant.slug)
    revalidatePath("/", "layout")
  }
  
  revalidatePath("/(dashboard)/dashboard/website/alumni", "page")
}

