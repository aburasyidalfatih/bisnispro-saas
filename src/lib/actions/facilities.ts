"use server"

import { db } from "@/lib/db"
import { requireTenantAccess } from "@/lib/guards/tenant-guard"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const facilitySchema = z.object({
  name: z.string().min(1, "Nama fasilitas harus diisi"),
  description: z.string().optional().nullable(),
  imageUrl: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  condition: z.string().optional().nullable(),
  access: z.string().optional().nullable(),
})

export async function getFacilities(tenantId: string) {
  await requireTenantAccess(tenantId)
  
  return await db.facility.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getFacilityById(id: string, tenantId: string) {
  await requireTenantAccess(tenantId)
  
  return await db.facility.findUnique({
    where: { id, tenantId }
  })
}

export async function createFacility(tenantId: string, data: any) {
  await requireTenantAccess(tenantId)
  
  const parsed = facilitySchema.parse(data)
  
  const facility = await db.facility.create({
    data: {
      ...parsed,
      tenantId,
    }
  })
  
  revalidatePath("/(dashboard)/dashboard/website/facilities", "page")
  return facility
}

export async function updateFacility(id: string, tenantId: string, data: any) {
  await requireTenantAccess(tenantId)
  
  const parsed = facilitySchema.parse(data)
  
  const facility = await db.facility.update({
    where: { id, tenantId },
    data: parsed
  })
  
  revalidatePath("/(dashboard)/dashboard/website/facilities", "page")
  return facility
}

export async function deleteFacility(id: string, tenantId: string) {
  await requireTenantAccess(tenantId)
  
  await db.facility.delete({
    where: { id, tenantId }
  })
  
  revalidatePath("/(dashboard)/dashboard/website/facilities", "page")
}
