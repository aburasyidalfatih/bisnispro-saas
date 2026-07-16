import { requireTenantMembership } from "@/lib/api-utils"
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { logger } from "@/lib/logger"
import { db } from "@/lib/db"

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { tenantId, users } = await req.json()
  const { error: accessError } = await requireTenantMembership(tenantId as string);
  if (accessError) return accessError;

    // Cek tenant akses & role (harus admin/owner)
    const activeTenant = session.user.tenants?.find((t: any) => t.id === tenantId)
    if (!activeTenant || (activeTenant.role !== "admin" && activeTenant.role !== "owner")) {
      return NextResponse.json({ error: "Forbidden. Admin access required." }, { status: 403 })
    }

    // 3. Masukkan ke BullMQ
    const { importQueue } = await import("@/lib/queue")
    await importQueue.add("import-gtk", { tenantId, type: "users", data: users, userId: session.user.id })

    // Log the action
    await db.auditLog.create({
      data: {
        tenantId,
        action: "ENQUEUE_IMPORT_USERS",
        entity: "System",
        userId: session.user.id || "SYSTEM"
      }
    }).catch(() => {})

    return NextResponse.json({ 
      success: true, 
      message: "Proses import GTK/Staff sedang berjalan di latar belakang. Silakan periksa halaman beberapa saat lagi." 
    })
  } catch (error: any) {
    console.error("Import GTK Error:", error)
    return NextResponse.json({ error: "Terjadi kesalahan server saat memulai job import." }, { status: 500 })
  }
}
