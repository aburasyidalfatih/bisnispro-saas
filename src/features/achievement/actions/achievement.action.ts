"use server"

import { requireTenantMembership } from "@/lib/api-utils"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { achievementSchema } from "@/features/achievement/schemas/achievement.schema"
import { revalidatePath } from "next/cache"
import { generateUniqueSlug } from "@/lib/utils/slug"
import { clearTenantCache } from "@/features/tenant/services/tenant-modular.service"

export async function getAchievements(tenantId: string) {
  const { error: accessError } = await requireTenantMembership(tenantId);
  if (accessError) throw new Error("Unauthorized")
  
  return await db.achievement.findMany({
    where: { tenantId },
    orderBy: [
      { order: 'asc' },
      { date: 'desc' }
    ],
  })
}

export async function getAchievementById(id: string, tenantId: string) {
  const { error: accessError } = await requireTenantMembership(tenantId);
  if (accessError) throw new Error("Unauthorized")
  
  return await db.achievement.findUnique({
    where: { id, tenantId }
  })
}

export async function createAchievement(tenantId: string, data: any) {
  const { error: accessError } = await requireTenantMembership(tenantId);
  if (accessError) throw new Error("Unauthorized")
  
  const parsed = achievementSchema.parse(data)
  
  const slug = await generateUniqueSlug(db.achievement, tenantId, parsed.title)
  
  const achievement = await db.achievement.create({
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
    revalidatePath("/", "layout");
    if (tenant?.slug) await clearTenantCache(tenant.slug);;
  }

  
  revalidatePath("/(dashboard)/admin/website/achievements", "page")
  return achievement
}

export async function updateAchievement(id: string, tenantId: string, data: any) {
  const { error: accessError } = await requireTenantMembership(tenantId);
  if (accessError) throw new Error("Unauthorized")
  
  const parsed = achievementSchema.parse(data)
  
  await db.achievement.update({
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

  
  revalidatePath("/(dashboard)/admin/website/achievements", "page")
}

export async function deleteAchievement(id: string, tenantId: string) {
  const { error: accessError } = await requireTenantMembership(tenantId);
  if (accessError) throw new Error("Unauthorized")
  
  await db.achievement.delete({
    where: { id, tenantId }
  })
  const tenant = await db.tenant.findUnique({ where: { id: tenantId }, select: { slug: true } })
  if (tenant) {
    const { invalidatePublicTenantCache } = await import("@/features/tenant/services/tenant-public.service")
    await invalidatePublicTenantCache(tenant.slug)
    revalidatePath("/", "layout");
    if (tenant?.slug) await clearTenantCache(tenant.slug);;
  }

  
  revalidatePath("/(dashboard)/admin/website/achievements", "page")
}

export async function updateAchievementsOrder(tenantId: string, orderedIds: string[]) {
  const { error: accessError } = await requireTenantMembership(tenantId);
  if (accessError) throw new Error("Unauthorized")
  
  await db.$transaction(
    orderedIds.map((id, i) =>
      db.achievement.update({ where: { id, tenantId }, data: { order: i } })
    )
  )

  const tenant = await db.tenant.findUnique({ where: { id: tenantId }, select: { slug: true } })
  if (tenant) {
    const { invalidatePublicTenantCache } = await import("@/features/tenant/services/tenant-public.service")
    await invalidatePublicTenantCache(tenant.slug)
    revalidatePath("/", "layout");
    if (tenant?.slug) await clearTenantCache(tenant.slug);;
  }
  
  revalidatePath("/(dashboard)/admin/website/achievements", "page")
}

