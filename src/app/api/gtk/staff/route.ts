import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

// Ambil daftar semua staff di tenant (untuk dropdown di jadwal, disiplin, dll)
export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { searchParams } = new URL(req.url)
    const tenantId = searchParams.get("tenantId")
    if (!tenantId) return NextResponse.json({ error: "tenantId required" }, { status: 400 })

    const staff = await db.staff.findMany({
      where: { tenantId },
      select: { id: true, name: true, role: true, imageUrl: true, subject: true, userId: true },
      orderBy: { name: "asc" },
    })
    return NextResponse.json({ staff })
  } catch {
    return NextResponse.json({ error: "Gagal memuat staff" }, { status: 500 })
  }
}
