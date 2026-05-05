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
    console.log('Created Events');
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
    console.log('Created Pengumuman');
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
    console.log('Created Berita');
  }

  // Also set the principal welcome settings for demo tenant
  const settings = tenant.settings || {};
  settings.principalName = "Ir. Sherly Puspita, M.Pd";
  settings.principalTitle = "Kepala Sekolah";
  settings.principalMessage = "Puji syukur ke hadirat Tuhan YME atas segala rahmat dan karunia-Nya. Selamat datang di website resmi demo kami.\n\nMelalui media ini, kami berharap seluruh informasi mengenai kegiatan, prestasi, serta program pendidikan dapat tersampaikan secara transparan, cepat, dan akurat.";
  
  await prisma.tenant.update({
    where: { id: tenantId },
    data: { settings }
  });

  console.log('Seeded successfully');
}
main().catch(console.error).finally(() => prisma.$disconnect());
