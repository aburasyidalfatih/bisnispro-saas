"use server"

import { requireTenantAccess } from "@/lib/guards/tenant-guard"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { sliderSchema } from "@/features/slider/schemas/slider.schema"
import { revalidatePath } from "next/cache"
import { invalidatePublicTenantCache } from "@/features/tenant/services/tenant-public.service"



export async function getSliders(tenantId: string) {
  await requireTenantAccess(tenantId)
  
  return await db.slider.findMany({
    where: { tenantId },
    orderBy: { sortOrder: 'asc' },
  })
}

export async function getActiveSliders(tenantId: string) {
  return await db.slider.findMany({
    where: { tenantId, isActive: true },
    orderBy: { sortOrder: 'asc' },
  })
}

export async function getSliderById(id: string, tenantId: string) {
  await requireTenantAccess(tenantId)
  
  return await db.slider.findUnique({
    where: { id, tenantId }
  })
}

export async function createSlider(tenantId: string, data: any) {
  await requireTenantAccess(tenantId)
  
  const parsed = sliderSchema.parse(data)
  
  const slider = await db.slider.create({
    data: {
      ...parsed,
      tenantId,
    }
  })
  
  revalidatePath("/(dashboard)/dashboard/website/sliders", "page")
  const tenant = await db.tenant.findUnique({ where: { id: tenantId }, select: { slug: true } })
  if (tenant) {
    await invalidatePublicTenantCache(tenant.slug)
    revalidatePath(`/site/${tenant.slug}`, "page")
  }
  return slider
}

export async function updateSlider(id: string, tenantId: string, data: any) {
  await requireTenantAccess(tenantId)
  
  const parsed = sliderSchema.parse(data)
  
  await db.slider.update({
    where: { id, tenantId },
    data: parsed
  })
  
  revalidatePath("/(dashboard)/dashboard/website/sliders", "page")
  const tenant = await db.tenant.findUnique({ where: { id: tenantId }, select: { slug: true } })
  if (tenant) {
    await invalidatePublicTenantCache(tenant.slug)
    revalidatePath(`/site/${tenant.slug}`, "page")
  }
}

export async function deleteSlider(id: string, tenantId: string) {
  await requireTenantAccess(tenantId)
  
  await db.slider.delete({
    where: { id, tenantId }
  })
  
  revalidatePath("/(dashboard)/dashboard/website/sliders", "page")
  const tenant = await db.tenant.findUnique({ where: { id: tenantId }, select: { slug: true } })
  if (tenant) {
    await invalidatePublicTenantCache(tenant.slug)
    revalidatePath(`/site/${tenant.slug}`, "page")
  }
}

export async function toggleSliderStatus(id: string, tenantId: string, isActive: boolean) {
  await requireTenantAccess(tenantId)
  
  await db.slider.update({
    where: { id, tenantId },
    data: { isActive }
  })
  
  revalidatePath("/(dashboard)/dashboard/website/sliders", "page")
  const tenant = await db.tenant.findUnique({ where: { id: tenantId }, select: { slug: true } })
  if (tenant) {
    await invalidatePublicTenantCache(tenant.slug)
    revalidatePath(`/site/${tenant.slug}`, "page")
  }
}

export async function updateSlidersOrder(tenantId: string, orderedIds: string[]) {
  await requireTenantAccess(tenantId)
  
  for (let i = 0; i < orderedIds.length; i++) {
    await db.slider.update({
      where: { id: orderedIds[i], tenantId },
      data: { sortOrder: i }
    })
  }

  const tenant = await db.tenant.findUnique({ where: { id: tenantId }, select: { slug: true } })
  if (tenant) {
    await invalidatePublicTenantCache(tenant.slug)
    revalidatePath(`/site/${tenant.slug}`, "page")
  }
  
  revalidatePath("/(dashboard)/dashboard/website/sliders", "page")
}

