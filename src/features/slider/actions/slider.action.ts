"use server"

import { requireTenantMembership } from "@/lib/api-utils"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { sliderSchema } from "@/features/slider/schemas/slider.schema"
import { revalidatePath } from "next/cache"
import { invalidatePublicTenantCache } from "@/features/tenant/services/tenant-public.service"
import { clearTenantCache } from "@/features/tenant/services/tenant-modular.service"



export async function getSliders(tenantId: string) {
  const { error: accessError } = await requireTenantMembership(tenantId);
  if (accessError) throw new Error("Unauthorized")
  
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
  const { error: accessError } = await requireTenantMembership(tenantId);
  if (accessError) throw new Error("Unauthorized")
  
  return await db.slider.findUnique({
    where: { id, tenantId }
  })
}

export async function createSlider(tenantId: string, data: any) {
  const { error: accessError } = await requireTenantMembership(tenantId);
  if (accessError) throw new Error("Unauthorized")
  
  const parsed = sliderSchema.parse(data)
  
  const slider = await db.slider.create({
    data: {
      ...parsed,
      tenantId,
    }
  })
  
  revalidatePath("/(dashboard)/admin/website/sliders", "page")
  const tenant = await db.tenant.findUnique({ where: { id: tenantId }, select: { slug: true } })
  if (tenant) {
    await invalidatePublicTenantCache(tenant.slug)
    revalidatePath(`/site/${tenant.slug}`, "page"); await clearTenantCache(tenant.slug);
  }
  return slider
}

export async function updateSlider(id: string, tenantId: string, data: any) {
  const { error: accessError } = await requireTenantMembership(tenantId);
  if (accessError) throw new Error("Unauthorized")
  
  const parsed = sliderSchema.parse(data)
  
  await db.slider.update({
    where: { id, tenantId },
    data: parsed
  })
  
  revalidatePath("/(dashboard)/admin/website/sliders", "page")
  const tenant = await db.tenant.findUnique({ where: { id: tenantId }, select: { slug: true } })
  if (tenant) {
    await invalidatePublicTenantCache(tenant.slug)
    revalidatePath(`/site/${tenant.slug}`, "page"); await clearTenantCache(tenant.slug);
  }
}

export async function deleteSlider(id: string, tenantId: string) {
  const { error: accessError } = await requireTenantMembership(tenantId);
  if (accessError) throw new Error("Unauthorized")
  
  await db.slider.delete({
    where: { id, tenantId }
  })
  
  revalidatePath("/(dashboard)/admin/website/sliders", "page")
  const tenant = await db.tenant.findUnique({ where: { id: tenantId }, select: { slug: true } })
  if (tenant) {
    await invalidatePublicTenantCache(tenant.slug)
    revalidatePath(`/site/${tenant.slug}`, "page"); await clearTenantCache(tenant.slug);
  }
}

export async function toggleSliderStatus(id: string, tenantId: string, isActive: boolean) {
  const { error: accessError } = await requireTenantMembership(tenantId);
  if (accessError) throw new Error("Unauthorized")
  
  await db.slider.update({
    where: { id, tenantId },
    data: { isActive }
  })
  
  revalidatePath("/(dashboard)/admin/website/sliders", "page")
  const tenant = await db.tenant.findUnique({ where: { id: tenantId }, select: { slug: true } })
  if (tenant) {
    await invalidatePublicTenantCache(tenant.slug)
    revalidatePath(`/site/${tenant.slug}`, "page"); await clearTenantCache(tenant.slug);
  }
}

export async function updateSlidersOrder(tenantId: string, orderedIds: string[]) {
  const { error: accessError } = await requireTenantMembership(tenantId);
  if (accessError) throw new Error("Unauthorized")
  
  await db.$transaction(
    orderedIds.map((id, i) =>
      db.slider.update({ where: { id, tenantId }, data: { sortOrder: i } })
    )
  )

  const tenant = await db.tenant.findUnique({ where: { id: tenantId }, select: { slug: true } })
  if (tenant) {
    await invalidatePublicTenantCache(tenant.slug)
    revalidatePath(`/site/${tenant.slug}`, "page"); await clearTenantCache(tenant.slug);
  }
  
  revalidatePath("/(dashboard)/admin/website/sliders", "page")
}

