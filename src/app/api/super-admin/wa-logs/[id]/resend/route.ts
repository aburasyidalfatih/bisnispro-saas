import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { sendWhatsAppDirect } from "@/features/notification/services/notification.service"

export async function POST(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const session = await auth()
  if (!session?.user?.isSuperAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const waLog = await db.waQueueLog.findUnique({
      where: { id: params.id }
    })

    if (!waLog) {
      return NextResponse.json({ error: "Log tidak ditemukan" }, { status: 404 })
    }

    if (waLog.status !== "FAILED" && waLog.status !== "PENDING") {
      return NextResponse.json({ error: "Hanya pesan FAILED/PENDING yang dapat dikirim ulang" }, { status: 400 })
    }

    // Call sendWhatsAppDirect synchronously but skip the delay
    const result = await sendWhatsAppDirect(
      waLog.targetNumber,
      waLog.message,
      waLog.tenantId,
      undefined,
      true // skipDelay = true
    )

    if (result.success) {
      await db.waQueueLog.update({
        where: { id: waLog.id },
        data: {
          status: "SENT",
          sentAt: new Date(),
          error: null
        }
      })
      return NextResponse.json({ message: "Pesan berhasil dikirim ulang!" })
    } else {
      await db.waQueueLog.update({
        where: { id: waLog.id },
        data: {
          status: "FAILED",
          error: result.error || "Gagal mengirim pesan"
        }
      })
      return NextResponse.json({ error: result.error || "Gagal mengirim pesan" }, { status: 500 })
    }
  } catch (error: any) {
    console.error("Resend WA Error:", error)
    return NextResponse.json({ error: error.message || "Terjadi kesalahan internal" }, { status: 500 })
  }
}
