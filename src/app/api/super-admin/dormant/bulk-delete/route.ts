import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.isSuperAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const { tenantIds } = await req.json()
    if (!Array.isArray(tenantIds) || tenantIds.length === 0) {
      return NextResponse.json({ error: "Pilih minimal satu tenant" }, { status: 400 })
    }

    // Prisma akan otomatis melakukan cascading delete pada model terkait
    // berdasarkan @relation(onDelete: Cascade) yang telah di set di schema.prisma
    const result = await db.tenant.deleteMany({
      where: {
        id: { in: tenantIds }
      }
    })

    return NextResponse.json({ success: true, count: result.count })
  } catch (error) {
    console.error("Bulk delete error:", error)
    return NextResponse.json({ error: "Terjadi kesalahan saat menghapus data" }, { status: 500 })
  }
}
