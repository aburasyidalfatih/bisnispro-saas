import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { rateLimit } from "@/lib/rate-limit"

export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "anonymous"
    const { success } = await rateLimit(`client-error:${ip}`, 30, 60_000)
    if (!success) {
      return NextResponse.json({ error: "Too many error reports" }, { status: 429 })
    }

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
        message: String(message).slice(0, 2000),
        stack: stack ? String(stack).slice(0, 8000) : null,
        path: path ? String(path).slice(0, 500) : null,
        method: "CLIENT",
        metadata: metadata && typeof metadata === "object" ? metadata : {},
      },
    })

    return NextResponse.json({ success: true, id: newLog.id })
  } catch (error) {
    console.error("Failed to save error log to DB:", error)
    return NextResponse.json({ error: "Failed to save error log" }, { status: 500 })
  }
}
