import { NextResponse } from "next/server"
import { db as prisma } from "@/lib/db"
import { auth } from "@/lib/auth"

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.isSuperAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { moduleId, title, videoUrl, content, duration, sortOrder } = body

    if (!moduleId || !title) {
      return NextResponse.json({ error: "Modul dan Judul wajib diisi" }, { status: 400 })
    }

    const lesson = await prisma.courseLesson.create({
      data: {
        moduleId,
        title,
        videoUrl,
        content,
        duration: duration || 0,
        sortOrder: sortOrder || 0
      }
    })

    return NextResponse.json(lesson)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
