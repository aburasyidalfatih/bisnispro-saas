import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { logger } from "@/lib/logger"

/**
 * POST: Trigger WhatsApp broadcast via BullMQ queue (non-blocking)
 * 
 * Previously: synchronous loop with sleep() — could block 25+ minutes
 * Now: enqueue all messages, return immediately, worker processes in background
 */
export async function POST(req: Request) {
  const session = await auth()

  const tenantId = session?.user?.tenants?.[0]?.id
  const role = session?.user?.tenants?.[0]?.role
  const plan = (session?.user as any)?.tenants?.[0]?.plan || "free"

  if (!tenantId || (role !== "owner" && role !== "admin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  if (plan === "free") {
    return NextResponse.json(
      { error: "Fitur Broadcast WhatsApp hanya tersedia untuk paket Lite dan Pro." },
      { status: 403 }
    )
  }

  try {
    const body = await req.json()
    const { target, message } = body

    if (!message) {
      return NextResponse.json({ error: "Pesan wajib diisi" }, { status: 400 })
    }

    if (plan === "lite" && target !== "all_gtk") {
      return NextResponse.json(
        { error: "Paket Lite hanya dapat melakukan broadcast ke Staf & Staf." },
        { status: 403 }
      )
    }

    const { enqueueBroadcast } = await import(
      "@/features/notification/services/broadcast.service"
    )

    const result = await enqueueBroadcast({
      tenantId,
      userId: session.user.id,
      target,
      message,
    })

    return NextResponse.json(result)
  } catch (error: any) {
    const msg = error.message || "Gagal memulai broadcast"
    logger.error("Broadcast trigger error", error, { tenantId })
    const status = msg.includes("valid") || msg.includes("penerima") ? 400 : 500
    return NextResponse.json({ error: msg }, { status })
  }
}
