"use server"

import { requireTenantAccess } from "@/lib/guards/tenant-guard"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { popupSchema } from "@/features/popup/schemas/popup.schema"
import { revalidatePath, unstable_cache } from "next/cache"



export async function getPopups(tenantId: string) {
  await requireTenantAccess(tenantId)
  
  return await db.popup.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'desc' },
  })
}

export const getActivePopup = async (tenantId: string) => {
  const getCachedPopup = unstable_cache(
    async (id: string) => {
      return await db.popup.findFirst({
        where: { tenantId: id, isActive: true },
        orderBy: { updatedAt: 'desc' },
      })
    },
    [`active-popup-${tenantId}`],
    { tags: [`tenant-${tenantId}`, `tenant-popup-${tenantId}`], revalidate: 3600 }
  )
  return getCachedPopup(tenantId)
}

export async function getPopupById(id: string, tenantId: string) {
  await requireTenantAccess(tenantId)
  
  return await db.popup.findUnique({
    where: { id, tenantId }
  })
}

export async function createPopup(tenantId: string, data: any) {
  await requireTenantAccess(tenantId)
  
  const parsed = popupSchema.parse(data)
  
  // If this popup is set to active, deactivate others
  if (parsed.isActive) {
    await db.popup.updateMany({
      where: { tenantId, isActive: true },
      data: { isActive: false }
    })
  }
  
  const popup = await db.popup.create({
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

  
  revalidatePath("/(dashboard)/admin/website/popups", "page")
  return popup
}

export async function updatePopup(id: string, tenantId: string, data: any) {
  await requireTenantAccess(tenantId)
  
  const parsed = popupSchema.parse(data)
  
  if (parsed.isActive) {
    await db.popup.updateMany({
      where: { tenantId, isActive: true, NOT: { id } },
      data: { isActive: false }
    })
  }
  
  await db.popup.update({
    where: { id, tenantId },
    data: parsed
  })
  const tenant = await db.tenant.findUnique({ where: { id: tenantId }, select: { slug: true } })
  if (tenant) {
    const { invalidatePublicTenantCache } = await import("@/features/tenant/services/tenant-public.service")
    await invalidatePublicTenantCache(tenant.slug)
    revalidatePath("/", "layout")
  }

  
  revalidatePath("/(dashboard)/admin/website/popups", "page")
}

export async function deletePopup(id: string, tenantId: string) {
  await requireTenantAccess(tenantId)
  
  await db.popup.delete({
    where: { id, tenantId }
  })
  const tenant = await db.tenant.findUnique({ where: { id: tenantId }, select: { slug: true } })
  if (tenant) {
    const { invalidatePublicTenantCache } = await import("@/features/tenant/services/tenant-public.service")
    await invalidatePublicTenantCache(tenant.slug)
    revalidatePath("/", "layout")
  }

  
  revalidatePath("/(dashboard)/admin/website/popups", "page")
}

export async function togglePopupStatus(id: string, tenantId: string, isActive: boolean) {
  await requireTenantAccess(tenantId)
  
  if (isActive) {
    await db.popup.updateMany({
      where: { tenantId, isActive: true, NOT: { id } },
      data: { isActive: false }
    })
  }
  
  await db.popup.update({
    where: { id, tenantId },
    data: { isActive }
  })
  const tenant = await db.tenant.findUnique({ where: { id: tenantId }, select: { slug: true } })
  if (tenant) {
    const { invalidatePublicTenantCache } = await import("@/features/tenant/services/tenant-public.service")
    await invalidatePublicTenantCache(tenant.slug)
    revalidatePath("/", "layout")
  }

  
  revalidatePath("/(dashboard)/admin/website/popups", "page")
}

