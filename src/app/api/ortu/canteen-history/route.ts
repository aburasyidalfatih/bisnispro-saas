import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { searchParams } = new URL(req.url)
    const tenantId = searchParams.get("tenantId")
    const studentId = searchParams.get("studentId")
    if (!tenantId || !studentId) return NextResponse.json({ error: "tenantId & studentId required" }, { status: 400 })

    // Verify parent-student relationship
    const link = await db.studentParent.findFirst({ where: { userId: session.user.id, studentId } })
    if (!link) return NextResponse.json({ error: "Akses ditolak" }, { status: 403 })

    const orders = await db.canteenOrder.findMany({
      where: { tenantId, studentId, status: "COMPLETED" },
      include: {
        merchant: { select: { name: true } },
        items: {
          include: { product: { select: { name: true, imageUrl: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    })
    return NextResponse.json({ orders })
  } catch {
    return NextResponse.json({ error: "Gagal memuat riwayat kantin" }, { status: 500 })
  }
}
