import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const tenantId = searchParams.get("tenantId")

    if (!tenantId) {
      return new NextResponse("Missing tenantId", { status: 400 })
    }

    const students = await db.student.findMany({
      where: {
        tenantId,
        classroomId: params.id,
        isActive: true
      },
      select: {
        id: true,
        name: true,
        nis: true,
        nisn: true,
        gender: true
      },
      orderBy: {
        name: 'asc'
      }
    })

    return NextResponse.json(students)

  } catch (error) {
    console.error("[GTK_CLASSROOM_STUDENTS_GET]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
