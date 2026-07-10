import { NextResponse } from "next/server"
import { db as prisma } from "@/lib/db"
import { auth } from "@/lib/auth"

export async function PUT(req: Request, { params }: { params: Promise<{ moduleId: string }> }) {
  try {
    const session = await auth()
    if (!session?.user?.isSuperAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { moduleId } = await params
    const body = await req.json()
    const { title, sortOrder } = body

    const courseModule = await prisma.courseModule.update({
      where: { id: moduleId },
      data: { title, sortOrder }
    })

    return NextResponse.json(courseModule)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ moduleId: string }> }) {
  try {
    const session = await auth()
    if (!session?.user?.isSuperAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { moduleId } = await params
    
    await prisma.courseModule.delete({
      where: { id: moduleId }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
