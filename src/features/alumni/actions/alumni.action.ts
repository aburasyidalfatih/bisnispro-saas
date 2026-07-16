"use server"

import { requireTenantMembership } from "@/lib/api-utils"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { alumniSchema } from "@/features/alumni/schemas/alumni.schema"
import { revalidatePath } from "next/cache"
import { clearTenantCache } from "@/features/tenant/services/tenant-modular.service"



export async function getAlumni(tenantId: string) {
  const { error: accessError } = await requireTenantMembership(tenantId);
  if (accessError) throw new Error("Unauthorized")
  
  return await db.alumni.findMany({
    where: { tenantId },
    orderBy: [{ sortOrder: 'asc' }, { graduationYear: 'desc' }],
  })
}

export async function getAlumniById(id: string, tenantId: string) {
  const { error: accessError } = await requireTenantMembership(tenantId);
  if (accessError) throw new Error("Unauthorized")
  
  return await db.alumni.findUnique({
    where: { id, tenantId }
  })
}

export async function createAlumni(tenantId: string, data: any) {
  const { error: accessError } = await requireTenantMembership(tenantId);
  if (accessError) throw new Error("Unauthorized")
  
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
    revalidatePath("/", "layout");
    if (tenant?.slug) await clearTenantCache(tenant.slug);;
  }

  
  revalidatePath("/(dashboard)/admin/website/alumni", "page")
  return alumni
}

export async function updateAlumni(id: string, tenantId: string, data: any) {
  const { error: accessError } = await requireTenantMembership(tenantId);
  if (accessError) throw new Error("Unauthorized")
  
  const parsed = alumniSchema.parse(data)
  
  await db.alumni.update({
    where: { id, tenantId },
    data: parsed
  })
  const tenant = await db.tenant.findUnique({ where: { id: tenantId }, select: { slug: true } })
  if (tenant) {
    const { invalidatePublicTenantCache } = await import("@/features/tenant/services/tenant-public.service")
    await invalidatePublicTenantCache(tenant.slug)
    revalidatePath("/", "layout");
    if (tenant?.slug) await clearTenantCache(tenant.slug);;
  }

  
  revalidatePath("/(dashboard)/admin/website/alumni", "page")
}

export async function deleteAlumni(id: string, tenantId: string) {
  const { error: accessError } = await requireTenantMembership(tenantId);
  if (accessError) throw new Error("Unauthorized")
  
  await db.alumni.delete({
    where: { id, tenantId }
  })
  const tenant = await db.tenant.findUnique({ where: { id: tenantId }, select: { slug: true } })
  if (tenant) {
    const { invalidatePublicTenantCache } = await import("@/features/tenant/services/tenant-public.service")
    await invalidatePublicTenantCache(tenant.slug)
    revalidatePath("/", "layout");
    if (tenant?.slug) await clearTenantCache(tenant.slug);;
  }

  
  revalidatePath("/(dashboard)/admin/website/alumni", "page")
}

export async function updateAlumniOrder(tenantId: string, orderedIds: string[]) {
  const { error: accessError } = await requireTenantMembership(tenantId);
  if (accessError) throw new Error("Unauthorized")
  
  await db.$transaction(
    orderedIds.map((id, i) =>
      db.alumni.update({ where: { id, tenantId }, data: { sortOrder: i } })
    )
  )

  const tenant = await db.tenant.findUnique({ where: { id: tenantId }, select: { slug: true } })
  if (tenant) {
    const { invalidatePublicTenantCache } = await import("@/features/tenant/services/tenant-public.service")
    await invalidatePublicTenantCache(tenant.slug)
    revalidatePath("/", "layout");
    if (tenant?.slug) await clearTenantCache(tenant.slug);;
  }
  
  revalidatePath("/(dashboard)/admin/website/alumni", "page")
}

export async function submitPublicAlumni(tenantId: string, data: any) {
  const parsed = alumniSchema.parse(data)
  
  const alumni = await db.alumni.create({
    data: {
      ...parsed,
      tenantId,
      isApproved: false,
    }
  })
  
  // Clear cache just in case, though it won't show until approved
  const tenant = await db.tenant.findUnique({ where: { id: tenantId }, select: { slug: true } })
  if (tenant) {
    const { invalidatePublicTenantCache } = await import("@/features/tenant/services/tenant-public.service")
    await invalidatePublicTenantCache(tenant.slug)
    revalidatePath("/", "layout")
    if (tenant?.slug) await clearTenantCache(tenant.slug)
  }

  return alumni
}

export async function toggleAlumniApproval(id: string, tenantId: string, isApproved: boolean) {
  const { error: accessError } = await requireTenantMembership(tenantId);
  if (accessError) throw new Error("Unauthorized")
  
  await db.alumni.update({
    where: { id, tenantId },
    data: { isApproved }
  })
  
  const tenant = await db.tenant.findUnique({ where: { id: tenantId }, select: { slug: true } })
  if (tenant) {
    const { invalidatePublicTenantCache } = await import("@/features/tenant/services/tenant-public.service")
    await invalidatePublicTenantCache(tenant.slug)
    revalidatePath("/", "layout")
    if (tenant?.slug) await clearTenantCache(tenant.slug)
  }
  
  revalidatePath("/(dashboard)/admin/website/alumni", "page")
}
