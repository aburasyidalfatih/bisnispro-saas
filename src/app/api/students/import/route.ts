import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { inngest } from "@/lib/inngest/client"

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
    if (tenant && typeof tenant.studentQuota === 'number') {
      const currentCount = await db.student.count({ where: { tenantId } })
      const requestedCount = students.length
      if (currentCount + requestedCount > tenant.studentQuota) {
        return NextResponse.json({ 
          error: `Batas kuota tercapai. Anda memiliki sisa kuota ${Math.max(0, tenant.studentQuota - currentCount)} siswa. Harap kurangi jumlah siswa pada file excel atau upgrade paket.` 
        }, { status: 403 })
      }
    }

    // ENTERPRISE: Kirim pekerjaan ke Background Job Queue (Non-Blocking)
    await inngest.send({
      name: "tenant/students.import",
      data: { tenantId, students }
    })

    return NextResponse.json({ 
      success: true, 
      message: "Proses import sedang berjalan di latar belakang. Silakan periksa halaman beberapa saat lagi." 
    })
  } catch (error: any) {
    console.error("Import Error:", error)
    return NextResponse.json({ error: "Terjadi kesalahan internal server." }, { status: 500 })
  }
}
