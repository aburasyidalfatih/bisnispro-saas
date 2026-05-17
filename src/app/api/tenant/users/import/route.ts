import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { logger } from "@/lib/logger"

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { tenantId, users } = await req.json()

    // Cek tenant akses & role (harus admin/owner)
    const activeTenant = session.user.tenants?.find((t: any) => t.id === tenantId)
    if (!activeTenant || (activeTenant.role !== "admin" && activeTenant.role !== "owner")) {
      return NextResponse.json({ error: "Forbidden. Admin access required." }, { status: 403 })
    }

    // Jalankan import langsung di background (bypass Inngest)
    const { ImportService } = await import("@/lib/services/import-service")
    const { db } = await import("@/lib/db")

    ImportService.importUsers({ tenantId, users })
      .then(async (result) => {
        await db.auditLog.create({
          data: {
            tenantId,
            action: "IMPORT_USERS_ASYNC",
            entity: "System",
            userId: session.user.id || "SYSTEM"
          }
        }).catch(() => {})
        logger.info("GTK import completed", { tenantId, result })
      })
      .catch(err => logger.error("GTK import failed", err, { tenantId }))

    return NextResponse.json({ 
      success: true, 
      message: "Proses import GTK/Staff sedang berjalan di latar belakang. Silakan periksa halaman beberapa saat lagi." 
    })
  } catch (error: any) {
    console.error("Import GTK Error:", error)
    return NextResponse.json({ error: "Terjadi kesalahan server saat memulai job import." }, { status: 500 })
  }
}
