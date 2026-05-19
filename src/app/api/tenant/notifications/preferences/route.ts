import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"

// GET: get notification preferences
export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { getNotificationPreferences } = await import("@/features/notification/services/inbox.service")
  const settings = await getNotificationPreferences(session.user.id)
  return NextResponse.json({ data: settings })
}

// PUT: update notification preference
export async function PUT(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { channel, enabled } = await req.json()
  if (!channel) return NextResponse.json({ error: "channel harus diisi" }, { status: 400 })

  const { updateNotificationPreference } = await import("@/features/notification/services/inbox.service")
  const result = await updateNotificationPreference(session.user.id, channel, enabled)
  return NextResponse.json(result)
}
