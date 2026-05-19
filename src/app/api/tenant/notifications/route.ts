import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"

// GET: list notifications for current user
export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const url = new URL(req.url)
  const page = Number(url.searchParams.get("page") || "1")
  const limit = Number(url.searchParams.get("limit") || "20")

  const { listNotifications } = await import("@/features/notification/services/inbox.service")
  const result = await listNotifications(session.user.id, page, limit)
  return NextResponse.json(result)
}

// PUT: mark as read
export async function PUT(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id, all } = await req.json()
  const { markNotificationRead } = await import("@/features/notification/services/inbox.service")
  const result = await markNotificationRead(session.user.id, id, all)
  return NextResponse.json(result)
}
