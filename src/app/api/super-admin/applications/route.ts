import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { approveApplication, sendApplicationNotification } from "@/lib/services/application"
import { logger } from "@/lib/logger"

// Ambil semua daftar pengajuan
export async function GET() {
  const session = await auth()
  if (!session?.user?.isSuperAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const applications = await db.tenantApplication.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      affiliate: {
        include: { user: true }
      }
    }
  })
  return NextResponse.json(applications)
}

// Update status pengajuan (Approve, Reject, Revision) - Mendukung BULK
export async function PUT(req: Request) {
  const session = await auth()
  if (!session?.user?.isSuperAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const body = await req.json()
  const { id, ids, status, adminMessage } = body

  // Dukungan untuk single ID atau array of IDs
  const targetIds = ids || (id ? [id] : [])

  if (!targetIds.length) {
    return NextResponse.json({ error: "ID tidak boleh kosong" }, { status: 400 })
  }

  try {
    const results = []

    for (const targetId of targetIds) {
      if (status === "APPROVED") {
        // Jalankan logika persetujuan (Buat Tenant + User + Notif)
        const tenant = await approveApplication(targetId)
        results.push({ id: targetId, status: "APPROVED", tenant })
      } else {
        // Update status biasa (Rejected/Revision)
        const application = await db.tenantApplication.update({
          where: { id: targetId },
          data: { status, adminMessage }
        })

        // Kirim notifikasi status terbaru
        await sendApplicationNotification(targetId)
        results.push({ id: targetId, status, application })
      }
    }

    return NextResponse.json({ message: `Berhasil memproses ${targetIds.length} data.`, results })
  } catch (error) {
    logger.error("Update application failed", error, { targetIds })
    const errorMessage = error instanceof Error ? error.message : "Gagal memperbarui status pengajuan"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
