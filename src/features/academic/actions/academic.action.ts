"use server"

import { db, withTenant } from "@/lib/db"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { requireTenantMembership } from "@/lib/api-utils"
import { z } from "zod"
import { subjectSchema } from "@/features/academic/schemas/academic.schema"
import { clearTenantCache } from "@/features/tenant/services/tenant-modular.service"

// Helper
async function checkAccess(tenantId: string) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")
  const { error } = await requireTenantMembership(tenantId)
  if (error) throw new Error("Unauthorized")
  return session
}

// ========================
// SUBJECTS ACTIONS
// ========================

export async function createSubject(data: { tenantId: string, name: string, code?: string, description?: string }) {
  const parsed = subjectSchema.parse(data)
  await checkAccess(parsed.tenantId)
  
  const tenantDb = withTenant(parsed.tenantId)
  
  try {
    const subject = await db.$transaction(async (tx) => {
      // Cek Kuota
      const tenant = await tx.tenant.findUnique({ where: { id: parsed.tenantId } })
      if (tenant?.plan === "free") {
        const subjectCount = await tx.subject.count({ where: { tenantId: parsed.tenantId } })
        if (subjectCount >= 1) {
          throw new Error("Kuota maksimal 1 mata pelajaran untuk paket Free. Silakan upgrade paket untuk menambah.")
        }
      }

      return await tx.subject.create({
        data: {
          tenantId: parsed.tenantId,
          name: parsed.name,
          code: parsed.code,
          description: parsed.description,
          isActive: true
        }
      })
    })

    revalidatePath('/admin/subjects')
    return { success: true, subject }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function updateSubject(id: string, data: { tenantId: string, name: string, code?: string, description?: string }) {
  const parsed = subjectSchema.parse(data)
  await checkAccess(parsed.tenantId)

  const tenantDb = withTenant(parsed.tenantId)
  const subject = await db.subject.update({
    where: { id, tenantId: parsed.tenantId }, 
    data: {
      name: parsed.name,
      code: parsed.code,
      description: parsed.description
    }
  })

  revalidatePath('/admin/subjects')
  return { success: true, subject }
}

export async function deleteSubject(id: string, tenantId: string) {
  const parsedTenantId = z.string().min(1).parse(tenantId)
  await checkAccess(parsedTenantId)

  const tenantDb = withTenant(parsedTenantId)
  await db.subject.delete({
    where: { id, tenantId: parsedTenantId }
  })

  revalidatePath('/admin/subjects')
  return { success: true }
}

// ========================
// CLASSROOMS ACTIONS
// ========================

export async function deleteClassroom(id: string, tenantId: string) {
  const parsedTenantId = z.string().min(1).parse(tenantId)
  await checkAccess(parsedTenantId)

  const tenantDb = withTenant(parsedTenantId)
  await db.classroom.delete({
    where: { id, tenantId: parsedTenantId }
  })

  revalidatePath('/admin/classrooms')
  return { success: true }
}

// ========================
// SCHEDULES ACTIONS
// ========================

export async function deleteSchedule(id: string, tenantId: string) {
  const parsedTenantId = z.string().min(1).parse(tenantId)
  await checkAccess(parsedTenantId)

  const tenantDb = withTenant(parsedTenantId)
  await db.schedule.delete({
    where: { id, tenantId: parsedTenantId }
  })

  revalidatePath('/admin/schedules')
  return { success: true }
}
