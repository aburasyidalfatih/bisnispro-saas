import { NextResponse } from "next/server"
import { db as prisma } from "@/lib/db"
import { auth } from "@/lib/auth"

export async function PUT(req: Request, { params }: { params: Promise<{ lessonId: string }> }) {
  try {
    const session = await auth()
    if (!session?.user?.isSuperAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { lessonId } = await params
    const body = await req.json()
    const { title, videoUrl, content, duration, sortOrder } = body

    const lesson = await prisma.courseLesson.update({
      where: { id: lessonId },
      data: { title, videoUrl, content, duration, sortOrder }
    })

    return NextResponse.json(lesson)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ lessonId: string }> }) {
  try {
    const session = await auth()
    if (!session?.user?.isSuperAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { lessonId } = await params
    
    await prisma.courseLesson.delete({
      where: { id: lessonId }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
