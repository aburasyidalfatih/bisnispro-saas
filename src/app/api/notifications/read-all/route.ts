import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function PATCH() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const updated = await db.notification.updateMany({
      where: { userId: session.user.id, isRead: false },
      data: { isRead: true },
    })

    return NextResponse.json({ count: updated.count })
  } catch (error) {
    console.error("Failed to mark all notifications as read:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
