"use server"

import { db, withTenant } from "@/lib/db"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { requireTenantMembership } from "@/lib/api-utils"

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
  await checkAccess(data.tenantId)
  
  const subject = await db.subject.create({
    data: {
      tenantId: data.tenantId,
      name: data.name,
      code: data.code,
      description: data.description,
      isActive: true
    }
  })

  revalidatePath('/admin/subjects')
  return { success: true, subject }
}

export async function updateSubject(id: string, data: { tenantId: string, name: string, code?: string, description?: string }) {
  await checkAccess(data.tenantId)

  const subject = await db.subject.update({
    where: { id, tenantId: data.tenantId },
    data: {
      name: data.name,
      code: data.code,
      description: data.description
    }
  })

  revalidatePath('/admin/subjects')
  return { success: true, subject }
}

export async function deleteSubject(id: string, tenantId: string) {
  await checkAccess(tenantId)

  await db.subject.delete({
    where: { id, tenantId }
  })

  revalidatePath('/admin/subjects')
  return { success: true }
}

// ========================
// CLASSROOMS ACTIONS
// ========================

export async function deleteClassroom(id: string, tenantId: string) {
  await checkAccess(tenantId)

  await db.classroom.delete({
    where: { id, tenantId }
  })

  revalidatePath('/admin/students/classrooms')
  return { success: true }
}

// ========================
// SCHEDULES ACTIONS
// ========================

export async function deleteSchedule(id: string, tenantId: string) {
  await checkAccess(tenantId)

  await db.schedule.delete({
    where: { id, tenantId }
  })

  revalidatePath('/admin/schedules')
  return { success: true }
}
