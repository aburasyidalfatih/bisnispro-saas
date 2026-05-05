"use server"

import { requireTenantAccess } from "@/lib/guards/tenant-guard"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { extracurricularSchema } from "@/lib/validations/extracurricular"
import { revalidatePath } from "next/cache"



export async function getExtracurriculars(tenantId: string) {
  await requireTenantAccess(tenantId)
  
  return await db.extracurricular.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'desc' },
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
  
  const extracurricular = await db.extracurricular.create({
    data: {
      ...parsed,
      tenantId,
    }
  })
  
  revalidatePath("/(dashboard)/dashboard/website/extracurriculars", "page")
  return extracurricular
}

export async function updateExtracurricular(id: string, tenantId: string, data: any) {
  await requireTenantAccess(tenantId)
  
  const parsed = extracurricularSchema.parse(data)
  
  await db.extracurricular.update({
    where: { id, tenantId },
    data: parsed
  })
  
  revalidatePath("/(dashboard)/dashboard/website/extracurriculars", "page")
}

export async function deleteExtracurricular(id: string, tenantId: string) {
  await requireTenantAccess(tenantId)
  
  await db.extracurricular.delete({
    where: { id, tenantId }
  })
  
  revalidatePath("/(dashboard)/dashboard/website/extracurriculars", "page")
}

