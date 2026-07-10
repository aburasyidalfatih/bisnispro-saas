import { NextResponse } from "next/server"
import { db as prisma } from "@/lib/db"
import { auth } from "@/lib/auth"

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: lessonId } = await params
    const userId = session.user.id

    // Find the lesson and its course
    const lesson = await prisma.courseLesson.findUnique({
      where: { id: lessonId },
      include: { module: { select: { courseId: true } } }
    })

    if (!lesson) {
      return NextResponse.json({ error: "Materi tidak ditemukan" }, { status: 404 })
    }

    const courseId = lesson.module.courseId

    // Check if enrolled
    const enrollment = await prisma.courseEnrollment.findUnique({
      where: { userId_courseId: { userId, courseId } }
    })

    if (!enrollment) {
      return NextResponse.json({ error: "Anda belum mendaftar kelas ini" }, { status: 403 })
    }

    // Upsert lesson progress
    const progress = await prisma.lessonProgress.upsert({
      where: {
        enrollmentId_lessonId: { enrollmentId: enrollment.id, lessonId }
      },
      update: {
        isCompleted: true,
        completedAt: new Date()
      },
      create: {
        lessonId,
        enrollmentId: enrollment.id,
        isCompleted: true,
        completedAt: new Date()
      }
    })

    // Calculate overall progress for enrollment
    // 1. Get total lessons for course
    const totalLessons = await prisma.courseLesson.count({
      where: { module: { courseId } }
    })

    // 2. Get completed lessons for user in this course
    const completedLessons = await prisma.lessonProgress.count({
      where: {
        enrollmentId: enrollment.id,
        isCompleted: true
      }
    })

    // 3. Update enrollment progress
    const overallProgress = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0
    await prisma.courseEnrollment.update({
      where: { id: enrollment.id },
      data: { progress: overallProgress }
    })

    return NextResponse.json({ success: true, progress, overallProgress })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
