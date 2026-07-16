import { requireTenantMembership } from "@/lib/api-utils"
import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const tenantId = session.user.tenants?.[0]?.id
  if (!tenantId) return NextResponse.json({ error: "Tenant not found" }, { status: 400 })
  const { error: accessError } = await requireTenantMembership(tenantId as string);
  if (accessError) return accessError;

  try {
    const body = await req.json()
    const { questionBankId, type, content, options, explanation, points } = body

    // Verify ownership of the question bank
    const bank = await db.cbtQuestionBank.findFirst({
      where: { id: questionBankId, tenantId }
    })

    if (!bank) return NextResponse.json({ error: "Bank Soal tidak valid" }, { status: 404 })

    // Find max order
    const lastQuestion = await db.cbtQuestion.findFirst({
      where: { questionBankId },
      orderBy: { order: 'desc' }
    })
    
    const newOrder = lastQuestion ? lastQuestion.order + 1 : 1

    const question = await db.cbtQuestion.create({
      data: {
        questionBankId,
        type: type || "MULTIPLE_CHOICE",
        content,
        options,
        explanation,
        points: points || 1,
        order: newOrder
      }
    })

    return NextResponse.json(question, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")
    
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 })
    
    // In a real app, verify tenant ownership before deleting
    await db.cbtQuestion.delete({
      where: { id }
    })
    
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
