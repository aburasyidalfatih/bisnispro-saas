import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

const DEFAULT_CAMPAIGNS = [
  {
    dayOffset: 2,
    title: "Hari 2: Kesan Pertama Penentu Segalanya",
    subject: "Era Baru Pendidikan: Sudah Siapkah {{schoolName}} Menjadi Sekolah Digital Terdepan?",
    content: "Halo Bapak/Ibu Admin,\n\nSemoga pesan ini menjumpai Anda dan seluruh keluarga besar {{schoolName}} dalam keadaan sehat.\n\nPernahkah Anda menyadari bahwa hal pertama yang dilakukan calon wali murid saat ini ketika mencari sekolah untuk anaknya adalah... mencarinya di Google?\n\nKesan pertama sebuah sekolah kini ditentukan oleh seberapa profesional dan mudahnya informasi sekolah diakses melalui internet.\n\nMari lengkapi data profil sekolah Anda sekarang juga. Hanya butuh waktu kurang dari 5 menit!\n\n👉 Lengkapi Profil Digital Anda di Sini:\nhttps://schoolpro.id/login\n\n(Masuk ke Dasbor -> Buka menu Konten Website -> Profil & GTK -> Lengkapi data Identitas dan Kontak)\n\nSalam Hangat,\nTim SchoolPro Indonesia"
  },
  {
    dayOffset: 3,
    title: "Hari 3: Kepemimpinan yang Menginspirasi",
    subject: "Siapa Sosok Hebat di Balik Kesuksesan {{schoolName}}?",
    content: "Halo Bapak/Ibu Admin,\n\nOrang tua pasti ingin tahu siapa yang mendidik anak mereka. Menampilkan profil Kepala Sekolah dan daftar guru (GTK) yang kompeten akan meningkatkan rasa percaya (Trust) masyarakat secara drastis.\n\nSudahkah profil Kepala Sekolah {{schoolName}} dan daftar staf pengajar Anda tampil di website?\n\n👉 Tambahkan sekarang juga:\nhttps://schoolpro.id/login\n\n(Masuk ke Dasbor -> Buka menu Konten Website -> Profil & GTK -> Tab Guru & Staf)\n\nSalam Hangat,\nTim SchoolPro Indonesia"
  },
  {
    dayOffset: 4,
    title: "Hari 4: Program Unggulan",
    subject: "Apa yang Membuat {{schoolName}} Berbeda dari Sekolah Lain?",
    content: "Halo Bapak/Ibu Admin,\n\nSetiap sekolah pasti memiliki keunikan—entah itu program Tahfidz, Kelas Bilingual, Adiwiyata, atau kurikulum khusus lainnya.\n\nProgram Unggulan adalah ujung tombak promosi untuk menarik minat calon siswa baru. Jangan biarkan program luar biasa di {{schoolName}} tidak diketahui oleh publik!\n\n👉 Tuliskan 2-3 program terbaik sekolah Anda:\nhttps://schoolpro.id/login\n\n(Masuk ke Dasbor -> Buka menu Konten Website -> Profil & GTK -> Tab Program Unggulan)\n\nSalam Hangat,\nTim SchoolPro Indonesia"
  },
  {
    dayOffset: 5,
    title: "Hari 5: Fasilitas & Ekstrakurikuler",
    subject: "Belajar Tidak Hanya di Dalam Kelas di {{schoolName}}",
    content: "Halo Bapak/Ibu Admin,\n\nCalon siswa baru sangat tertarik dengan kegiatan di luar jam pelajaran. Fasilitas yang memadai (seperti lab komputer, lapangan basket) dan Ekskul yang beragam sering menjadi penentu utama seorang anak memilih sekolah.\n\n👉 Pamerkan fasilitas dan kegiatan ekskul Anda:\nhttps://schoolpro.id/login\n\n(Masuk ke Dasbor -> Buka menu Konten Website -> Profil & GTK -> Fasilitas & Ekskul)\n\nSalam Hangat,\nTim SchoolPro Indonesia"
  },
  {
    dayOffset: 6,
    title: "Hari 6: Prestasi & Alumni",
    subject: "Bukti Nyata Keberhasilan Siswa {{schoolName}}",
    content: "Halo Bapak/Ibu Admin,\n\nKesaksian (word of mouth) adalah marketing terkuat. Menampilkan deretan medali, piala siswa, dan cerita sukses alumni yang berhasil masuk universitas favorit akan langsung membungkam keraguan orang tua calon siswa.\n\n👉 Tunjukkan kebanggaan sekolah Anda:\nhttps://schoolpro.id/login\n\n(Masuk ke Dasbor -> Buka menu Konten Website -> Galeri & Alumni -> Tab Prestasi & Alumni)\n\nSalam Hangat,\nTim SchoolPro Indonesia"
  },
  {
    dayOffset: 7,
    title: "Hari 7: Galeri Foto",
    subject: "Satu Foto Menceritakan Ribuan Kata tentang {{schoolName}}",
    content: "Halo Bapak/Ibu Admin,\n\nWebsite yang tidak ada fotonya akan terkesan mati. Calon siswa dan orang tua ingin melihat keceriaan dan keaktifan proses belajar mengajar di {{schoolName}}.\n\n👉 Unggah minimal 3 foto kegiatan sekolah terbaik Anda hari ini:\nhttps://schoolpro.id/login\n\n(Masuk ke Dasbor -> Buka menu Konten Website -> Galeri & Alumni -> Galeri Foto)\n\nSalam Hangat,\nTim SchoolPro Indonesia"
  },
  {
    dayOffset: 8,
    title: "Hari 8: Berita & Agenda",
    subject: "Tetap Terhubung dengan Komunitas {{schoolName}}",
    content: "Halo Bapak/Ibu Admin,\n\nWebsite yang baik adalah website yang terus di-update. Biasakan menulis berita kegiatan atau mempublikasikan agenda akademik agar masyarakat tahu bahwa {{schoolName}} adalah sekolah yang aktif dan transparan.\n\n👉 Tulis artikel atau berita pertama Anda sekarang:\nhttps://schoolpro.id/login\n\n(Masuk ke Dasbor -> Buka menu Konten Website -> Informasi & Berita -> Artikel & Pos)\n\nSemangat membangun digitalisasi sekolah!\n\nSalam Hangat,\nTim SchoolPro Indonesia"
  }
]

export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.isSuperAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    let campaigns = await db.dripCampaign.findMany({
      orderBy: { dayOffset: 'asc' }
    })

    // Seed defaults if empty
    if (campaigns.length === 0) {
      await db.$transaction(
        DEFAULT_CAMPAIGNS.map(c => 
          db.dripCampaign.create({
            data: {
              dayOffset: c.dayOffset,
              title: c.title,
              subject: c.subject,
              content: c.content,
              isActive: true
            }
          })
        )
      )
      campaigns = await db.dripCampaign.findMany({ orderBy: { dayOffset: 'asc' } })
    }

    return NextResponse.json(campaigns)
  } catch (error: any) {
    console.error("GET DripCampaign Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.isSuperAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id, subject, content, isActive } = await req.json()

    if (!id || !subject || !content) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const campaign = await db.dripCampaign.update({
      where: { id },
      data: { subject, content, isActive }
    })

    return NextResponse.json({ message: "Campaign updated successfully", campaign })
  } catch (error: any) {
    console.error("PUT DripCampaign Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
