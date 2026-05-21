"use server"

import { db } from "@/lib/db"
import { requireTenantAccess } from "@/lib/guards/tenant-guard"
import { revalidatePath } from "next/cache"
import { facilitySchema } from "@/features/facility/schemas/facility.schema"
import { generateUniqueSlug } from "@/lib/utils/slug"

export async function getFacilities(tenantId: string) {
  await requireTenantAccess(tenantId)
  
  return await db.facility.findMany({
    where: { tenantId },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
  })
}

export async function getFacilityById(id: string, tenantId: string) {
  await requireTenantAccess(tenantId)
  
  return await db.facility.findUnique({
    where: { id, tenantId }
  })
}

export async function createFacility(tenantId: string, data: any) {
  await requireTenantAccess(tenantId)
  
  const parsed = facilitySchema.parse(data)
  
  const slug = await generateUniqueSlug(db.facility, tenantId, parsed.name)
  
  const facility = await db.facility.create({
    data: {
      ...parsed,
      slug,
      tenantId,
    }
  })
  const tenant = await db.tenant.findUnique({ where: { id: tenantId }, select: { slug: true } })
  if (tenant) {
    const { invalidatePublicTenantCache } = await import("@/features/tenant/services/tenant-public.service")
    await invalidatePublicTenantCache(tenant.slug)
    revalidatePath("/", "layout")
  }

  
  revalidatePath("/(dashboard)/admin/website/facilities", "page")
  return facility
}

export async function updateFacility(id: string, tenantId: string, data: any) {
  await requireTenantAccess(tenantId)
  
  const parsed = facilitySchema.parse(data)
  
  const facility = await db.facility.update({
    where: { id, tenantId },
    data: parsed
  })
  const tenant = await db.tenant.findUnique({ where: { id: tenantId }, select: { slug: true } })
  if (tenant) {
    const { invalidatePublicTenantCache } = await import("@/features/tenant/services/tenant-public.service")
    await invalidatePublicTenantCache(tenant.slug)
    revalidatePath("/", "layout")
  }

  
  revalidatePath("/(dashboard)/admin/website/facilities", "page")
  return facility
}

export async function deleteFacility(id: string, tenantId: string) {
  await requireTenantAccess(tenantId)
  
  await db.facility.delete({
    where: { id, tenantId }
  })
  const tenant = await db.tenant.findUnique({ where: { id: tenantId }, select: { slug: true } })
  if (tenant) {
    const { invalidatePublicTenantCache } = await import("@/features/tenant/services/tenant-public.service")
    await invalidatePublicTenantCache(tenant.slug)
    revalidatePath("/", "layout")
  }

  
  revalidatePath("/(dashboard)/admin/website/facilities", "page")
}

export async function updateFacilitiesOrder(tenantId: string, orderedIds: string[]) {
  await requireTenantAccess(tenantId)
  
  await db.$transaction(
    orderedIds.map((id, i) =>
      db.facility.update({ where: { id, tenantId }, data: { sortOrder: i } })
    )
  )

  const tenant = await db.tenant.findUnique({ where: { id: tenantId }, select: { slug: true } })
  if (tenant) {
    const { invalidatePublicTenantCache } = await import("@/features/tenant/services/tenant-public.service")
    await invalidatePublicTenantCache(tenant.slug)
    revalidatePath("/", "layout")
  }
  
  revalidatePath("/(dashboard)/admin/website/facilities", "page")
}
