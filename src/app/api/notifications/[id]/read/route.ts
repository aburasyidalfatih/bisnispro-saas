import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { id } = await params

    const notification = await db.notification.findUnique({
      where: { id },
    })

    if (!notification || notification.userId !== session.user.id) {
      return NextResponse.json({ error: "Not Found" }, { status: 404 })
    }

    const updated = await db.notification.update({
      where: { id },
      data: { isRead: true },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Failed to mark notification as read:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
