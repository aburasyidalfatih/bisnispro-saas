import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const tenantId = session.user.tenants?.[0]?.id
  if (!tenantId) return NextResponse.json({ error: "Tenant not found" }, { status: 400 })

  try {
    const banks = await db.cbtQuestionBank.findMany({
      where: { tenantId },
      take: 100,
      include: {
        _count: {
          select: { questions: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(banks)
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
    const bank = await db.cbtQuestionBank.create({
      data: {
        tenantId,
        name: body.name,
        description: body.description,
        level: body.level,
        subject: body.subject
      }
    })
    return NextResponse.json(bank, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
