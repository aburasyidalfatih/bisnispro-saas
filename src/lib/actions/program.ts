"use server"

import { requireTenantAccess } from "@/lib/guards/tenant-guard"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { programSchema } from "@/lib/validations/program"
import { revalidatePath } from "next/cache"



export async function getPrograms(tenantId: string) {
  await requireTenantAccess(tenantId)
  
  return await db.program.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'desc' },
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
  
  const program = await db.program.create({
    data: {
      ...parsed,
      tenantId,
    }
  })
  
  revalidatePath("/(dashboard)/dashboard/website/programs", "page")
  return program
}

export async function updateProgram(id: string, tenantId: string, data: any) {
  await requireTenantAccess(tenantId)
  
  const parsed = programSchema.parse(data)
  
  await db.program.update({
    where: { id, tenantId },
    data: parsed
  })
  
  revalidatePath("/(dashboard)/dashboard/website/programs", "page")
}

export async function deleteProgram(id: string, tenantId: string) {
  await requireTenantAccess(tenantId)
  
  await db.program.delete({
    where: { id, tenantId }
  })
  
  revalidatePath("/(dashboard)/dashboard/website/programs", "page")
}

