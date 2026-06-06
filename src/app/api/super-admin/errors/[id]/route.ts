import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user?.isSuperAdmin) {
      return new NextResponse("Unauthorized", { status: 401 })
    }
    
    const { id } = await params
    const body = await req.json()
    const { isResolved } = body

    const updatedLog = await db.errorLog.update({
      where: { id },
      data: { isResolved }
    })

    return NextResponse.json(updatedLog)
  } catch (error) {
    console.error("[SUPER_ADMIN_ERRORS_PATCH]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user?.isSuperAdmin) {
      return new NextResponse("Unauthorized", { status: 401 })
    }
    
    const { id } = await params
    await db.errorLog.delete({
      where: { id }
    })

    return new NextResponse("Deleted", { status: 200 })
  } catch (error) {
    console.error("[SUPER_ADMIN_ERRORS_DELETE]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
