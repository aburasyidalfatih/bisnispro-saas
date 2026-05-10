import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const tenantId = session.user.tenants?.[0]?.id
  if (!tenantId) return NextResponse.json({ error: "Tenant not found" }, { status: 400 })

  const { id } = await params

  try {
    const bank = await db.cbtQuestionBank.findFirst({
      where: { id, tenantId },
      include: {
        questions: {
          orderBy: { order: 'asc' }
        }
      }
    })

    if (!bank) return NextResponse.json({ error: "Bank Soal tidak ditemukan" }, { status: 404 })

    return NextResponse.json(bank)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const tenantId = session.user.tenants?.[0]?.id

  const { id } = await params

  try {
    await db.cbtQuestionBank.deleteMany({
      where: { id, tenantId }
    })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
