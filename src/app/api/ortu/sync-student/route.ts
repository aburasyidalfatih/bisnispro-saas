import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { format } from "date-fns"

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { nisn, birthDate, relation } = await req.json()

    if (!nisn || !birthDate) {
      return NextResponse.json({ error: "NISN dan Tanggal Lahir harus diisi" }, { status: 400 })
    }

    const tenantId = session.user.tenants?.[0]?.id
    if (!tenantId) {
      return NextResponse.json({ error: "Tenant ID tidak valid" }, { status: 400 })
    }

    // Cari siswa berdasarkan NISN dan Tenant
    const student = await db.student.findFirst({
      where: {
        tenantId,
        nisn: nisn,
        isActive: true,
      }
    })

    if (!student) {
      return NextResponse.json({ error: "Siswa dengan NISN tersebut tidak ditemukan" }, { status: 404 })
    }

    if (!student.birthDate) {
      return NextResponse.json({ error: "Data tanggal lahir siswa belum diatur oleh admin sekolah. Silakan hubungi admin." }, { status: 400 })
    }

    // Cocokkan tanggal lahir (YYYY-MM-DD)
    const dbDate = format(new Date(student.birthDate), "yyyy-MM-dd")
    const inputDate = format(new Date(birthDate), "yyyy-MM-dd")

    if (dbDate !== inputDate) {
      return NextResponse.json({ error: "Tanggal Lahir tidak cocok dengan database kami" }, { status: 400 })
    }

    // Cek apakah sudah tertaut dengan user ini
    const existingLink = await db.studentParent.findFirst({
      where: {
        studentId: student.id,
        userId: session.user.id
      }
    })

    if (existingLink) {
      return NextResponse.json({ error: "Akun Anda sudah tertaut dengan siswa ini" }, { status: 400 })
    }

    // Tautkan orang tua ke siswa
    await db.studentParent.create({
      data: {
        studentId: student.id,
        userId: session.user.id,
        relation: relation || "AYAH",
      }
    })

    return NextResponse.json({ success: true, message: "Berhasil menautkan data siswa" })
  } catch (error: any) {
    console.error("[SYNC_STUDENT]", error)
    return NextResponse.json({ error: "Terjadi kesalahan internal server" }, { status: 500 })
  }
}
