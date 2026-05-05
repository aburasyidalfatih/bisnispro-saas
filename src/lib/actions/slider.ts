"use server"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { sliderSchema } from "@/lib/validations/slider"
import { revalidatePath } from "next/cache"
import { invalidatePublicTenantCache } from "@/lib/services/tenant-public"

async function checkTenantAccess(tenantId: string) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  if (session.user.isSuperAdmin) return true

  const tu = await db.tenantUser.findUnique({
    where: { tenantId_userId: { tenantId, userId: session.user.id } },
  })
  
  const allowedRoles = ["owner", "admin", "operator"]
  if (!tu || !allowedRoles.includes(tu.role)) {
    throw new Error("Forbidden")
  }
  return true
}

export async function getSliders(tenantId: string) {
  await checkTenantAccess(tenantId)
  
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
  await checkTenantAccess(tenantId)
  
  return await db.slider.findUnique({
    where: { id, tenantId }
  })
}

export async function createSlider(tenantId: string, data: any) {
  await checkTenantAccess(tenantId)
  
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
  await checkTenantAccess(tenantId)
  
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
  await checkTenantAccess(tenantId)
  
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
  await checkTenantAccess(tenantId)
  
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
