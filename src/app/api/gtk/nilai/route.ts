import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const tenantId = searchParams.get("tenantId")
    const classroomId = searchParams.get("classroomId")
    const subjectId = searchParams.get("subjectId")
    const type = searchParams.get("type")
    const semester = parseInt(searchParams.get("semester") || "1")
    const year = parseInt(searchParams.get("year") || new Date().getFullYear().toString())

    if (!tenantId || !classroomId || !subjectId || !type) {
      return new NextResponse("Missing parameters", { status: 400 })
    }

    // Ambil daftar siswa di kelas tersebut beserta nilai mereka jika ada
    const students = await db.student.findMany({
      where: { tenantId, classroomId, status: "AKTIF" },
      select: {
        id: true,
        name: true,
        nisn: true,
        grades: {
          where: {
            subjectId,
            type,
            semester,
            year
          },
          select: {
            id: true,
            score: true,
            notes: true
          }
        }
      },
      orderBy: { name: 'asc' }
    })

    return NextResponse.json(students)

  } catch (error) {
    console.error("[GTK_NILAI_GET]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const body = await req.json()
    const { tenantId, staffId, classroomId, subjectId, type, semester, year, grades } = body

    if (!tenantId || !staffId || !classroomId || !subjectId || !type || !grades) {
      return new NextResponse("Missing required fields", { status: 400 })
    }

    const result = await db.$transaction(async (tx) => {
      let savedCount = 0

      for (const item of grades) {
        // Abaikan jika nilai kosong/null
        if (item.score === "" || item.score === null || item.score === undefined) continue

        const scoreVal = parseFloat(item.score.toString())
        if (isNaN(scoreVal)) continue

        // Cari record nilai sebelumnya
        const existing = await tx.grade.findFirst({
          where: {
            tenantId,
            studentId: item.studentId,
            subjectId,
            classroomId,
            type,
            semester: parseInt(semester),
            year: parseInt(year)
          }
        })

        if (existing) {
          await tx.grade.update({
            where: { id: existing.id },
            data: { 
              score: scoreVal, 
              staffId, // update staff who last edited
              notes: item.notes || null 
            }
          })
        } else {
          await tx.grade.create({
            data: {
              tenantId,
              studentId: item.studentId,
              subjectId,
              classroomId,
              staffId,
              type,
              semester: parseInt(semester),
              year: parseInt(year),
              score: scoreVal,
              notes: item.notes || null
            }
          })
        }
        savedCount++
      }

      return { savedCount }
    })

    return NextResponse.json(result)

  } catch (error) {
    console.error("[GTK_NILAI_POST]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
