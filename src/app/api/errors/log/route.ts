import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { message, stack, path, metadata } = body

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    // In a real scenario we'd extract tenantId from domain or session,
    // but for global client errors we might just log them globally.
    // Feel free to add auth session check if needed to capture user ID.
    
    const newLog = await db.errorLog.create({
      data: {
        category: "SYSTEM_BUG",
        message: String(message),
        stack: stack ? String(stack) : null,
        path: path ? String(path) : null,
        method: "CLIENT",
        metadata: metadata || {},
      },
    })

    return NextResponse.json({ success: true, id: newLog.id })
  } catch (error) {
    console.error("Failed to save error log to DB:", error)
    return NextResponse.json({ error: "Failed to save error log" }, { status: 500 })
  }
}
