"use server"

import { db, withTenant } from "@/lib/db"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { requireTenantMembership } from "@/lib/api-utils"
import { z } from "zod"

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

const subjectSchema = z.object({
  tenantId: z.string().min(1),
  name: z.string().min(1, "Nama mata pelajaran wajib diisi").max(100),
  code: z.string().max(20).optional().nullable(),
  description: z.string().max(500).optional().nullable(),
})

export async function createSubject(data: { tenantId: string, name: string, code?: string, description?: string }) {
  const parsed = subjectSchema.parse(data)
  await checkAccess(parsed.tenantId)
  
  const tenantDb = withTenant(parsed.tenantId)
  
  // Cek Kuota
  const tenant = await db.tenant.findUnique({ where: { id: parsed.tenantId } })
  if (tenant?.plan === "free") {
    const subjectCount = await db.subject.count({ where: { tenantId: parsed.tenantId } })
    if (subjectCount >= 1) {
      return { error: "Kuota maksimal 1 mata pelajaran untuk paket Free. Silakan upgrade paket untuk menambah." }
    }
  }

  const subject = await tenantDb.subject.create({
    data: {
      tenantId: parsed.tenantId, // Tetap disertakan untuk Create
      name: parsed.name,
      code: parsed.code,
      description: parsed.description,
      isActive: true
    }
  })

  revalidatePath('/admin/subjects')
  return { success: true, subject }
}

export async function updateSubject(id: string, data: { tenantId: string, name: string, code?: string, description?: string }) {
  const parsed = subjectSchema.parse(data)
  await checkAccess(parsed.tenantId)

  const tenantDb = withTenant(parsed.tenantId)
  const subject = await tenantDb.subject.update({
    where: { id }, // tenantId tidak perlu dimasukkan ke where lagi karena dengan withTenant sudah terlindungi
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
  await tenantDb.subject.delete({
    where: { id }
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
  await tenantDb.classroom.delete({
    where: { id }
  })

  revalidatePath('/admin/students/classrooms')
  return { success: true }
}

// ========================
// SCHEDULES ACTIONS
// ========================

export async function deleteSchedule(id: string, tenantId: string) {
  const parsedTenantId = z.string().min(1).parse(tenantId)
  await checkAccess(parsedTenantId)

  const tenantDb = withTenant(parsedTenantId)
  await tenantDb.schedule.delete({
    where: { id }
  })

  revalidatePath('/admin/schedules')
  return { success: true }
}
