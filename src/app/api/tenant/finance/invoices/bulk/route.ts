import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { logger } from "@/lib/logger"

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const tenantId = session.user.tenantId
    const body = await req.json()
    const { billingTypeId, title, dueDate, month, year, notes } = body

    if (!billingTypeId || !title || !dueDate) {
      return NextResponse.json({ error: "Parameter billingTypeId, title, dan dueDate wajib diisi" }, { status: 400 })
    }

    const { billingQueue } = await import("@/lib/queue")

    // Masukkan ke BullMQ untuk digenerate massal
    await billingQueue.add("bulk-generate-invoices", {
      tenantId,
      billingTypeId,
      title,
      dueDate,
      month,
      year,
      notes,
      userId: session.user.id
    })

    const { db } = await import("@/lib/db")
    await db.auditLog.create({
      data: {
        tenantId,
        action: "ENQUEUE_BULK_INVOICE_GENERATION",
        entity: "Finance",
        userId: session.user.id || "SYSTEM"
      }
    }).catch(() => {})

    return NextResponse.json({ 
      success: true, 
      message: "Proses pembuatan tagihan massal sedang berjalan di latar belakang. Silakan cek halaman Tagihan dalam beberapa saat." 
    })
  } catch (error: any) {
    logger.error("Bulk Invoice Queue Error:", error)
    return NextResponse.json({ error: "Terjadi kesalahan server saat memulai job tagihan massal." }, { status: 500 })
  }
}
