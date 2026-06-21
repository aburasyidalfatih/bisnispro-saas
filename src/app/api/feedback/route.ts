import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function POST(req: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { type, message } = body

    if (!type || !message) {
      return NextResponse.json(
        { error: "Type and message are required" },
        { status: 400 }
      )
    }

    const tenantId = session.user.tenants?.[0]?.id || null

    const feedback = await db.systemFeedback.create({
      data: {
        userId: session.user.id,
        tenantId,
        type,
        message,
        status: "PENDING",
      },
    })

    return NextResponse.json(feedback)
  } catch (error) {
    console.error("[FEEDBACK_POST]", error)
    return NextResponse.json(
      { error: "Internal Error" },
      { status: 500 }
    )
  }
}
