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

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const tenantId = session.user.tenants?.[0]?.id

  const { id } = await params
  
  try {
    const body = await req.json()
    
    // If regenerating PIN
    if (body.action === "REGENERATE_PIN") {
      const updated = await db.cbtExam.updateMany({
        where: { id, tenantId },
        data: { pin: generatePin() }
      })
      if (updated.count === 0) return NextResponse.json({ error: "Not found" }, { status: 404 })
      
      const newExam = await db.cbtExam.findFirst({ where: { id } })
      return NextResponse.json({ pin: newExam?.pin })
    }

    // Toggle status (PUBLISHED / DRAFT)
    if (body.status) {
      const current = await db.cbtExam.findFirst({ where: { id, tenantId } })
      const dataToUpdate: any = { status: body.status }
      
      // If publishing for the first time without a PIN, generate one
      if (body.status === "PUBLISHED" && (!current?.pin)) {
        dataToUpdate.pin = generatePin()
      }

      await db.cbtExam.updateMany({
        where: { id, tenantId },
        data: dataToUpdate
      })
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
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
    await db.cbtExam.deleteMany({
      where: { id, tenantId }
    })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
