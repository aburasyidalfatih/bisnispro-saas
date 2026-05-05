const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const tenant = await prisma.tenant.findUnique({ where: { slug: 'demo' } });
  if (!tenant) {
    console.log('Demo tenant not found');
    return;
  }
  const tenantId = tenant.id;
  const user = await prisma.user.findFirst({ where: { isSuperAdmin: true } });
  const authorId = user?.id || 'cl0xxxxx00000xxxx';

  // Check if events already exist
  const existingEvents = await prisma.event.count({ where: { tenantId } });
  if (existingEvents === 0) {
    await prisma.event.createMany({
      data: [
        { tenantId, title: 'Seminar Parenting Islami', startDate: new Date('2026-05-20T08:00:00Z'), endDate: new Date('2026-05-20T12:00:00Z'), location: 'Aula Utama' },
        { tenantId, title: 'Tes Tahfiz Al-Qur\'an Juz 30', startDate: new Date('2026-05-25T08:00:00Z'), endDate: new Date('2026-05-25T11:00:00Z'), location: 'Masjid Sekolah' },
        { tenantId, title: 'Ujian Kenaikan Kelas 2024/2025', startDate: new Date('2026-06-02T07:30:00Z'), endDate: new Date('2026-06-02T12:00:00Z'), location: 'Ruang Kelas' },
        { tenantId, title: 'Pembagian Rapor Genap', startDate: new Date('2026-06-15T08:00:00Z'), endDate: new Date('2026-06-15T10:00:00Z'), location: 'Aula Utama' },
      ]
    });
    console.log('✅ Created Events');
  }

  // Create Posts (Pengumuman)
  const existingPengumuman = await prisma.post.count({ where: { tenantId, type: 'PENGUMUMAN' } });
  if (existingPengumuman === 0) {
    await prisma.post.createMany({
      data: [
        { tenantId, authorId, slug: 'ppdb-2024', title: 'Pendaftaran PPDB 2024/2025 Resmi Dibuka', content: 'Dapatkan Potongan Biaya Pendaftaran dan gratis seragam...', type: 'PENGUMUMAN', status: 'PUBLISHED' },
        { tenantId, authorId, slug: 'hasil-evaluasi', title: 'Pengumuman Hasil Evaluasi Akhir', content: 'Hasil evaluasi pembelajaran semester ganjil dapat dilihat...', type: 'PENGUMUMAN', status: 'PUBLISHED' },
        { tenantId, authorId, slug: 'isra-miraj', title: 'Isra\' Mi\'raj Akbar', content: 'Kegiatan peringatan Isra\' Mi\'raj akan diadakan secara...', type: 'PENGUMUMAN', status: 'PUBLISHED' },
        { tenantId, authorId, slug: 'munaqosah', title: 'Kegiatan Munaqosah & Tasmi\' Al-Qur\'an', content: 'Santri kelas 6 mengikuti munaqosah hafalan Al-Qur\'an...', type: 'PENGUMUMAN', status: 'PUBLISHED' },
      ]
    });
    console.log('✅ Created Pengumuman');
  }

  // Create Posts (Artikel)
  const existingBerita = await prisma.post.count({ where: { tenantId, type: 'BERITA' } });
  if (existingBerita === 0) {
    await prisma.post.createMany({
      data: [
        { tenantId, authorId, slug: 'kemah-santri', title: 'Perkemahan Santri Baru Gelombang 1 Telah Dibuka', content: 'Info kemah...', featuredImage: 'https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?w=800', type: 'BERITA', status: 'PUBLISHED' },
        { tenantId, authorId, slug: 'kunjungan-edukatif', title: 'Kunjungan Edukatif ke Museum Sejarah Islam', content: 'Info kunjungan...', featuredImage: 'https://images.unsplash.com/photo-1544928147-79a2dbc1f389?w=800', type: 'BERITA', status: 'PUBLISHED' },
        { tenantId, authorId, slug: 'workshop-guru', title: 'Workshop Teknologi Pembelajaran untuk Guru', content: 'Info workshop...', featuredImage: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800', type: 'BERITA', status: 'PUBLISHED' },
        { tenantId, authorId, slug: 'santri-juara', title: 'Santri Raih Juara Olimpiade Tingkat Provinsi', content: 'Info juara...', featuredImage: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800', type: 'BERITA', status: 'PUBLISHED' },
      ]
    });
    console.log('✅ Created Berita');
  }

  // ═══════════════════════════════════════════════════════════════
  // NEW: Seed Programs
  // ═══════════════════════════════════════════════════════════════
  const existingPrograms = await prisma.program.count({ where: { tenantId } });
  if (existingPrograms === 0) {
    await prisma.program.createMany({
      data: [
        { tenantId, name: 'Teknik Komputer & Jaringan', description: 'Mempelajari instalasi, konfigurasi, dan troubleshooting jaringan komputer serta perangkat keras.' },
        { tenantId, name: 'Rekayasa Perangkat Lunak', description: 'Membekali siswa dengan kemampuan pemrograman, pengembangan aplikasi web dan mobile.' },
        { tenantId, name: 'Multimedia & Desain Grafis', description: 'Menguasai desain grafis, animasi, videografi, dan produksi konten digital kreatif.' },
        { tenantId, name: 'Akuntansi & Keuangan', description: 'Kompetensi di bidang pembukuan, perpajakan, dan pengelolaan keuangan perusahaan.' },
        { tenantId, name: 'Administrasi Perkantoran', description: 'Mengelola administrasi kantor modern, korespondensi, dan kearsipan digital.' },
        { tenantId, name: 'Keperawatan & Kesehatan', description: 'Memberikan dasar ilmu keperawatan dan keterampilan medis untuk karir di bidang kesehatan.' },
      ]
    });
    console.log('✅ Created Programs');
  }

  // ═══════════════════════════════════════════════════════════════
  // NEW: Seed Achievements
  // ═══════════════════════════════════════════════════════════════
  const existingAchievements = await prisma.achievement.count({ where: { tenantId } });
  if (existingAchievements === 0) {
    await prisma.achievement.createMany({
      data: [
        { tenantId, title: 'Juara 1 Olimpiade Sains Nasional', description: 'Siswa meraih emas di bidang Fisika pada ajang OSN tingkat nasional.', date: new Date('2026-03-15'), level: 'NASIONAL' },
        { tenantId, title: 'Juara 2 Lomba Robotika Regional', description: 'Tim robotik sekolah berhasil meraih perak pada kompetisi robot line follower.', date: new Date('2026-02-20'), level: 'PROVINSI' },
        { tenantId, title: 'Best Presentation ASEAN Youth Summit', description: 'Delegasi sekolah tampil sebagai presenter terbaik di forum pemuda ASEAN.', date: new Date('2026-01-10'), level: 'INTERNASIONAL' },
        { tenantId, title: 'Juara 1 MTQ Tingkat Kota', description: 'Meraih juara umum pada Musabaqah Tilawatil Quran tingkat kota.', date: new Date('2025-12-05'), level: 'KABUPATEN' },
        { tenantId, title: 'Juara 3 LKS Multimedia Provinsi', description: 'Siswa berprestasi di ajang Lomba Kompetensi Siswa bidang multimedia.', date: new Date('2025-11-18'), level: 'PROVINSI' },
        { tenantId, title: 'Sekolah Adiwiyata Mandiri', description: 'Penghargaan dari Kementerian Lingkungan Hidup untuk sekolah berwawasan lingkungan.', date: new Date('2025-10-01'), level: 'NASIONAL' },
      ]
    });
    console.log('✅ Created Achievements');
  }

  // ═══════════════════════════════════════════════════════════════
  // NEW: Seed Facilities
  // ═══════════════════════════════════════════════════════════════
  const existingFacilities = await prisma.facility.count({ where: { tenantId } });
  if (existingFacilities === 0) {
    await prisma.facility.createMany({
      data: [
        { tenantId, name: 'Laboratorium Komputer', description: 'Dilengkapi 40 unit PC terbaru dengan koneksi internet fiber optic.' },
        { tenantId, name: 'Perpustakaan Digital', description: 'Koleksi 10.000+ buku fisik dan akses e-library nasional.' },
        { tenantId, name: 'Masjid Sekolah', description: 'Masjid 2 lantai dengan kapasitas 500 jamaah untuk kegiatan ibadah dan keagamaan.' },
        { tenantId, name: 'Lapangan Olahraga', description: 'Lapangan serbaguna untuk futsal, basket, voli, dan badminton.' },
        { tenantId, name: 'Ruang Multimedia', description: 'Studio produksi lengkap dengan green screen, kamera, dan editing station.' },
        { tenantId, name: 'Kantin Sehat', description: 'Kantin dengan menu terstandar gizi dan area makan yang nyaman.' },
        { tenantId, name: 'Laboratorium Sains', description: 'Lab IPA lengkap untuk praktikum fisika, kimia, dan biologi.' },
        { tenantId, name: 'Ruang UKS', description: 'Unit Kesehatan Sekolah dengan perawat profesional dan obat-obatan standar.' },
      ]
    });
    console.log('✅ Created Facilities');
  }

  // ═══════════════════════════════════════════════════════════════
  // NEW: Seed Extracurriculars
  // ═══════════════════════════════════════════════════════════════
  const existingEkskul = await prisma.extracurricular.count({ where: { tenantId } });
  if (existingEkskul === 0) {
    await prisma.extracurricular.createMany({
      data: [
        { tenantId, name: 'Pramuka', description: 'Kegiatan kepanduan untuk membentuk karakter dan jiwa kepemimpinan.', schedule: 'Sabtu, 14:00-16:00' },
        { tenantId, name: 'Robotika', description: 'Belajar merakit dan memprogram robot untuk berbagai kompetisi.', schedule: 'Rabu, 15:00-17:00' },
        { tenantId, name: 'Tahfizh Al-Quran', description: 'Program menghafal Al-Quran dengan metode mutqin.', schedule: 'Senin-Jumat, 06:30-07:30' },
        { tenantId, name: 'English Club', description: 'Pelatihan conversation, debate, dan public speaking dalam bahasa Inggris.', schedule: 'Selasa, 15:00-16:30' },
        { tenantId, name: 'Futsal', description: 'Latihan dan pembinaan tim futsal sekolah.', schedule: 'Kamis, 15:00-17:00' },
        { tenantId, name: 'Seni Kaligrafi', description: 'Mempelajari seni menulis indah kaligrafi Arab.', schedule: 'Jumat, 14:00-15:30' },
        { tenantId, name: 'Jurnalistik', description: 'Menulis berita, fotografi, dan mengelola media sekolah.', schedule: 'Rabu, 15:00-16:30' },
        { tenantId, name: 'Palang Merah Remaja', description: 'Pelatihan pertolongan pertama dan kegiatan kemanusiaan.', schedule: 'Sabtu, 08:00-10:00' },
      ]
    });
    console.log('✅ Created Extracurriculars');
  }

  // ═══════════════════════════════════════════════════════════════
  // NEW: Seed Staff / GTK
  // ═══════════════════════════════════════════════════════════════
  const existingStaff = await prisma.staff.count({ where: { tenantId } });
  if (existingStaff === 0) {
    await prisma.staff.createMany({
      data: [
        { tenantId, name: 'Andriko, M.Pd', role: 'Kepala Sekolah', sortOrder: 1 },
        { tenantId, name: 'Dr. Siti Aminah, M.Si', role: 'Wakil Kepala Kurikulum', sortOrder: 2 },
        { tenantId, name: 'Ahmad Fauzi, S.Pd', role: 'Wakil Kepala Kesiswaan', sortOrder: 3 },
        { tenantId, name: 'Rina Wulandari, M.Kom', role: 'Ketua Program TKJ', sortOrder: 4 },
        { tenantId, name: 'Budi Santoso, S.T', role: 'Ketua Program RPL', sortOrder: 5 },
        { tenantId, name: 'Dewi Lestari, S.Pd', role: 'Guru Bahasa Inggris', sortOrder: 6 },
        { tenantId, name: 'Hendra Wijaya, M.Pd', role: 'Guru Matematika', sortOrder: 7 },
        { tenantId, name: 'Nurul Hidayah, S.Pd.I', role: 'Guru Pendidikan Agama', sortOrder: 8 },
      ]
    });
    console.log('✅ Created Staff');
  }

  // ═══════════════════════════════════════════════════════════════
  // NEW: Seed Alumni (with testimonials)
  // ═══════════════════════════════════════════════════════════════
  const existingAlumni = await prisma.alumni.count({ where: { tenantId } });
  if (existingAlumni === 0) {
    await prisma.alumni.createMany({
      data: [
        {
          tenantId,
          name: 'Muhammad Rizki Pratama',
          graduationYear: 2023,
          currentStatus: 'KULIAH',
          institutionName: 'Institut Teknologi Bandung (ITB)',
          testimonial: 'Belajar di sini membentuk karakter dan disiplin saya. Program TKJ yang saya ikuti sangat membantu saya masuk jurusan Teknik Informatika di ITB. Guru-gurunya sangat kompeten dan selalu mendukung.',
        },
        {
          tenantId,
          name: 'Aisyah Putri Ramadhani',
          graduationYear: 2022,
          currentStatus: 'KERJA',
          institutionName: 'PT Telkom Indonesia',
          testimonial: 'Sekolah ini memberikan pondasi kuat, baik secara akademik maupun karakter. Saya bangga menjadi alumni dan sekarang berkarir di perusahaan BUMN. Terima kasih atas bimbingan seluruh guru.',
        },
        {
          tenantId,
          name: 'Fajar Nugroho',
          graduationYear: 2021,
          currentStatus: 'WIRAUSAHA',
          institutionName: 'Founder CV Digital Nusantara',
          testimonial: 'Pembelajaran di program RPL sangat aplikatif. Saya mulai membangun startup digital sejak lulus dan kini telah melayani puluhan klien. Semua bermula dari skill yang diajarkan di sini.',
        },
        {
          tenantId,
          name: 'Sinta Dewi Anggraini',
          graduationYear: 2024,
          currentStatus: 'KULIAH',
          institutionName: 'Universitas Gadjah Mada (UGM)',
          testimonial: 'Lingkungan sekolah yang islami dan modern membuat saya berkembang. Kegiatan ekstrakurikuler dan olimpiade membantu saya mendapat beasiswa penuh di UGM.',
        },
      ]
    });
    console.log('✅ Created Alumni with Testimonials');
  }

  // Also set the principal welcome settings for demo tenant
  const settings = tenant.settings || {};
  settings.principalName = "Andriko, M.Pd";
  settings.principalTitle = "Kepala Sekolah";
  settings.principalMessage = "Puji syukur ke hadirat Tuhan YME atas segala rahmat dan karunia-Nya. Selamat datang di website resmi demo kami.\n\nMelalui media ini, kami berharap seluruh informasi mengenai kegiatan, prestasi, serta program pendidikan dapat tersampaikan secara transparan, cepat, dan akurat.";
  
  await prisma.tenant.update({
    where: { id: tenantId },
    data: { settings }
  });

  console.log('\n🎉 All demo data seeded successfully!');
}
main().catch(console.error).finally(() => prisma.$disconnect());
