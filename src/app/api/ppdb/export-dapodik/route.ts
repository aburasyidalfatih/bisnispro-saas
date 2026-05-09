import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { NextResponse } from "next/server"
import ExcelJS from "exceljs"

export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const periodeId = searchParams.get("periodeId")
    const tenantId = searchParams.get("tenantId")

    if (!periodeId || !tenantId) {
      return new NextResponse("Missing parameters", { status: 400 })
    }

    // Ambil data pendaftar
    const pendaftar = await db.pendaftarPpdb.findMany({
      where: {
        tenantId,
        periodeId,
        status: {
            in: ["DITERIMA", "MENUNGGU"] // Bisa disesuaikan
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    if (pendaftar.length === 0) {
      return new NextResponse("Tidak ada data pendaftar", { status: 404 })
    }

    // Buat Workbook ExcelJS
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet("F-PD Dapodik")

    // Define columns based on Dapodik format
    worksheet.columns = [
      { header: "No", key: "no", width: 5 },
      { header: "Jenis Pendaftaran", key: "jenisPendaftaran", width: 20 },
      { header: "Jalur Pendaftaran", key: "jalur", width: 15 },
      { header: "Nama Sekolah Asal", key: "namaSekolahAsal", width: 25 },
      { header: "NPSN Sekolah Asal", key: "npsnSekolahAsal", width: 15 },
      { header: "Nomor Peserta Ujian", key: "nomorPesertaUjian", width: 20 },
      { header: "Nomor Seri Ijazah", key: "nomorIjazah", width: 20 },
      { header: "Nomor SKHUN", key: "nomorSKHUN", width: 20 },
      
      { header: "Nama Lengkap", key: "namaLengkap", width: 30 },
      { header: "NISN", key: "nisn", width: 15 },
      { header: "Jenis Kelamin", key: "jenisKelamin", width: 15 },
      { header: "NIK", key: "nik", width: 20 },
      { header: "Tempat Lahir", key: "tempatLahir", width: 20 },
      { header: "Tanggal Lahir", key: "tanggalLahir", width: 15 },
      { header: "No Registrasi Akta Lahir", key: "noRegistrasiAkta", width: 20 },
      { header: "Agama & Kepercayaan", key: "agama", width: 15 },
      { header: "Kewarganegaraan", key: "kewarganegaraan", width: 10 },
      { header: "Berkebutuhan Khusus", key: "kebutuhanKhusus", width: 15 },
      { header: "Anak Ke-berapa", key: "anakKe", width: 10 },
      
      { header: "Alamat Jalan", key: "alamat", width: 30 },
      { header: "RT/RW", key: "rtRw", width: 10 },
      { header: "Dusun", key: "dusun", width: 15 },
      { header: "Kelurahan/Desa", key: "kelurahan", width: 20 },
      { header: "Kecamatan", key: "kecamatan", width: 20 },
      { header: "Kabupaten/Kota", key: "kabupaten", width: 20 },
      { header: "Provinsi", key: "provinsi", width: 20 },
      { header: "Kode Pos", key: "kodePos", width: 10 },
      { header: "Lintang", key: "lintang", width: 15 },
      { header: "Bujur", key: "bujur", width: 15 },
      { header: "Tempat Tinggal", key: "tempatTinggal", width: 15 },
      { header: "Moda Transportasi", key: "modaTransportasi", width: 15 },
      
      { header: "No. Telepon Rumah", key: "teleponRumah", width: 15 },
      { header: "No. HP", key: "telepon", width: 15 },
      { header: "Email Pribadi", key: "emailPribadi", width: 25 },
      
      { header: "Nama Ayah", key: "namaAyah", width: 25 },
      { header: "NIK Ayah", key: "nikAyah", width: 20 },
      { header: "Tahun Lahir Ayah", key: "tahunLahirAyah", width: 15 },
      { header: "Pendidikan Ayah", key: "pendidikanAyah", width: 15 },
      { header: "Pekerjaan Ayah", key: "pekerjaanAyah", width: 15 },
      { header: "Penghasilan Ayah", key: "penghasilanAyah", width: 15 },
      { header: "Berkebutuhan Khusus Ayah", key: "kebutuhanKhususAyah", width: 20 },
      
      { header: "Nama Ibu", key: "namaIbu", width: 25 },
      { header: "NIK Ibu", key: "nikIbu", width: 20 },
      { header: "Tahun Lahir Ibu", key: "tahunLahirIbu", width: 15 },
      { header: "Pendidikan Ibu", key: "pendidikanIbu", width: 15 },
      { header: "Pekerjaan Ibu", key: "pekerjaanIbu", width: 15 },
      { header: "Penghasilan Ibu", key: "penghasilanIbu", width: 15 },
      { header: "Berkebutuhan Khusus Ibu", key: "kebutuhanKhususIbu", width: 20 },
      
      { header: "Nama Wali", key: "namaWali", width: 25 },
      { header: "NIK Wali", key: "nikWali", width: 20 },
      { header: "Tahun Lahir Wali", key: "tahunLahirWali", width: 15 },
      { header: "Pendidikan Wali", key: "pendidikanWali", width: 15 },
      { header: "Pekerjaan Wali", key: "pekerjaanWali", width: 15 },
      { header: "Penghasilan Wali", key: "penghasilanWali", width: 15 },
      
      { header: "Tinggi Badan", key: "tinggiBadan", width: 10 },
      { header: "Berat Badan", key: "beratBadan", width: 10 },
    ]

    // Style the header row
    worksheet.getRow(1).font = { bold: true }
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    }

    // Add data
    pendaftar.forEach((p, index) => {
      const siswa = (p.dataFormulir as any) || {}
      const ortu = (p.dataOrangtua as any) || {}
      const sekolah = ortu.sekolah || {}

      worksheet.addRow({
        no: index + 1,
        jenisPendaftaran: siswa.jenisPendaftaran || "Siswa Baru",
        jalur: "-",
        namaSekolahAsal: sekolah.namaSekolahAsal || "",
        npsnSekolahAsal: sekolah.npsnSekolahAsal || "",
        nomorPesertaUjian: sekolah.nomorPesertaUjian || "",
        nomorIjazah: sekolah.nomorIjazah || "",
        nomorSKHUN: sekolah.nomorSKHUN || "",
        
        namaLengkap: p.namaLengkap,
        nisn: siswa.nisn || "",
        jenisKelamin: siswa.jenisKelamin || "",
        nik: siswa.nik || "",
        tempatLahir: siswa.tempatLahir || "",
        tanggalLahir: siswa.tanggalLahir || "",
        noRegistrasiAkta: siswa.noRegistrasiAkta || "",
        agama: siswa.agama || "",
        kewarganegaraan: siswa.kewarganegaraan || "WNI",
        kebutuhanKhusus: siswa.kebutuhanKhusus || "Tidak",
        anakKe: siswa.anakKe || "",
        
        alamat: siswa.alamat || "",
        rtRw: siswa.rtRw || "",
        dusun: siswa.dusun || "",
        kelurahan: siswa.kelurahan || "",
        kecamatan: siswa.kecamatan || "",
        kabupaten: siswa.kabupaten || "",
        provinsi: siswa.provinsi || "",
        kodePos: siswa.kodePos || "",
        lintang: siswa.lintang || "",
        bujur: siswa.bujur || "",
        tempatTinggal: siswa.tempatTinggal || "",
        modaTransportasi: siswa.modaTransportasi || "",
        
        teleponRumah: "", // rarely collected in our standard form
        telepon: siswa.telepon || "",
        emailPribadi: siswa.emailPribadi || "",
        
        namaAyah: ortu.namaAyah || "",
        nikAyah: ortu.nikAyah || "",
        tahunLahirAyah: ortu.tahunLahirAyah || "",
        pendidikanAyah: ortu.pendidikanAyah || "",
        pekerjaanAyah: ortu.pekerjaanAyah || "",
        penghasilanAyah: ortu.penghasilanAyah || ortu.penghasilanOrtuGabungan || "",
        kebutuhanKhususAyah: ortu.kebutuhanKhususAyah || "Tidak",
        
        namaIbu: ortu.namaIbu || "",
        nikIbu: ortu.nikIbu || "",
        tahunLahirIbu: ortu.tahunLahirIbu || "",
        pendidikanIbu: ortu.pendidikanIbu || "",
        pekerjaanIbu: ortu.pekerjaanIbu || "",
        penghasilanIbu: ortu.penghasilanIbu || ortu.penghasilanOrtuGabungan || "",
        kebutuhanKhususIbu: ortu.kebutuhanKhususIbu || "Tidak",
        
        namaWali: ortu.namaWali || "",
        nikWali: ortu.nikWali || "",
        tahunLahirWali: ortu.tahunLahirWali || "",
        pendidikanWali: ortu.pendidikanWali || "",
        pekerjaanWali: ortu.pekerjaanWali || "",
        penghasilanWali: ortu.penghasilanWali || "",
        
        tinggiBadan: siswa.tinggiBadan || "",
        beratBadan: siswa.beratBadan || "",
      })
    })

    const buffer = await workbook.xlsx.writeBuffer()

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="Export_Dapodik_PPDB_${Date.now()}.xlsx"`
      }
    })

  } catch (error) {
    console.error("Export error:", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
