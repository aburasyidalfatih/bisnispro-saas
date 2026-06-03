"use server"

import { requireTenantAccess } from "@/lib/guards/tenant-guard"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { extracurricularSchema } from "@/features/extracurricular/schemas/extracurricular.schema"
import { revalidatePath } from "next/cache"
import { generateUniqueSlug } from "@/lib/utils/slug"
import { clearTenantCache } from "@/features/tenant/services/tenant-modular.service"



export async function getExtracurriculars(tenantId: string) {
  await requireTenantAccess(tenantId)
  
  return await db.extracurricular.findMany({
    where: { tenantId },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
  })
}

export async function getExtracurricularById(id: string, tenantId: string) {
  await requireTenantAccess(tenantId)
  
  return await db.extracurricular.findUnique({
    where: { id, tenantId }
  })
}

export async function createExtracurricular(tenantId: string, data: any) {
  await requireTenantAccess(tenantId)
  
  const parsed = extracurricularSchema.parse(data)
  
  const slug = await generateUniqueSlug(db.extracurricular, tenantId, parsed.name)
  
  const extracurricular = await db.extracurricular.create({
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

  
  revalidatePath("/(dashboard)/admin/website/extracurriculars", "page")
  return extracurricular
}

export async function updateExtracurricular(id: string, tenantId: string, data: any) {
  await requireTenantAccess(tenantId)
  
  const parsed = extracurricularSchema.parse(data)
  
  await db.extracurricular.update({
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

  
  revalidatePath("/(dashboard)/admin/website/extracurriculars", "page")
}

export async function deleteExtracurricular(id: string, tenantId: string) {
  await requireTenantAccess(tenantId)
  
  await db.extracurricular.delete({
    where: { id, tenantId }
  })
  const tenant = await db.tenant.findUnique({ where: { id: tenantId }, select: { slug: true } })
  if (tenant) {
    const { invalidatePublicTenantCache } = await import("@/features/tenant/services/tenant-public.service")
    await invalidatePublicTenantCache(tenant.slug)
    revalidatePath("/", "layout");
    if (tenant?.slug) await clearTenantCache(tenant.slug);;
  }

  
  revalidatePath("/(dashboard)/admin/website/extracurriculars", "page")
}

export async function updateExtracurricularsOrder(tenantId: string, orderedIds: string[]) {
  await requireTenantAccess(tenantId)
  
  await db.$transaction(
    orderedIds.map((id, i) =>
      db.extracurricular.update({ where: { id, tenantId }, data: { sortOrder: i } })
    )
  )

  const tenant = await db.tenant.findUnique({ where: { id: tenantId }, select: { slug: true } })
  if (tenant) {
    const { invalidatePublicTenantCache } = await import("@/features/tenant/services/tenant-public.service")
    await invalidatePublicTenantCache(tenant.slug)
    revalidatePath("/", "layout");
    if (tenant?.slug) await clearTenantCache(tenant.slug);;
  }
  
  revalidatePath("/(dashboard)/admin/website/extracurriculars", "page")
}

