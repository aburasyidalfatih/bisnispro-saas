import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

const DEFAULT_CAMPAIGNS = [
  {
    dayOffset: 2,
    title: "Hari 2: Profil & Kontak",
    subject: "Mengapa 70% Orang Tua Meninggalkan Website Sekolah Anda dalam 5 Detik?",
    content: "Halo Bapak/Ibu Admin {{schoolName}},\n\nFakta di lapangan menunjukkan bahwa saat ini, kunjungan pertama wali murid tidak lagi terjadi di gerbang sekolah Anda, melainkan di *layar HP mereka*. Ketika mereka mencari {{schoolName}} di Google dan mendapati halaman profil yang kosong tanpa alamat yang jelas, keraguan mulai muncul.\n\n\"Apakah sekolah ini masih aktif?\"\n\"Apakah sekolah ini profesional?\"\n\nJangan biarkan calon siswa potensial lari ke sekolah kompetitor hanya karena kesan pertama digital yang buruk. Website adalah etalase digital Anda. Luangkan waktu 3 menit hari ini. Masukkan sejarah singkat sekolah, lengkapi nomor telepon yang bisa dihubungi, dan pasang logo kebanggaan Anda.\n\n👉 **Klik di sini untuk melengkapi Profil Anda:**\nhttps://schoolpro.id/super-admin/settings\n\nSalam Sukses,\nTim SchoolPro"
  },
  {
    dayOffset: 3,
    title: "Hari 3: Kepala Sekolah & GTK",
    subject: "Ruh Sebuah Sekolah Berada di Tangan Pemimpinnya",
    content: "Halo Bapak/Ibu Admin {{schoolName}},\n\nMenyekolahkan anak adalah investasi masa depan. Oleh karena itu, orang tua butuh \"rasa aman\". Mereka ingin tahu siapa nahkoda yang akan membimbing anak-anak mereka.\n\nWebsite sekolah tanpa profil Kepala Sekolah dan daftar Guru ibarat kapal tanpa awak. Terasa sepi dan kurang meyakinkan. Sebuah \"Kata Sambutan\" yang hangat dari Kepala Sekolah di halaman depan website mampu meningkatkan rasa percaya (trust) masyarakat hingga berkali-kali lipat.\n\nTunjukkan pada dunia siapa saja pendidik hebat di balik {{schoolName}}.\n\n👉 **Klik di sini untuk menambahkan Sambutan Kepala Sekolah:**\nhttps://schoolpro.id/super-admin/settings\n\nSalam Sukses,\nTim SchoolPro"
  },
  {
    dayOffset: 4,
    title: "Hari 4: Program Unggulan",
    subject: "Apa Alasan Terkuat Orang Tua Harus Memilih {{schoolName}}?",
    content: "Halo Bapak/Ibu Admin {{schoolName}},\n\nJika sekolah Bapak/Ibu mengajarkan kurikulum yang sama persis dengan sekolah di sebelah, apa yang membuat {{schoolName}} pantas dipilih?\n\nInilah pentingnya \"Program Unggulan\" (Value Proposition). Apakah sekolah Anda memiliki target hafalan Tahfidz? Program Bahasa Inggris Intensif? Kelas Robotika? Atau pembinaan karakter islami yang kuat?\n\nJika Anda memiliki program luar biasa tersebut tetapi tidak dipublikasikan di website, dunia tidak akan pernah tahu. Mari tonjolkan kekuatan utama sekolah Anda agar orang tua tidak ragu!\n\n👉 **Tuliskan Program Unggulan Anda di sini:**\nhttps://schoolpro.id/super-admin/settings\n\nSalam Sukses,\nTim SchoolPro"
  },
  {
    dayOffset: 5,
    title: "Hari 5: Fasilitas & Ekskul",
    subject: "Apa yang Membuat Siswa Betah Belajar di {{schoolName}}?",
    content: "Halo Bapak/Ibu Admin {{schoolName}},\n\nPendidikan tidak hanya terjadi di dalam kelas. Generasi Z sangat peduli dengan pengembangan bakat, minat, dan gaya hidup mereka di sekolah.\n\nFasilitas yang memadai (seperti lab komputer atau lapangan olahraga) dan Ekstrakurikuler yang beragam sering kali menjadi penentu utama seorang anak memutuskan \"Aku ingin sekolah di sini!\"\n\nJangan sembunyikan fasilitas hebat Anda. Biarkan calon siswa melihat keseruan aktivitas di {{schoolName}}.\n\n👉 **Pamerkan Fasilitas & Ekstrakurikuler Anda di sini:**\nhttps://schoolpro.id/super-admin/settings\n\nSalam Sukses,\nTim SchoolPro"
  },
  {
    dayOffset: 6,
    title: "Hari 6: Prestasi & Alumni",
    subject: "Bukti Nyata Kualitas Pendidikan di {{schoolName}}",
    content: "Halo Bapak/Ibu Admin {{schoolName}},\n\nDalam dunia psikologi marketing, ada yang namanya \"Social Proof\" (Bukti Sosial). Orang akan lebih mudah percaya jika melihat orang lain sudah terbukti berhasil.\n\nDeretan medali, piala siswa, dan cerita sukses alumni yang berhasil masuk universitas favorit adalah senjata marketing yang paling tajam. Ini akan langsung membungkam segala keraguan orang tua calon siswa.\n\n👉 **Tunjukkan kebanggaan dan prestasi sekolah Anda:**\nhttps://schoolpro.id/super-admin/settings\n\nSalam Sukses,\nTim SchoolPro"
  },
  {
    dayOffset: 7,
    title: "Hari 7: Galeri Foto",
    subject: "1 Foto Bernilai 1000 Kata. Bagaimana dengan Galeri {{schoolName}}?",
    content: "Halo Bapak/Ibu Admin {{schoolName}},\n\nOtak manusia memproses gambar 60.000 kali lebih cepat daripada teks. Sebuah website yang hanya berisi tulisan tanpa foto kegiatan akan terkesan kaku dan membosankan.\n\nCalon siswa dan orang tua ingin melihat \"kehidupan\" di dalam sekolah Anda. Keceriaan saat class meeting, keseriusan saat upacara, atau kekompakan guru.\n\n👉 **Unggah minimal 3 foto kegiatan terbaik sekolah Anda hari ini:**\nhttps://schoolpro.id/super-admin/settings\n\nSalam Sukses,\nTim SchoolPro"
  },
  {
    dayOffset: 8,
    title: "Hari 8: Berita & Agenda",
    subject: "Satu Tanda Utama Bahwa {{schoolName}} Adalah Sekolah yang 'Hidup'",
    content: "Halo Bapak/Ibu Admin {{schoolName}},\n\nSelamat! Anda telah mencapai hari terakhir dari rangkaian edukasi digital SchoolPro.\n\nSatu tips terakhir yang sangat krusial: \"Website yang tidak pernah di-update akan dianggap sebagai sekolah yang tutup atau tidak aktif.\"\n\nBiasakan untuk menulis berita kegiatan atau mempublikasikan agenda akademik secara rutin. Ini menunjukkan transparansi dan keaktifan {{schoolName}} kepada publik. Jadikan website sekolah sebagai pusat informasi terpercaya!\n\n👉 **Tulis artikel atau berita pertama Anda sekarang:**\nhttps://schoolpro.id/super-admin/settings\n\nTerima kasih telah bersama SchoolPro dalam memajukan digitalisasi pendidikan Indonesia!\n\nSalam Hangat,\nTim SchoolPro Indonesia"
  }
]

export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.isSuperAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    let campaigns = await db.dripCampaign.findMany({
      orderBy: { dayOffset: 'asc' },
      include: {
        _count: {
          select: { logs: true } // Total sent
        },
        logs: {
          select: { isOpened: true, isClicked: true } // We'll compute the stats below
        }
      }
    })

    const campaignsWithStats = campaigns.map(c => {
      const totalSent = c._count.logs
      const totalOpened = c.logs.filter(l => l.isOpened).length
      const totalClicked = c.logs.filter(l => l.isClicked).length
      
      const { logs, _count, ...rest } = c
      return {
        ...rest,
        stats: { sent: totalSent, opened: totalOpened, clicked: totalClicked }
      }
    })

    // Seed defaults if empty
    if (campaignsWithStats.length === 0) {
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
      // Re-fetch after seed
      const newCampaigns = await db.dripCampaign.findMany({ 
        orderBy: { dayOffset: 'asc' },
        include: { _count: { select: { logs: true } }, logs: { select: { isOpened: true, isClicked: true } } }
      })
      const newCampaignsWithStats = newCampaigns.map(c => {
        const totalSent = c._count.logs
        const totalOpened = c.logs.filter(l => l.isOpened).length
        const totalClicked = c.logs.filter(l => l.isClicked).length
        const { logs, _count, ...rest } = c
        return { ...rest, stats: { sent: totalSent, opened: totalOpened, clicked: totalClicked } }
      })
      return NextResponse.json(newCampaignsWithStats)
    }

    return NextResponse.json(campaignsWithStats)
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
