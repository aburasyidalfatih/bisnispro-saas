import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

const DEFAULT_CAMPAIGNS = [
  {
    dayOffset: 2,
    title: "Hari 2: Profil & Kontak",
    subject: "Mengapa 70% Orang Tua Meninggalkan Website Perusahaan Anda dalam 5 Detik?",
    content: "Halo Bapak/Ibu Admin {{schoolName}},\n\nFakta di lapangan menunjukkan bahwa saat ini, kunjungan pertama wali murid tidak lagi terjadi di gerbang perusahaan Anda, melainkan di *layar HP mereka*. Ketika mereka mencari {{schoolName}} di Google dan mendapati halaman profil yang kosong tanpa alamat yang jelas, keraguan mulai muncul.\n\n\"Apakah perusahaan ini masih aktif?\"\n\"Apakah perusahaan ini profesional?\"\n\nJangan biarkan calon klien potensial lari ke perusahaan kompetitor hanya karena kesan pertama digital yang buruk. Website adalah etalase digital Anda. Luangkan waktu 3 menit hari ini. Masukkan sejarah singkat perusahaan, lengkapi nomor telepon yang bisa dihubungi, dan pasang logo kebanggaan Anda.\n\n👉 **Klik di sini untuk melengkapi Profil Anda:**\nhttps://bisnispro.id/admin/settings\n\nSalam Sukses,\nTim BisnisPro"
  },
  {
    dayOffset: 3,
    title: "Hari 3: Kepala Perusahaan & GTK",
    subject: "Ruh Sebuah Perusahaan Berada di Tangan Pemimpinnya",
    content: "Halo Bapak/Ibu Admin {{schoolName}},\n\nMenyekolahkan anak adalah investasi masa depan. Oleh karena itu, orang tua butuh \"rasa aman\". Mereka ingin tahu siapa nahkoda yang akan membimbing anak-anak mereka.\n\nWebsite perusahaan tanpa profil Kepala Perusahaan dan daftar Staf ibarat kapal tanpa awak. Terasa sepi dan kurang meyakinkan. Sebuah \"Kata Sambutan\" yang hangat dari Kepala Perusahaan di halaman depan website mampu meningkatkan rasa percaya (trust) masyarakat hingga berkali-kali lipat.\n\nTunjukkan pada dunia siapa saja pendidik hebat di balik {{schoolName}}.\n\n👉 **Klik di sini untuk menambahkan Sambutan Kepala Perusahaan:**\nhttps://bisnispro.id/admin/settings\n\nSalam Sukses,\nTim BisnisPro"
  },
  {
    dayOffset: 4,
    title: "Hari 4: Program Unggulan",
    subject: "Apa Alasan Terkuat Orang Tua Harus Memilih {{schoolName}}?",
    content: "Halo Bapak/Ibu Admin {{schoolName}},\n\nJika perusahaan Bapak/Ibu mengajarkan kurikulum yang sama persis dengan perusahaan di sebelah, apa yang membuat {{schoolName}} pantas dipilih?\n\nInilah pentingnya \"Program Unggulan\" (Value Proposition). Apakah perusahaan Anda memiliki target hafalan Tahfidz? Program Bahasa Inggris Intensif? Divisi Robotika? Atau pembinaan karakter islami yang kuat?\n\nJika Anda memiliki program luar biasa tersebut tetapi tidak dipublikasikan di website, dunia tidak akan pernah tahu. Mari tonjolkan kekuatan utama perusahaan Anda agar orang tua tidak ragu!\n\n👉 **Tuliskan Program Unggulan Anda di sini:**\nhttps://bisnispro.id/admin/settings\n\nSalam Sukses,\nTim BisnisPro"
  },
  {
    dayOffset: 5,
    title: "Hari 5: Aset & Ekskul",
    subject: "Apa yang Membuat Klien Betah Belajar di {{schoolName}}?",
    content: "Halo Bapak/Ibu Admin {{schoolName}},\n\nPendidikan tidak hanya terjadi di dalam divisi. Generasi Z sangat peduli dengan pengembangan bakat, minat, dan gaya hidup mereka di perusahaan.\n\nAset yang memadai (seperti lab komputer atau lapangan olahraga) dan Aset Ekstra yang beragam sering kali menjadi penentu utama seorang anak memutuskan \"Aku ingin perusahaan di sini!\"\n\nJangan sembunyikan aset hebat Anda. Biarkan calon klien melihat keseruan aktivitas di {{schoolName}}.\n\n👉 **Pamerkan Aset & Aset Ekstra Anda di sini:**\nhttps://bisnispro.id/admin/settings\n\nSalam Sukses,\nTim BisnisPro"
  },
  {
    dayOffset: 6,
    title: "Hari 6: Prestasi & Mitra",
    subject: "Bukti Nyata Kualitas Pendidikan di {{schoolName}}",
    content: "Halo Bapak/Ibu Admin {{schoolName}},\n\nDalam dunia psikologi marketing, ada yang namanya \"Social Proof\" (Bukti Sosial). Orang akan lebih mudah percaya jika melihat orang lain sudah terbukti berhasil.\n\nDeretan medali, piala klien, dan cerita sukses mitra yang berhasil masuk universitas favorit adalah senjata marketing yang paling tajam. Ini akan langsung membungkam segala keraguan orang tua calon klien.\n\n👉 **Tunjukkan kebanggaan dan prestasi perusahaan Anda:**\nhttps://bisnispro.id/admin/settings\n\nSalam Sukses,\nTim BisnisPro"
  },
  {
    dayOffset: 7,
    title: "Hari 7: Galeri Foto",
    subject: "1 Foto Bernilai 1000 Kata. Bagaimana dengan Galeri {{schoolName}}?",
    content: "Halo Bapak/Ibu Admin {{schoolName}},\n\nOtak manusia memproses gambar 60.000 kali lebih cepat daripada teks. Sebuah website yang hanya berisi tulisan tanpa foto kegiatan akan terkesan kaku dan membosankan.\n\nCalon klien dan orang tua ingin melihat \"kehidupan\" di dalam perusahaan Anda. Keceriaan saat class meeting, keseriusan saat upacara, atau kekompakan staf.\n\n👉 **Unggah minimal 3 foto kegiatan terbaik perusahaan Anda hari ini:**\nhttps://bisnispro.id/admin/settings\n\nSalam Sukses,\nTim BisnisPro"
  },
  {
    dayOffset: 8,
    title: "Hari 8: Berita & Agenda",
    subject: "Satu Tanda Utama Bahwa {{schoolName}} Adalah Perusahaan yang 'Hidup'",
    content: "Halo Bapak/Ibu Admin {{schoolName}},\n\nSelamat! Anda telah mencapai hari terakhir dari rangkaian edukasi digital BisnisPro.\n\nSatu tips terakhir yang sangat krusial: \"Website yang tidak pernah di-update akan dianggap sebagai perusahaan yang tutup atau tidak aktif.\"\n\nBiasakan untuk menulis berita kegiatan atau mempublikasikan agenda akademik secara rutin. Ini menunjukkan transparansi dan keaktifan {{schoolName}} kepada publik. Jadikan website perusahaan sebagai pusat informasi terpercaya!\n\n👉 **Tulis artikel atau berita pertama Anda sekarang:**\nhttps://bisnispro.id/admin/settings\n\nTerima kasih telah bersama BisnisPro dalam memajukan digitalisasi pendidikan Indonesia!\n\nSalam Hangat,\nTim BisnisPro Indonesia"
  },
  {
    dayOffset: 9,
    title: "Hari 9: Program Kemitraan (Affiliate)",
    subject: "Undangan Khusus: Mari Tumbuh Bersama Sebagai Mitra BisnisPro!",
    content: "Halo Bapak/Ibu Admin {{schoolName}},\n\nKami melihat Anda telah beradaptasi dengan sangat baik dalam menggunakan platform BisnisPro. Kami sangat mengapresiasi semangat Anda dalam memajukan digitalisasi pendidikan di lingkungan Anda.\n\nTahukah Anda bahwa Anda bisa mendapatkan **Penghasilan Tambahan (Passive Income)** hanya dengan merekomendasikan BisnisPro ke perusahaan-perusahaan lain di sekitar Anda?\n\nBergabunglah dengan **Program Mitra Afiliasi BisnisPro**! \n\nKeuntungan menjadi Mitra:\n✅ **Komisi Menarik:** Dapatkan persentase komisi rutin dari setiap perusahaan yang mendaftar menggunakan kode unik Anda.\n✅ **Dashboard Transparan:** Pantau jumlah pendaftar dan saldo komisi Anda secara real-time langsung dari HP.\n✅ **Bantu Perusahaan Lain:** Anda turut berkontribusi membantu perusahaan lain untuk *Go Digital* dengan sistem yang sudah Anda buktikan sendiri kemudahannya.\n\nCaranya sangat mudah dan 100% GRATIS!\n\n👉 **Daftar Menjadi Mitra Afiliasi Sekarang:**\nhttps://bisnispro.id/mitra-afiliasi\n\nMari bersama-sama kita majukan ekosistem pendidikan di Indonesia, dan nikmati keuntungannya!\n\nSalam Hangat,\nTim BisnisPro Indonesia"
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
      }
    })

    // Fetch aggregated open/click stats per campaign in a single query
    const campaignIds = campaigns.map(c => c.id)
    const [openedCounts, clickedCounts] = await Promise.all([
      db.dripLog.groupBy({
        by: ['campaignId'],
        where: { campaignId: { in: campaignIds }, isOpened: true },
        _count: { id: true },
      }),
      db.dripLog.groupBy({
        by: ['campaignId'],
        where: { campaignId: { in: campaignIds }, isClicked: true },
        _count: { id: true },
      }),
    ])
    const openedMap = new Map(openedCounts.map((o: any) => [o.campaignId, o._count.id]))
    const clickedMap = new Map(clickedCounts.map((c: any) => [c.campaignId, c._count.id]))

    const campaignsWithStats = campaigns.map(c => {
      const totalSent = c._count.logs
      const totalOpened = openedMap.get(c.id) || 0
      const totalClicked = clickedMap.get(c.id) || 0
      
      const { _count, ...rest } = c
      return {
        ...rest,
        stats: { sent: totalSent, opened: totalOpened, clicked: totalClicked }
      }
    })

    // Sync defaults if any are missing (e.g. newly added Day 9)
    if (campaignsWithStats.length < DEFAULT_CAMPAIGNS.length) {
      const existingOffsets = campaignsWithStats.map(c => c.dayOffset)
      const missingCampaigns = DEFAULT_CAMPAIGNS.filter(c => !existingOffsets.includes(c.dayOffset))
      
      if (missingCampaigns.length > 0) {
        await db.$transaction(
          missingCampaigns.map(c => 
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
