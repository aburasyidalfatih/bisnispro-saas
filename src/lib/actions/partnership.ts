"use server"

import { requireTenantAccess } from "@/lib/guards/tenant-guard"
import { db } from "@/lib/db"
import { partnershipSchema } from "@/lib/validations/partnership"
import { revalidatePath } from "next/cache"
import { invalidatePublicTenantCache } from "@/lib/services/tenant-public"

export async function getPartnerships(tenantId: string) {
  await requireTenantAccess(tenantId)
  
  return await db.partnership.findMany({
    where: { tenantId },
    orderBy: { sortOrder: 'asc' },
  })
}

export async function getActivePartnerships(tenantId: string) {
  return await db.partnership.findMany({
    where: { tenantId, isActive: true },
    orderBy: { sortOrder: 'asc' },
  })
}

export async function getPartnershipById(id: string, tenantId: string) {
  await requireTenantAccess(tenantId)
  
  return await db.partnership.findUnique({
    where: { id, tenantId }
  })
}

export async function createPartnership(tenantId: string, data: any) {
  await requireTenantAccess(tenantId)
  
  const parsed = partnershipSchema.parse(data)
  
  const partnership = await db.partnership.create({
    data: {
      ...parsed,
      tenantId,
    }
  })
  
  revalidatePath("/admin/website/partners", "page")
  const tenant = await db.tenant.findUnique({ where: { id: tenantId }, select: { slug: true } })
  if (tenant) {
    await invalidatePublicTenantCache(tenant.slug)
    revalidatePath(`/site/${tenant.slug}`, "page")
  }
  return partnership
}

export async function updatePartnership(id: string, tenantId: string, data: any) {
  await requireTenantAccess(tenantId)
  
  const parsed = partnershipSchema.parse(data)
  
  await db.partnership.update({
    where: { id, tenantId },
    data: parsed
  })
  
  revalidatePath("/admin/website/partners", "page")
  const tenant = await db.tenant.findUnique({ where: { id: tenantId }, select: { slug: true } })
  if (tenant) {
    await invalidatePublicTenantCache(tenant.slug)
    revalidatePath(`/site/${tenant.slug}`, "page")
  }
}

export async function deletePartnership(id: string, tenantId: string) {
  await requireTenantAccess(tenantId)
  
  await db.partnership.delete({
    where: { id, tenantId }
  })
  
  revalidatePath("/admin/website/partners", "page")
  const tenant = await db.tenant.findUnique({ where: { id: tenantId }, select: { slug: true } })
  if (tenant) {
    await invalidatePublicTenantCache(tenant.slug)
    revalidatePath(`/site/${tenant.slug}`, "page")
  }
}

export async function togglePartnershipStatus(id: string, tenantId: string, isActive: boolean) {
  await requireTenantAccess(tenantId)
  
  await db.partnership.update({
    where: { id, tenantId },
    data: { isActive }
  })
  
  revalidatePath("/admin/website/partners", "page")
  const tenant = await db.tenant.findUnique({ where: { id: tenantId }, select: { slug: true } })
  if (tenant) {
    await invalidatePublicTenantCache(tenant.slug)
    revalidatePath(`/site/${tenant.slug}`, "page")
  }
}
