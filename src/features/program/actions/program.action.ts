"use server"

import { requireTenantAccess } from "@/lib/guards/tenant-guard"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { programSchema } from "@/features/program/schemas/program.schema"
import { revalidatePath } from "next/cache"
import { generateUniqueSlug } from "@/lib/utils/slug"
import { clearTenantCache } from "@/features/tenant/services/tenant-modular.service"



export async function getPrograms(tenantId: string) {
  await requireTenantAccess(tenantId)
  
  return await db.program.findMany({
    where: { tenantId },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
  })
}

export async function getProgramById(id: string, tenantId: string) {
  await requireTenantAccess(tenantId)
  
  return await db.program.findUnique({
    where: { id, tenantId }
  })
}

export async function createProgram(tenantId: string, data: any) {
  await requireTenantAccess(tenantId)
  
  const parsed = programSchema.parse(data)
  
  const slug = await generateUniqueSlug(db.program, tenantId, parsed.name)
  
  const program = await db.program.create({
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

  
  revalidatePath("/(dashboard)/admin/website/programs", "page")
  return program
}

export async function updateProgram(id: string, tenantId: string, data: any) {
  await requireTenantAccess(tenantId)
  
  const parsed = programSchema.parse(data)
  
  await db.program.update({
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

  
  revalidatePath("/(dashboard)/admin/website/programs", "page")
}

export async function deleteProgram(id: string, tenantId: string) {
  await requireTenantAccess(tenantId)
  
  await db.program.delete({
    where: { id, tenantId }
  })
  const tenant = await db.tenant.findUnique({ where: { id: tenantId }, select: { slug: true } })
  if (tenant) {
    const { invalidatePublicTenantCache } = await import("@/features/tenant/services/tenant-public.service")
    await invalidatePublicTenantCache(tenant.slug)
    revalidatePath("/", "layout");
    if (tenant?.slug) await clearTenantCache(tenant.slug);;
  }

  
  revalidatePath("/(dashboard)/admin/website/programs", "page")
}

export async function updateProgramsOrder(tenantId: string, orderedIds: string[]) {
  await requireTenantAccess(tenantId)
  
  await db.$transaction(
    orderedIds.map((id, i) =>
      db.program.update({ where: { id, tenantId }, data: { sortOrder: i } })
    )
  )

  const tenant = await db.tenant.findUnique({ where: { id: tenantId }, select: { slug: true } })
  if (tenant) {
    const { invalidatePublicTenantCache } = await import("@/features/tenant/services/tenant-public.service")
    await invalidatePublicTenantCache(tenant.slug)
    revalidatePath("/", "layout");
    if (tenant?.slug) await clearTenantCache(tenant.slug);;
  }
  
  revalidatePath("/(dashboard)/admin/website/programs", "page")
}

