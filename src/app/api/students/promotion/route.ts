import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const tenantId = session.user.tenants?.[0]?.id
    if (!tenantId) {
      return NextResponse.json({ error: "No tenant" }, { status: 403 })
    }

    const { studentIds, targetClassroomId, status } = await req.json()

    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return NextResponse.json({ error: "Siswa belum dipilih" }, { status: 400 })
    }

    // Prepare update data
    const updateData: any = {}
    if (targetClassroomId) {
      updateData.classroomId = targetClassroomId
    } else if (status === "GRADUATED") {
      updateData.classroomId = null
      updateData.isActive = false // maybe mark as inactive since graduated
    } else if (status === "INACTIVE") {
      updateData.isActive = false
    }

    // Update the students
    const updated = await db.student.updateMany({
      where: {
        id: { in: studentIds },
        tenantId
      },
      data: updateData
    })

    // Log the audit
    await db.auditLog.create({
      data: {
        tenantId,
        action: "PROMOTE_STUDENTS",
        entity: "Student",
        userId: session.user.id,
      }
    })

    return NextResponse.json({ success: true, count: updated.count })
  } catch (error: any) {
    console.error("Promotion Error:", error)
    return NextResponse.json({ error: "Gagal memproses mutasi kelas" }, { status: 500 })
  }
}
