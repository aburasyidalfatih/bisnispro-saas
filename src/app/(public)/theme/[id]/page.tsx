import { notFound } from "next/navigation"
import { db } from "@/lib/db"
import { renderCustomTheme } from "@/app/site/[slug]/_themes/custom-renderer"

export const dynamic = "force-dynamic"

export default async function ThemeDemoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const theme = await db.customTheme.findUnique({ where: { id } })
  if (!theme) notFound()

  // Dummy Data for Preview
  const tenant = {
    name: "Sekolah Demo SchoolPro",
    tagline: "Pendidikan Berkualitas untuk Masa Depan",
    about: "Ini adalah teks preview untuk deskripsi sekolah. Sekolah kami berdedikasi untuk memberikan pendidikan terbaik bagi siswa-siswi.",
    address: "Jl. Pendidikan No. 123, Kota Demo",
    phone: "021-12345678",
    email: "info@sekolahdemo.id",
    whatsapp: "6281234567890",
    logo: "https://ui-avatars.com/api/?name=SD&background=4F46E5&color=fff",
    slug: "demo",
    template: "custom",
    settings: {
      principalName: "Bpk. Budi Santoso, M.Pd",
      principalTitle: "Kepala Sekolah",
      principalMessage: "Selamat datang di website demo kami. Semoga website ini dapat memberikan informasi yang bermanfaat.",
      establishedYear: "1990",
      visi: "Menjadi sekolah unggulan berprestasi",
      misi: "1. Meningkatkan mutu<br>2. Membangun karakter",
      npsn: "12345678",
      akreditasi: "A (Unggul)",
      studentCount: "1250"
    },
    staff: [
      { name: "Siti Aminah", role: "Guru Matematika" },
      { name: "Ahmad Dahlan", role: "Guru IPA" },
      { name: "Budi Santoso", role: "Guru Bahasa" },
      { name: "Dewi Lestari", role: "Guru Kesenian" },
      { name: "Rudi Heryanto", role: "Guru Olahraga" }
    ],
    programs: [
      { name: "Bilingual Class", description: "Kelas dengan pengantar bahasa Inggris." },
      { name: "Tahfidz Quran", description: "Program hafalan Al-Quran." },
      { name: "Science Club", description: "Ekskul sains intensif." }
    ],
    facilities: [
      { name: "Perpustakaan", description: "Koleksi buku lengkap.", category: "Akademik" },
      { name: "Laboratorium Komputer", description: "Fasilitas komputer modern.", category: "Praktik" },
      { name: "Lapangan Olahraga", description: "Fasilitas olahraga standar nasional.", category: "Olahraga" }
    ],
    posts: [
      { title: "Penerimaan Siswa Baru Tahun Ajaran Depan", excerpt: "Informasi lengkap mengenai PPDB.", slug: "ppdb-info", category: { name: "Pengumuman" }, createdAt: new Date() },
      { title: "Prestasi Juara 1 Olimpiade Sains", excerpt: "Siswa kami berhasil meraih medali emas.", slug: "juara-olimpiade", category: { name: "Prestasi" }, createdAt: new Date() },
      { title: "Kegiatan Class Meeting Semester Ganjil", excerpt: "Keseruan lomba antar kelas.", slug: "class-meeting", category: { name: "Kegiatan" }, createdAt: new Date() }
    ],
    achievements: [
      { title: "Juara 1 Lomba Pidato Tingkat Provinsi", level: "Provinsi", description: "Juara 1 Lomba Pidato Tingkat Provinsi" },
      { title: "Medali Emas Olimpiade Matematika", level: "Nasional", description: "Medali Emas Olimpiade Matematika Tingkat Nasional" },
      { title: "Sekolah Adiwiyata Tingkat Nasional", level: "Nasional", description: "Penghargaan Lingkungan Hidup" }
    ],
    gallery: [
      { url: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=800&auto=format&fit=crop", caption: "Gedung Sekolah" },
      { url: "https://images.unsplash.com/photo-1577896851231-70ef18881754?q=80&w=800&auto=format&fit=crop", caption: "Kegiatan Belajar" },
      { url: "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?q=80&w=800&auto=format&fit=crop", caption: "Upacara Bendera" },
      { url: "https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=800&auto=format&fit=crop", caption: "Laboratorium" }
    ],
    partnerships: [
      { name: "Universitas Terkemuka" },
      { name: "Perusahaan Teknologi" }
    ],
    alumni: [
      { name: "Andi Saputra", graduationYear: "2015", testimonial: "Sekolah ini memberikan fondasi yang kuat bagi karir saya.", currentPosition: "Software Engineer" },
      { name: "Budi Santoso", graduationYear: "2018", testimonial: "Saya sangat bersyukur pernah belajar di sekolah ini.", currentPosition: "Dokter" }
    ]
  }

  const base = `/theme/${id}`
  const gallery = tenant.gallery
  const stats = [
    { value: "45+", label: "Tenaga Pendidik", icon: "users" },
    { value: "3", label: "Program Unggulan", icon: "book" },
    { value: "50+", label: "Prestasi Diraih", icon: "award" },
    { value: "1990", label: "Tahun Berdiri", icon: "clock" },
  ]

  const rendered = renderCustomTheme({
    templateHtml: theme.indexHtml,
    layoutHtml: theme.layoutHtml,
    customCss: theme.customCss,
    customJs: theme.customJs,
    context: { tenant, base, gallery, stats, settings: tenant.settings },
  })

  if (rendered) return (
    <>
      <div className="fixed top-0 left-0 right-0 z-[100] bg-indigo-600 text-white p-2 text-center text-sm shadow-md font-medium">
        Ini adalah Halaman Demo (Preview) untuk Tema <strong>{theme.name}</strong>. Data yang ditampilkan adalah contoh.
      </div>
      <div className="pt-10">
        {rendered}
      </div>
    </>
  )
  
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-red-600">Gagal Merender Tema</h1>
        <p className="text-gray-500 mt-2">Tema ini mungkin memiliki syntax Handlebars yang tidak valid.</p>
      </div>
    </div>
  )
}
