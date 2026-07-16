"use server"

import { requireTenantMembership } from "@/lib/api-utils"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"
import { 
  learningObjectiveSchema, FormativeScoreInput, SummativeScoreInput, LearningObjectiveInput,
  formativeScoreSchema, summativeScoreSchema
} from "../schemas/erapor.schema"

export async function getUserStaffContext(tenantId: string) {
  const session = await auth()
  if (!session?.user) return null

  // If superadmin, they act as admin
  if (session.user.isSuperAdmin) return { isAdmin: true, staffId: null }

  const tu = await db.tenantUser.findUnique({
    where: { tenantId_userId: { tenantId, userId: session.user.id } }
  })

  if (!tu) return null

  if (tu.role === 'admin' || tu.role === 'owner' || tu.role === 'operator') {
    return { isAdmin: true, staffId: null }
  }

  if (tu.role === 'guru') {
    const staff = await db.staff.findFirst({
      where: { tenantId, userId: session.user.id }
    })
    return { isAdmin: false, staffId: staff?.id || null }
  }

  return { isAdmin: false, staffId: null }
}

export async function createLearningObjective(tenantId: string, data: LearningObjectiveInput) {
  try {
    const { error: accessError } = await requireTenantMembership(tenantId);
  if (accessError) throw new Error("Unauthorized")
    const parsed = learningObjectiveSchema.parse(data)
    
    const objective = await db.learningObjective.create({
      data: {
        ...parsed,
        tenantId
      }
    })
    
    revalidatePath("/admin/academic/rapor/tp")
    return { success: true, data: objective }
  } catch (error: any) {
    return { error: error.message || "Failed to create Learning Objective" }
  }
}

export async function getLearningObjectives(tenantId: string, subjectId?: string) {
  const { error: accessError } = await requireTenantMembership(tenantId);
  if (accessError) throw new Error("Unauthorized")
  
  return await db.learningObjective.findMany({
    where: { 
      tenantId,
      ...(subjectId ? { subjectId } : {})
    },
    include: {
      subject: true
    },
    orderBy: { createdAt: 'asc' },
    take: 200,
  })
}

export async function saveFormativeScore(tenantId: string, data: FormativeScoreInput) {
  try {
    const { error: accessError } = await requireTenantMembership(tenantId);
  if (accessError) throw new Error("Unauthorized")
    const parsed = formativeScoreSchema.parse(data)
    
    const score = await db.formativeScore.upsert({
      where: {
        studentId_objectiveId: {
          studentId: parsed.studentId,
          objectiveId: parsed.objectiveId,
        }
      },
      update: { score: parsed.score },
      create: {
        tenantId,
        studentId: parsed.studentId,
        objectiveId: parsed.objectiveId,
        score: parsed.score,
      }
    })
    
    revalidatePath("/admin/academic/rapor/nilai-formatif")
    return { success: true, data: score }
  } catch (error: any) {
    return { error: error.message || "Failed to save formative score" }
  }
}

export async function saveSummativeScore(tenantId: string, data: SummativeScoreInput) {
  try {
    const { error: accessError } = await requireTenantMembership(tenantId);
  if (accessError) throw new Error("Unauthorized")
    const parsed = summativeScoreSchema.parse(data)
    
    const score = await db.summativeScore.upsert({
      where: {
        studentId_subjectId_type_semester_year: {
          studentId: parsed.studentId,
          subjectId: parsed.subjectId,
          type: parsed.type,
          semester: parsed.semester,
          year: parsed.year,
        }
      },
      update: { score: parsed.score },
      create: {
        ...parsed,
        tenantId
      }
    })
    
    revalidatePath("/admin/academic/rapor/nilai-sumatif")
    return { success: true, data: score }
  } catch (error: any) {
    return { error: error.message || "Failed to save summative score" }
  }
}

export async function getStudentsByClassroom(tenantId: string, classroomId: string) {
  const { error: accessError } = await requireTenantMembership(tenantId);
  if (accessError) throw new Error("Unauthorized")
  
  return await db.student.findMany({
    where: { 
      tenantId,
      classroomId 
    },
    include: {
      formativeScores: true,
      summativeScores: true,
    },
    orderBy: { name: 'asc' }
  })
}
