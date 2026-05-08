const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const NEW_CAMPAIGNS = [
  {
    dayOffset: 2,
    title: "Hari 2: Profil & Kontak",
    subject: "Mengapa 70% Orang Tua Meninggalkan Website Sekolah Anda dalam 5 Detik?",
    content: `Halo Bapak/Ibu Admin {{schoolName}},

Fakta di lapangan menunjukkan bahwa saat ini, kunjungan pertama wali murid tidak lagi terjadi di gerbang sekolah Anda, melainkan di *layar HP mereka*. Ketika mereka mencari {{schoolName}} di Google dan mendapati halaman profil yang kosong tanpa alamat yang jelas, keraguan mulai muncul.

"Apakah sekolah ini masih aktif?"
"Apakah sekolah ini profesional?"

Jangan biarkan calon siswa potensial lari ke sekolah kompetitor hanya karena kesan pertama digital yang buruk. Website adalah etalase digital Anda. Luangkan waktu 3 menit hari ini. Masukkan sejarah singkat sekolah, lengkapi nomor telepon yang bisa dihubungi, dan pasang logo kebanggaan Anda.

👉 **Klik di sini untuk melengkapi Profil Anda:**
https://schoolpro.id/admin/settings

Salam Sukses,
Tim SchoolPro`
  },
  {
    dayOffset: 3,
    title: "Hari 3: Kepala Sekolah & GTK",
    subject: "Ruh Sebuah Sekolah Berada di Tangan Pemimpinnya",
    content: `Halo Bapak/Ibu Admin {{schoolName}},

Menyekolahkan anak adalah investasi masa depan. Oleh karena itu, orang tua butuh "rasa aman". Mereka ingin tahu siapa nahkoda yang akan membimbing anak-anak mereka.

Website sekolah tanpa profil Kepala Sekolah dan daftar Guru ibarat kapal tanpa awak. Terasa sepi dan kurang meyakinkan. Sebuah "Kata Sambutan" yang hangat dari Kepala Sekolah di halaman depan website mampu meningkatkan rasa percaya (trust) masyarakat hingga berkali-kali lipat.

Tunjukkan pada dunia siapa saja pendidik hebat di balik {{schoolName}}.

👉 **Klik di sini untuk menambahkan Sambutan Kepala Sekolah:**
https://schoolpro.id/admin/settings

Salam Sukses,
Tim SchoolPro`
  },
  {
    dayOffset: 4,
    title: "Hari 4: Program Unggulan",
    subject: "Apa Alasan Terkuat Orang Tua Harus Memilih {{schoolName}}?",
    content: `Halo Bapak/Ibu Admin {{schoolName}},

Jika sekolah Bapak/Ibu mengajarkan kurikulum yang sama persis dengan sekolah di sebelah, apa yang membuat {{schoolName}} pantas dipilih?

Inilah pentingnya "Program Unggulan" (Value Proposition). Apakah sekolah Anda memiliki target hafalan Tahfidz? Program Bahasa Inggris Intensif? Kelas Robotika? Atau pembinaan karakter islami yang kuat? 

Jika Anda memiliki program luar biasa tersebut tetapi tidak dipublikasikan di website, dunia tidak akan pernah tahu. Mari tonjolkan kekuatan utama sekolah Anda agar orang tua tidak ragu!

👉 **Tuliskan Program Unggulan Anda di sini:**
https://schoolpro.id/admin/settings

Salam Sukses,
Tim SchoolPro`
  },
  {
    dayOffset: 5,
    title: "Hari 5: Fasilitas & Ekskul",
    subject: "Apa yang Membuat Siswa Betah Belajar di {{schoolName}}?",
    content: `Halo Bapak/Ibu Admin {{schoolName}},

Pendidikan tidak hanya terjadi di dalam kelas. Generasi Z sangat peduli dengan pengembangan bakat, minat, dan gaya hidup mereka di sekolah.

Fasilitas yang memadai (seperti lab komputer atau lapangan olahraga) dan Ekstrakurikuler yang beragam sering kali menjadi penentu utama seorang anak memutuskan "Aku ingin sekolah di sini!"

Jangan sembunyikan fasilitas hebat Anda. Biarkan calon siswa melihat keseruan aktivitas di {{schoolName}}.

👉 **Pamerkan Fasilitas & Ekstrakurikuler Anda di sini:**
https://schoolpro.id/admin/settings

Salam Sukses,
Tim SchoolPro`
  },
  {
    dayOffset: 6,
    title: "Hari 6: Prestasi & Alumni",
    subject: "Bukti Nyata Kualitas Pendidikan di {{schoolName}}",
    content: `Halo Bapak/Ibu Admin {{schoolName}},

Dalam dunia psikologi marketing, ada yang namanya "Social Proof" (Bukti Sosial). Orang akan lebih mudah percaya jika melihat orang lain sudah terbukti berhasil.

Deretan medali, piala siswa, dan cerita sukses alumni yang berhasil masuk universitas favorit adalah senjata marketing yang paling tajam. Ini akan langsung membungkam segala keraguan orang tua calon siswa.

👉 **Tunjukkan kebanggaan dan prestasi sekolah Anda:**
https://schoolpro.id/admin/settings

Salam Sukses,
Tim SchoolPro`
  },
  {
    dayOffset: 7,
    title: "Hari 7: Galeri Foto",
    subject: "1 Foto Bernilai 1000 Kata. Bagaimana dengan Galeri {{schoolName}}?",
    content: `Halo Bapak/Ibu Admin {{schoolName}},

Otak manusia memproses gambar 60.000 kali lebih cepat daripada teks. Sebuah website yang hanya berisi tulisan tanpa foto kegiatan akan terkesan kaku dan membosankan.

Calon siswa dan orang tua ingin melihat "kehidupan" di dalam sekolah Anda. Keceriaan saat class meeting, keseriusan saat upacara, atau kekompakan guru.

👉 **Unggah minimal 3 foto kegiatan terbaik sekolah Anda hari ini:**
https://schoolpro.id/admin/settings

Salam Sukses,
Tim SchoolPro`
  },
  {
    dayOffset: 8,
    title: "Hari 8: Berita & Agenda",
    subject: "Satu Tanda Utama Bahwa {{schoolName}} Adalah Sekolah yang 'Hidup'",
    content: `Halo Bapak/Ibu Admin {{schoolName}},

Selamat! Anda telah mencapai hari terakhir dari rangkaian edukasi digital SchoolPro.

Satu tips terakhir yang sangat krusial: "Website yang tidak pernah di-update akan dianggap sebagai sekolah yang tutup atau tidak aktif."

Biasakan untuk menulis berita kegiatan atau mempublikasikan agenda akademik secara rutin. Ini menunjukkan transparansi dan keaktifan {{schoolName}} kepada publik. Jadikan website sekolah sebagai pusat informasi terpercaya!

👉 **Tulis artikel atau berita pertama Anda sekarang:**
https://schoolpro.id/admin/settings

Terima kasih telah bersama SchoolPro dalam memajukan digitalisasi pendidikan Indonesia!

Salam Hangat,
Tim SchoolPro Indonesia`
  }
]

async function main() {
  for (const c of NEW_CAMPAIGNS) {
    const existing = await prisma.dripCampaign.findFirst({ where: { dayOffset: c.dayOffset } })
    if (existing) {
      await prisma.dripCampaign.update({
        where: { id: existing.id },
        data: { title: c.title, subject: c.subject, content: c.content }
      })
      console.log('Updated day', c.dayOffset)
    }
  }
  console.log('Done')
}

main().catch(console.error).finally(() => prisma.$disconnect())
