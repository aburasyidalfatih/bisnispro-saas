import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { inngest } from "@/lib/inngest/client"

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

    // ENTERPRISE: Kirim pekerjaan ke Background Job Queue (Non-Blocking)
    await inngest.send({
      name: "tenant/users.import",
      data: { tenantId, users }
    })

    return NextResponse.json({ 
      success: true, 
      message: "Proses import GTK/Staff sedang berjalan di latar belakang. Silakan periksa halaman beberapa saat lagi." 
    })
  } catch (error: any) {
    console.error("Import GTK Error:", error)
    return NextResponse.json({ error: "Terjadi kesalahan server saat memulai job import." }, { status: 500 })
  }
}
