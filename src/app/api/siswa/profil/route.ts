import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const tenantId = session.user.tenants?.[0]?.id

  try {
    const student = await db.student.findFirst({
      where: { userId: session.user.id, tenantId }
    })

    if (!student) {
      return NextResponse.json({ error: "Siswa tidak ditemukan" }, { status: 404 })
    }

    return NextResponse.json({ 
      nisn: student.nisn, 
      address: student.address || "Belum ada alamat",
      status: student.isActive ? "AKTIF" : "NONAKTIF",
      phone: student.phone || "Belum ada nomor HP"
    })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
