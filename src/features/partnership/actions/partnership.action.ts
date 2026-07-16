"use server"

import { requireTenantMembership } from "@/lib/api-utils"
import { db } from "@/lib/db"
import { partnershipSchema } from "@/features/partnership/schemas/partnership.schema"
import { revalidatePath } from "next/cache"
import { invalidatePublicTenantCache } from "@/features/tenant/services/tenant-public.service"
import { clearTenantCache } from "@/features/tenant/services/tenant-modular.service"

export async function getPartnerships(tenantId: string) {
  const { error: accessError } = await requireTenantMembership(tenantId);
  if (accessError) throw new Error("Unauthorized")
  
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
  const { error: accessError } = await requireTenantMembership(tenantId);
  if (accessError) throw new Error("Unauthorized")
  
  return await db.partnership.findUnique({
    where: { id, tenantId }
  })
}

export async function createPartnership(tenantId: string, data: any) {
  const { error: accessError } = await requireTenantMembership(tenantId);
  if (accessError) throw new Error("Unauthorized")
  
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
    revalidatePath(`/site/${tenant.slug}`, "page"); await clearTenantCache(tenant.slug);
  }
  return partnership
}

export async function updatePartnership(id: string, tenantId: string, data: any) {
  const { error: accessError } = await requireTenantMembership(tenantId);
  if (accessError) throw new Error("Unauthorized")
  
  const parsed = partnershipSchema.parse(data)
  
  await db.partnership.update({
    where: { id, tenantId },
    data: parsed
  })
  
  revalidatePath("/admin/website/partners", "page")
  const tenant = await db.tenant.findUnique({ where: { id: tenantId }, select: { slug: true } })
  if (tenant) {
    await invalidatePublicTenantCache(tenant.slug)
    revalidatePath(`/site/${tenant.slug}`, "page"); await clearTenantCache(tenant.slug);
  }
}

export async function deletePartnership(id: string, tenantId: string) {
  const { error: accessError } = await requireTenantMembership(tenantId);
  if (accessError) throw new Error("Unauthorized")
  
  await db.partnership.delete({
    where: { id, tenantId }
  })
  
  revalidatePath("/admin/website/partners", "page")
  const tenant = await db.tenant.findUnique({ where: { id: tenantId }, select: { slug: true } })
  if (tenant) {
    await invalidatePublicTenantCache(tenant.slug)
    revalidatePath(`/site/${tenant.slug}`, "page"); await clearTenantCache(tenant.slug);
  }
}

export async function togglePartnershipStatus(id: string, tenantId: string, isActive: boolean) {
  const { error: accessError } = await requireTenantMembership(tenantId);
  if (accessError) throw new Error("Unauthorized")
  
  await db.partnership.update({
    where: { id, tenantId },
    data: { isActive }
  })
  
  revalidatePath("/admin/website/partners", "page")
  const tenant = await db.tenant.findUnique({ where: { id: tenantId }, select: { slug: true } })
  if (tenant) {
    await invalidatePublicTenantCache(tenant.slug)
    revalidatePath(`/site/${tenant.slug}`, "page"); await clearTenantCache(tenant.slug);
  }
}

export async function updatePartnershipsOrder(tenantId: string, orderedIds: string[]) {
  const { error: accessError } = await requireTenantMembership(tenantId);
  if (accessError) throw new Error("Unauthorized")
  
  await db.$transaction(
    orderedIds.map((id, i) =>
      db.partnership.update({ where: { id, tenantId }, data: { sortOrder: i } })
    )
  )

  const tenant = await db.tenant.findUnique({ where: { id: tenantId }, select: { slug: true } })
  if (tenant) {
    await invalidatePublicTenantCache(tenant.slug)
    revalidatePath(`/site/${tenant.slug}`, "page"); await clearTenantCache(tenant.slug);
  }
  
  revalidatePath("/admin/website/partners", "page")
}
