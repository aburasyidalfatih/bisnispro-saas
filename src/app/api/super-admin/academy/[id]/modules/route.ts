import { NextResponse } from "next/server"
import { db as prisma } from "@/lib/db"
import { auth } from "@/lib/auth"

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user?.isSuperAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: courseId } = await params
    const body = await req.json()
    const { title, sortOrder } = body

    if (!title) {
      return NextResponse.json({ error: "Judul modul wajib diisi" }, { status: 400 })
    }

    const courseModule = await prisma.courseModule.create({
      data: {
        courseId,
        title,
        sortOrder: sortOrder || 0
      }
    })

    return NextResponse.json(courseModule)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
