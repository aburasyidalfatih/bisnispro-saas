import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { requireTenantMembership } from "@/lib/api-utils"

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    // Cari data pendaftar
    const pendaftar = await db.pendaftarPpdb.findUnique({
      where: { id },
      include: { user: true }
    })

    if (!pendaftar) return NextResponse.json({ error: "Pendaftar tidak ditemukan" }, { status: 404 })

    // Verifikasi kepemilikan tenant
    const { error: tenantError } = await requireTenantMembership(pendaftar.tenantId)
    if (tenantError) return tenantError

    // Pastikan status DITERIMA
    if (pendaftar.status !== "DITERIMA") {
      return NextResponse.json({ error: "Hanya pendaftar dengan status DITERIMA yang dapat disinkronisasi" }, { status: 400 })
    }

    // 1. Buat data Student (Siswa Baru)
    // Coba ambil NIS/NISN dari form jika ada
    let nis = null
    let nisn = null
    let gender = null
    let birthPlace = null
    let birthDate = null
    
    if (pendaftar.dataFormulir && typeof pendaftar.dataFormulir === 'object') {
      const form = pendaftar.dataFormulir as any
      nis = form.nis || form.NIS || null
      nisn = form.nisn || form.NISN || null
      gender = form.jenisKelamin || form.gender || null
      birthPlace = form.tempatLahir || form.tempat_lahir || null
      if (form.tanggalLahir || form.tanggal_lahir) {
        try {
           birthDate = new Date(form.tanggalLahir || form.tanggal_lahir)
        } catch(e) {}
      }
    }

    // Coba extract data ortu
    let fatherName = null
    let motherName = null
    if (pendaftar.dataOrangtua && typeof pendaftar.dataOrangtua === 'object') {
      const ortu = pendaftar.dataOrangtua as any
      fatherName = ortu.namaAyah || ortu.nama_ayah || null
      motherName = ortu.namaIbu || ortu.nama_ibu || null
    }

    const newStudent = await db.student.create({
      data: {
        tenantId: pendaftar.tenantId,
        name: pendaftar.namaLengkap,
        noPendaftaran: pendaftar.noPendaftaran,
        nis,
        nisn,
        gender,
        birthPlace,
        birthDate,
        fatherName,
        motherName,
        syncedAt: new Date(),
        metadata: {
           source: "PPDB",
           pendaftarId: pendaftar.id
        }
      }
    })

    // 2. Buat Wallet Account (Dompet Digital Siswa)
    await db.walletAccount.create({
      data: {
        tenantId: pendaftar.tenantId,
        studentId: newStudent.id,
        balance: 0,
        isActive: true
      }
    })

    // 3. Hubungkan orang tua dengan siswa baru di tabel StudentParent
    await db.studentParent.create({
      data: {
        studentId: newStudent.id,
        userId: pendaftar.userId,
        relation: "WALI" // Default WALI, bisa diganti nanti
      }
    })

    // 4. Update status pendaftar menjadi SINKRONISASI
    await db.pendaftarPpdb.update({
      where: { id },
      data: { status: "SINKRONISASI" }
    })

    // TODO: Bisa memanggil action untuk mengirim pesan WA (credentials) nanti.

    return NextResponse.json({ message: "Data pendaftar berhasil disinkronisasi menjadi siswa aktif", studentId: newStudent.id })
  } catch (error: any) {
    console.error("Error syncing student:", error)
    return NextResponse.json({ error: error.message || "Gagal menyinkronisasi data" }, { status: 500 })
  }
}
