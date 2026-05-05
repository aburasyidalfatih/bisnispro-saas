import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { invalidatePublicTenantCache } from "@/lib/services/tenant-public"

// Temporary seeder endpoint — run once then remove
// Usage: POST /api/seed-demo with header X-Seed-Key matching env SEED_SECRET_KEY
export async function POST(req: Request) {
  // Simple security: require a secret key
  const seedKey = req.headers.get("x-seed-key")
  const expectedKey = process.env.SEED_SECRET_KEY || "schoolpro-seed-2026"
  
  if (seedKey !== expectedKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const tenant = await db.tenant.findUnique({ where: { slug: "demo" } })
  if (!tenant) {
    return NextResponse.json({ error: "Demo tenant not found" }, { status: 404 })
  }

  const tenantId = tenant.id
  const results: string[] = []

  // Seed Programs
  const existingPrograms = await db.program.count({ where: { tenantId } })
  if (existingPrograms === 0) {
    await db.program.createMany({
      data: [
        { tenantId, name: "Teknik Komputer & Jaringan", description: "Mempelajari instalasi, konfigurasi, dan troubleshooting jaringan komputer serta perangkat keras." },
        { tenantId, name: "Rekayasa Perangkat Lunak", description: "Membekali siswa dengan kemampuan pemrograman, pengembangan aplikasi web dan mobile." },
        { tenantId, name: "Multimedia & Desain Grafis", description: "Menguasai desain grafis, animasi, videografi, dan produksi konten digital kreatif." },
        { tenantId, name: "Akuntansi & Keuangan", description: "Kompetensi di bidang pembukuan, perpajakan, dan pengelolaan keuangan perusahaan." },
        { tenantId, name: "Administrasi Perkantoran", description: "Mengelola administrasi kantor modern, korespondensi, dan kearsipan digital." },
        { tenantId, name: "Keperawatan & Kesehatan", description: "Memberikan dasar ilmu keperawatan dan keterampilan medis untuk karir di bidang kesehatan." },
      ],
    })
    results.push("✅ Created 6 Programs")
  } else {
    results.push(`⏭️ Programs already exist (${existingPrograms})`)
  }

  // Seed Achievements
  const existingAchievements = await db.achievement.count({ where: { tenantId } })
  if (existingAchievements === 0) {
    await db.achievement.createMany({
      data: [
        { tenantId, title: "Juara 1 Olimpiade Sains Nasional", description: "Siswa meraih emas di bidang Fisika pada ajang OSN tingkat nasional.", date: new Date("2026-03-15"), level: "NASIONAL" },
        { tenantId, title: "Juara 2 Lomba Robotika Regional", description: "Tim robotik sekolah berhasil meraih perak pada kompetisi robot line follower.", date: new Date("2026-02-20"), level: "PROVINSI" },
        { tenantId, title: "Best Presentation ASEAN Youth Summit", description: "Delegasi sekolah tampil sebagai presenter terbaik di forum pemuda ASEAN.", date: new Date("2026-01-10"), level: "INTERNASIONAL" },
        { tenantId, title: "Juara 1 MTQ Tingkat Kota", description: "Meraih juara umum pada Musabaqah Tilawatil Quran tingkat kota.", date: new Date("2025-12-05"), level: "KABUPATEN" },
        { tenantId, title: "Juara 3 LKS Multimedia Provinsi", description: "Siswa berprestasi di ajang Lomba Kompetensi Siswa bidang multimedia.", date: new Date("2025-11-18"), level: "PROVINSI" },
        { tenantId, title: "Sekolah Adiwiyata Mandiri", description: "Penghargaan dari Kementerian Lingkungan Hidup untuk sekolah berwawasan lingkungan.", date: new Date("2025-10-01"), level: "NASIONAL" },
      ],
    })
    results.push("✅ Created 6 Achievements")
  } else {
    results.push(`⏭️ Achievements already exist (${existingAchievements})`)
  }

  // Seed Facilities
  const existingFacilities = await db.facility.count({ where: { tenantId } })
  if (existingFacilities === 0) {
    await db.facility.createMany({
      data: [
        { tenantId, name: "Laboratorium Komputer", description: "Dilengkapi 40 unit PC terbaru dengan koneksi internet fiber optic." },
        { tenantId, name: "Perpustakaan Digital", description: "Koleksi 10.000+ buku fisik dan akses e-library nasional." },
        { tenantId, name: "Masjid Sekolah", description: "Masjid 2 lantai dengan kapasitas 500 jamaah untuk kegiatan ibadah dan keagamaan." },
        { tenantId, name: "Lapangan Olahraga", description: "Lapangan serbaguna untuk futsal, basket, voli, dan badminton." },
        { tenantId, name: "Ruang Multimedia", description: "Studio produksi lengkap dengan green screen, kamera, dan editing station." },
        { tenantId, name: "Kantin Sehat", description: "Kantin dengan menu terstandar gizi dan area makan yang nyaman." },
        { tenantId, name: "Laboratorium Sains", description: "Lab IPA lengkap untuk praktikum fisika, kimia, dan biologi." },
        { tenantId, name: "Ruang UKS", description: "Unit Kesehatan Sekolah dengan perawat profesional dan obat-obatan standar." },
      ],
    })
    results.push("✅ Created 8 Facilities")
  } else {
    results.push(`⏭️ Facilities already exist (${existingFacilities})`)
  }

  // Seed Extracurriculars
  const existingEkskul = await db.extracurricular.count({ where: { tenantId } })
  if (existingEkskul === 0) {
    await db.extracurricular.createMany({
      data: [
        { tenantId, name: "Pramuka", description: "Kegiatan kepanduan untuk membentuk karakter dan jiwa kepemimpinan.", schedule: "Sabtu, 14:00-16:00" },
        { tenantId, name: "Robotika", description: "Belajar merakit dan memprogram robot untuk berbagai kompetisi.", schedule: "Rabu, 15:00-17:00" },
        { tenantId, name: "Tahfizh Al-Quran", description: "Program menghafal Al-Quran dengan metode mutqin.", schedule: "Senin-Jumat, 06:30-07:30" },
        { tenantId, name: "English Club", description: "Pelatihan conversation, debate, dan public speaking dalam bahasa Inggris.", schedule: "Selasa, 15:00-16:30" },
        { tenantId, name: "Futsal", description: "Latihan dan pembinaan tim futsal sekolah.", schedule: "Kamis, 15:00-17:00" },
        { tenantId, name: "Seni Kaligrafi", description: "Mempelajari seni menulis indah kaligrafi Arab.", schedule: "Jumat, 14:00-15:30" },
        { tenantId, name: "Jurnalistik", description: "Menulis berita, fotografi, dan mengelola media sekolah.", schedule: "Rabu, 15:00-16:30" },
        { tenantId, name: "Palang Merah Remaja", description: "Pelatihan pertolongan pertama dan kegiatan kemanusiaan.", schedule: "Sabtu, 08:00-10:00" },
      ],
    })
    results.push("✅ Created 8 Extracurriculars")
  } else {
    results.push(`⏭️ Extracurriculars already exist (${existingEkskul})`)
  }

  // Seed Staff
  const existingStaff = await db.staff.count({ where: { tenantId } })
  if (existingStaff === 0) {
    await db.staff.createMany({
      data: [
        { tenantId, name: "Andriko, M.Pd", role: "Kepala Sekolah", sortOrder: 1 },
        { tenantId, name: "Dr. Siti Aminah, M.Si", role: "Wakil Kepala Kurikulum", sortOrder: 2 },
        { tenantId, name: "Ahmad Fauzi, S.Pd", role: "Wakil Kepala Kesiswaan", sortOrder: 3 },
        { tenantId, name: "Rina Wulandari, M.Kom", role: "Ketua Program TKJ", sortOrder: 4 },
        { tenantId, name: "Budi Santoso, S.T", role: "Ketua Program RPL", sortOrder: 5 },
        { tenantId, name: "Dewi Lestari, S.Pd", role: "Guru Bahasa Inggris", sortOrder: 6 },
        { tenantId, name: "Hendra Wijaya, M.Pd", role: "Guru Matematika", sortOrder: 7 },
        { tenantId, name: "Nurul Hidayah, S.Pd.I", role: "Guru Pendidikan Agama", sortOrder: 8 },
      ],
    })
    results.push("✅ Created 8 Staff")
  } else {
    results.push(`⏭️ Staff already exist (${existingStaff})`)
  }

  // Seed Alumni
  const existingAlumni = await db.alumni.count({ where: { tenantId } })
  if (existingAlumni === 0) {
    await db.alumni.createMany({
      data: [
        { tenantId, name: "Muhammad Rizki Pratama", graduationYear: 2023, currentStatus: "KULIAH", institutionName: "Institut Teknologi Bandung (ITB)", testimonial: "Belajar di sini membentuk karakter dan disiplin saya. Program TKJ yang saya ikuti sangat membantu saya masuk jurusan Teknik Informatika di ITB. Guru-gurunya sangat kompeten dan selalu mendukung." },
        { tenantId, name: "Aisyah Putri Ramadhani", graduationYear: 2022, currentStatus: "KERJA", institutionName: "PT Telkom Indonesia", testimonial: "Sekolah ini memberikan pondasi kuat, baik secara akademik maupun karakter. Saya bangga menjadi alumni dan sekarang berkarir di perusahaan BUMN. Terima kasih atas bimbingan seluruh guru." },
        { tenantId, name: "Fajar Nugroho", graduationYear: 2021, currentStatus: "WIRAUSAHA", institutionName: "Founder CV Digital Nusantara", testimonial: "Pembelajaran di program RPL sangat aplikatif. Saya mulai membangun startup digital sejak lulus dan kini telah melayani puluhan klien. Semua bermula dari skill yang diajarkan di sini." },
        { tenantId, name: "Sinta Dewi Anggraini", graduationYear: 2024, currentStatus: "KULIAH", institutionName: "Universitas Gadjah Mada (UGM)", testimonial: "Lingkungan sekolah yang islami dan modern membuat saya berkembang. Kegiatan ekstrakurikuler dan olimpiade membantu saya mendapat beasiswa penuh di UGM." },
      ],
    })
    results.push("✅ Created 4 Alumni with Testimonials")
  } else {
    results.push(`⏭️ Alumni already exist (${existingAlumni})`)
  }

  // Invalidate cache so the website shows fresh data
  await invalidatePublicTenantCache("demo")

  return NextResponse.json({ success: true, results })
}
