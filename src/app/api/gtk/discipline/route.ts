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
    const staffId = searchParams.get("staffId")

    if (!tenantId || !staffId) {
      return new NextResponse("Missing parameters", { status: 400 })
    }

    // Ambil histori kedisiplinan yang pernah diinput oleh guru ini
    const records = await db.disciplineRecord.findMany({
      where: {
        tenantId,
        staffId
      },
      include: {
        student: {
          select: { name: true, nisn: true, classroom: { select: { name: true } } }
        }
      },
      orderBy: {
        date: 'desc'
      },
      take: 50
    })

    return NextResponse.json(records)

  } catch (error) {
    console.error("[GTK_DISCIPLINE_GET]", error)
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
    const { tenantId, staffId, studentId, type, category, description, points, date } = body

    if (!tenantId || !staffId || !studentId || !type || !category || !description) {
      return new NextResponse("Missing required fields", { status: 400 })
    }

    // Pastikan poin berupa angka, negatif untuk pelanggaran, positif untuk prestasi
    let finalPoints = parseInt(points || "0")
    if (type === "PELANGGARAN" && finalPoints > 0) {
      finalPoints = -Math.abs(finalPoints)
    } else if (type === "PENGHARGAAN" && finalPoints < 0) {
      finalPoints = Math.abs(finalPoints)
    }

    const record = await db.disciplineRecord.create({
      data: {
        tenantId,
        staffId,
        studentId,
        type,
        category,
        description,
        points: finalPoints,
        date: new Date(date)
      },
      include: {
        student: { select: { name: true } }
      }
    })

    // TODO: Di masa depan, panggil service notifikasi WhatsApp/Email ke Orang Tua di background 
    // sendDisciplineNotification(record.id)

    return NextResponse.json(record)

  } catch (error) {
    console.error("[GTK_DISCIPLINE_POST]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
