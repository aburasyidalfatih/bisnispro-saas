import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

function generatePin(length = 6) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let result = ""
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const tenantId = session.user.tenants?.[0]?.id
  if (!tenantId) return NextResponse.json({ error: "Tenant not found" }, { status: 400 })

  try {
    const exams = await db.cbtExam.findMany({
      where: { tenantId },
      take: 100,
      include: {
        questionBank: {
          select: { name: true, subject: true, level: true, _count: { select: { questions: true } } }
        },
        _count: {
          select: { sessions: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(exams)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const tenantId = session.user.tenants?.[0]?.id
  if (!tenantId) return NextResponse.json({ error: "Tenant not found" }, { status: 400 })

  try {
    const body = await req.json()
    const { questionBankId, title, type, startTime, endTime, duration, passingGrade, randomize, randomizeOpts, status } = body

    // Get author ID (Staff ID associated with User)
    const staff = await db.staff.findFirst({
      where: { userId: session.user.id, tenantId }
    })

    if (!staff) {
      return NextResponse.json({ error: "Hanya akun Guru/Staff yang dapat membuat jadwal ujian." }, { status: 403 })
    }

    const exam = await db.cbtExam.create({
      data: {
        tenantId,
        questionBankId,
        authorId: staff.id,
        title,
        type: type || "UTS",
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        duration: parseInt(duration),
        passingGrade: parseInt(passingGrade) || 0,
        randomize: randomize ?? true,
        randomizeOpts: randomizeOpts ?? true,
        showResult: false,
        pin: status === "PUBLISHED" ? generatePin() : null,
        status: status || "DRAFT"
      }
    })
    return NextResponse.json(exam, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
