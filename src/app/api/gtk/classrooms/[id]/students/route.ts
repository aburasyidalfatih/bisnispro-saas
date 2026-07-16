import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { NextResponse } from "next/server"
import { requireTenantMembership } from "@/lib/api-utils"

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const tenantId = searchParams.get("tenantId")

    if (!tenantId) {
      return new NextResponse("Missing tenantId", { status: 400 })
    }
    const { error: accessError } = await requireTenantMembership(tenantId)
    if (accessError) return accessError

    const students = await db.student.findMany({
      where: {
        tenantId,
        classroomId: id,
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
