"use server"

import { requireTenantAccess } from "@/lib/guards/tenant-guard"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { popupSchema } from "@/lib/validations/popup"
import { revalidatePath } from "next/cache"



export async function getPopups(tenantId: string) {
  await requireTenantAccess(tenantId)
  
  return await db.popup.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getActivePopup(tenantId: string) {
  // Public access logic (no tenant check needed for website frontend)
  return await db.popup.findFirst({
    where: { tenantId, isActive: true },
    orderBy: { updatedAt: 'desc' },
  })
}

export async function getPopupById(id: string, tenantId: string) {
  await requireTenantAccess(tenantId)
  
  return await db.popup.findUnique({
    where: { id, tenantId }
  })
}

export async function createPopup(tenantId: string, data: any) {
  await requireTenantAccess(tenantId)
  
  const parsed = popupSchema.parse(data)
  
  // If this popup is set to active, deactivate others
  if (parsed.isActive) {
    await db.popup.updateMany({
      where: { tenantId, isActive: true },
      data: { isActive: false }
    })
  }
  
  const popup = await db.popup.create({
    data: {
      ...parsed,
      tenantId,
    }
  })
  
  revalidatePath("/(dashboard)/dashboard/website/popups", "page")
  return popup
}

export async function updatePopup(id: string, tenantId: string, data: any) {
  await requireTenantAccess(tenantId)
  
  const parsed = popupSchema.parse(data)
  
  if (parsed.isActive) {
    await db.popup.updateMany({
      where: { tenantId, isActive: true, NOT: { id } },
      data: { isActive: false }
    })
  }
  
  await db.popup.update({
    where: { id, tenantId },
    data: parsed
  })
  
  revalidatePath("/(dashboard)/dashboard/website/popups", "page")
}

export async function deletePopup(id: string, tenantId: string) {
  await requireTenantAccess(tenantId)
  
  await db.popup.delete({
    where: { id, tenantId }
  })
  
  revalidatePath("/(dashboard)/dashboard/website/popups", "page")
}

export async function togglePopupStatus(id: string, tenantId: string, isActive: boolean) {
  await requireTenantAccess(tenantId)
  
  if (isActive) {
    await db.popup.updateMany({
      where: { tenantId, isActive: true, NOT: { id } },
      data: { isActive: false }
    })
  }
  
  await db.popup.update({
    where: { id, tenantId },
    data: { isActive }
  })
  
  revalidatePath("/(dashboard)/dashboard/website/popups", "page")
}

