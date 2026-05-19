"use server"

import { requireTenantAccess } from "@/lib/guards/tenant-guard"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { achievementSchema } from "@/features/achievement/schemas/achievement.schema"
import { revalidatePath } from "next/cache"

export async function getAchievements(tenantId: string) {
  await requireTenantAccess(tenantId)
  
  return await db.achievement.findMany({
    where: { tenantId },
    orderBy: [
      { order: 'asc' },
      { date: 'desc' }
    ],
  })
}

export async function getAchievementById(id: string, tenantId: string) {
  await requireTenantAccess(tenantId)
  
  return await db.achievement.findUnique({
    where: { id, tenantId }
  })
}

export async function createAchievement(tenantId: string, data: any) {
  await requireTenantAccess(tenantId)
  
  const parsed = achievementSchema.parse(data)
  
  const achievement = await db.achievement.create({
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

  
  revalidatePath("/(dashboard)/dashboard/website/achievements", "page")
  return achievement
}

export async function updateAchievement(id: string, tenantId: string, data: any) {
  await requireTenantAccess(tenantId)
  
  const parsed = achievementSchema.parse(data)
  
  await db.achievement.update({
    where: { id, tenantId },
    data: parsed
  })
  const tenant = await db.tenant.findUnique({ where: { id: tenantId }, select: { slug: true } })
  if (tenant) {
    const { invalidatePublicTenantCache } = await import("@/features/tenant/services/tenant-public.service")
    await invalidatePublicTenantCache(tenant.slug)
    revalidatePath("/", "layout")
  }

  
  revalidatePath("/(dashboard)/dashboard/website/achievements", "page")
}

export async function deleteAchievement(id: string, tenantId: string) {
  await requireTenantAccess(tenantId)
  
  await db.achievement.delete({
    where: { id, tenantId }
  })
  const tenant = await db.tenant.findUnique({ where: { id: tenantId }, select: { slug: true } })
  if (tenant) {
    const { invalidatePublicTenantCache } = await import("@/features/tenant/services/tenant-public.service")
    await invalidatePublicTenantCache(tenant.slug)
    revalidatePath("/", "layout")
  }

  
  revalidatePath("/(dashboard)/dashboard/website/achievements", "page")
}

export async function updateAchievementsOrder(tenantId: string, orderedIds: string[]) {
  await requireTenantAccess(tenantId)
  
  // Update sequentially to avoid deadlocks
  for (let i = 0; i < orderedIds.length; i++) {
    await db.achievement.update({
      where: { id: orderedIds[i], tenantId },
      data: { order: i }
    })
  }

  const tenant = await db.tenant.findUnique({ where: { id: tenantId }, select: { slug: true } })
  if (tenant) {
    const { invalidatePublicTenantCache } = await import("@/features/tenant/services/tenant-public.service")
    await invalidatePublicTenantCache(tenant.slug)
    revalidatePath("/", "layout")
  }
  
  revalidatePath("/(dashboard)/dashboard/website/achievements", "page")
}

