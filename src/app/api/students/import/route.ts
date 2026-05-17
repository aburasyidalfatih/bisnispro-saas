import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { logger } from "@/lib/logger"

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { tenantId, students } = await req.json()

    // Cek tenant akses
    if (session.user.tenants?.[0]?.id !== tenantId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Cek Kuota Siswa
    const { db } = await import("@/lib/db")
    const tenant = await db.tenant.findUnique({ where: { id: tenantId } })
    if (tenant) {
      let effectiveQuota = tenant.studentQuota || 0
      
      if (tenant.plan === "free" && effectiveQuota === 0) {
        const freePlan = await db.subscriptionPlan.findUnique({ where: { slug: "free" } })
        effectiveQuota = freePlan?.maxStudents || 1
      }

      const currentCount = await db.student.count({ where: { tenantId } })
      const requestedCount = students.length
      if (currentCount + requestedCount > effectiveQuota) {
        return NextResponse.json({ 
          error: `Batas kuota tercapai. Anda memiliki sisa kuota ${Math.max(0, effectiveQuota - currentCount)} siswa. Harap kurangi jumlah siswa pada file excel atau upgrade paket.` 
        }, { status: 403 })
      }
    }

    // Jalankan import langsung di background (bypass Inngest)
    const { ImportService } = await import("@/lib/services/import-service")
    
    ImportService.importStudents({ tenantId, students })
      .then(async (result) => {
        await db.auditLog.create({
          data: {
            tenantId,
            action: "IMPORT_STUDENTS_ASYNC",
            entity: "System",
            userId: session.user.id || "SYSTEM"
          }
        }).catch(() => {})
        logger.info("Student import completed", { tenantId, result })
      })
      .catch(err => logger.error("Student import failed", err, { tenantId }))

    return NextResponse.json({ 
      success: true, 
      message: "Proses import sedang berjalan di latar belakang. Silakan periksa halaman beberapa saat lagi." 
    })
  } catch (error: any) {
    console.error("Import Error:", error)
    return NextResponse.json({ error: "Terjadi kesalahan internal server." }, { status: 500 })
  }
}
