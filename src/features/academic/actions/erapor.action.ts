"use server"

import { requireTenantAccess } from "@/lib/guards/tenant-guard"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { 
  learningObjectiveSchema, FormativeScoreInput, SummativeScoreInput, LearningObjectiveInput,
  formativeScoreSchema, summativeScoreSchema
} from "../schemas/erapor.schema"

export async function createLearningObjective(tenantId: string, data: LearningObjectiveInput) {
  try {
    await requireTenantAccess(tenantId)
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
  await requireTenantAccess(tenantId)
  
  return await db.learningObjective.findMany({
    where: { 
      tenantId,
      ...(subjectId ? { subjectId } : {})
    },
    include: {
      subject: true
    },
    orderBy: { createdAt: 'asc' }
  })
}

export async function saveFormativeScore(tenantId: string, data: FormativeScoreInput) {
  try {
    await requireTenantAccess(tenantId)
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
    await requireTenantAccess(tenantId)
    const parsed = summativeScoreSchema.parse(data)
    
    // We don't have a composite unique constraint on summative score yet, 
    // so we'll just find the first matching one or create.
    const existing = await db.summativeScore.findFirst({
      where: {
        tenantId,
        studentId: parsed.studentId,
        subjectId: parsed.subjectId,
        type: parsed.type,
        semester: parsed.semester,
        year: parsed.year
      }
    })

    let score;
    if (existing) {
      score = await db.summativeScore.update({
        where: { id: existing.id },
        data: { score: parsed.score }
      })
    } else {
      score = await db.summativeScore.create({
        data: {
          ...parsed,
          tenantId
        }
      })
    }
    
    revalidatePath("/admin/academic/rapor/nilai-sumatif")
    return { success: true, data: score }
  } catch (error: any) {
    return { error: error.message || "Failed to save summative score" }
  }
}
