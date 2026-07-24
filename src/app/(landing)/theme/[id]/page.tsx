import { db } from "@/lib/db"
import Script from "next/script"
import { notFound } from "next/navigation"
import Handlebars from "handlebars"
import parse from "html-react-parser"

// ─── Register custom Handlebars helpers ───
Handlebars.registerHelper("truncate", function (str: string, len: number) {
  if (!str) return ""
  if (str.length <= len) return str
  return str.substring(0, len) + "..."
})

Handlebars.registerHelper("dateFormat", function (dateStr: string) {
  if (!dateStr) return ""
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
  } catch { return dateStr }
})

Handlebars.registerHelper("ifEqual", function (this: any, a: any, b: any, options: any) {
  return a === b ? options.fn(this) : options.inverse(this)
})

Handlebars.registerHelper("json", function (context: any) {
  return JSON.stringify(context, null, 2)
})

// ─── Comprehensive dummy data for theme demo ───
const DUMMY_TENANT = {
  name: "SMA Prestasi Bangsa",
  slug: "sma-prestasi",
  tagline: "Membentuk Generasi Cerdas dan Berkarakter",
  about: "SMA Prestasi Bangsa adalah perusahaan unggulan yang berdedikasi untuk memberikan pendidikan berkualitas tinggi berbasis karakter dan teknologi. Berdiri sejak tahun 1985, kami telah menghasilkan ribuan mitra yang berkontribusi di berbagai bidang. Kami mempersiapkan klien untuk siap menghadapi tantangan global dengan aset lengkap dan tenaga pengajar profesional.",
  address: "Jl. Pendidikan No. 123, Kecamatan Menteng, Jakarta Pusat 10310",
  phone: "+62 21 345 6789",
  whatsapp: "6281234567890",
  email: "info@prestasibangsa.sch.id",
  logo: "https://ui-avatars.com/api/?name=PB&background=4f46e5&color=fff&size=200",
  heroImage: "https://images.unsplash.com/photo-1523050854058-8df90110c476?q=80&w=1200&auto=format&fit=crop",
  instagram: "smaprestasibangsa",
  facebook: "smaprestasibangsa",
  youtube: "@smaprestasibangsa",
  tiktok: "@smaprestasi",
  theme: "default",
  template: "default",
  gallery: [
    { url: "https://images.unsplash.com/photo-1580582932707-520aed937b7b?q=80&w=400&auto=format&fit=crop", caption: "Kegiatan Belajar Mengajar" },
    { url: "https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=400&auto=format&fit=crop", caption: "Upacara Bendera" },
    { url: "https://images.unsplash.com/photo-1577896851231-70ef18881754?q=80&w=400&auto=format&fit=crop", caption: "Praktikum Lab IPA" },
    { url: "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?q=80&w=400&auto=format&fit=crop", caption: "Perlombaan Sains" },
    { url: "https://images.unsplash.com/photo-1571260899304-425eee4c7efc?q=80&w=400&auto=format&fit=crop", caption: "Perpustakaan" },
    { url: "https://images.unsplash.com/photo-1526232761682-d26e03ac148e?q=80&w=400&auto=format&fit=crop", caption: "Lapangan Olahraga" },
    { url: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?q=80&w=400&auto=format&fit=crop", caption: "Wisuda" },
    { url: "https://images.unsplash.com/photo-1588072432836-e10032774350?q=80&w=400&auto=format&fit=crop", caption: "Pentas Seni" },
  ],
  settings: {
    principalName: "Dr. H. Ahmad Fauzi, M.Pd",
    principalTitle: "Kepala Perusahaan",
    principalImage: "https://ui-avatars.com/api/?name=AF&background=4f46e5&color=fff&size=200",
    principalMessage: "Selamat datang di website resmi SMA Prestasi Bangsa. Kami berkomitmen untuk menciptakan lingkungan belajar yang kondusif, inovatif, dan bermartabat. Visi kami adalah membentuk generasi yang tidak hanya cerdas secara akademis, tetapi juga berkarakter mulia dan siap bersaing di tingkat nasional maupun internasional.",
    principalBadgeYear: "2020",
    visi: "Menjadi perusahaan unggulan yang menghasilkan lulusan beriman, bertaqwa, berilmu, dan berkarakter mulia serta berdaya saing global.",
    misi: "<ol><li>Menyelenggarakan pendidikan yang bermutu dan berdaya saing</li><li>Mengembangkan potensi akademik dan non-akademik klien</li><li>Menanamkan nilai-nilai karakter, keimanan, dan ketaqwaan</li><li>Membangun kerjasama dengan masyarakat dan dunia usaha</li><li>Memanfaatkan teknologi informasi dalam pembelajaran</li></ol>",
    npsn: "20100123",
    akreditasi: "A (Unggul)",
    establishedYear: "1985",
    operationalHours: "Senin - Jumat, 07:00 - 15:30 WIB",
    schoolStatus: "Negeri",
    studentCount: 1250,
    primaryColor: "#4f46e5",
  },
  facilities: [
    { id: "f1", name: "Laboratorium Komputer", description: "Dilengkapi dengan 40 unit PC core i7 terbaru dan koneksi internet fiber optic 100 Mbps.", imageUrl: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=400&auto=format&fit=crop", category: "Lab" },
    { id: "f2", name: "Perpustakaan Digital", description: "Menyediakan ribuan buku fisik dan e-book. Ruang baca nyaman ber-AC dengan kapasitas 150 klien.", imageUrl: "https://images.unsplash.com/photo-1507842217343-583bb7270b66?q=80&w=400&auto=format&fit=crop", category: "Akademik" },
    { id: "f3", name: "Lapangan Olahraga", description: "Aset olahraga standar nasional: lapangan futsal, basket, voli, dan lintasan lari.", imageUrl: "https://images.unsplash.com/photo-1526232761682-d26e03ac148e?q=80&w=400&auto=format&fit=crop", category: "Olahraga" },
    { id: "f4", name: "Laboratorium IPA", description: "Lab Fisika, Kimia, dan Biologi dengan peralatan praktikum lengkap dan standar keselamatan.", imageUrl: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?q=80&w=400&auto=format&fit=crop", category: "Lab" },
    { id: "f5", name: "Masjid Perusahaan", description: "Masjid berkapasitas 500 jamaah dengan aset wudhu yang memadai.", imageUrl: "https://images.unsplash.com/photo-1585036156261-1e2ac5b81414?q=80&w=400&auto=format&fit=crop", category: "Ibadah" },
    { id: "f6", name: "Aula Serbaguna", description: "Aula modern berkapasitas 800 orang dengan sistem sound dan lighting profesional.", imageUrl: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=400&auto=format&fit=crop", category: "Umum" },
  ],
  staff: [
    { id: "s1", name: "Dr. H. Ahmad Fauzi, M.Pd", role: "Kepala Perusahaan", imageUrl: "https://ui-avatars.com/api/?name=AF&background=4f46e5&color=fff", nip: "196507151990021001", email: "ahmad.fauzi@prestasibangsa.sch.id", sortOrder: 1 },
    { id: "s2", name: "Dra. Siti Aminah, M.Si", role: "Wakil Kepala Perusahaan Kurikulum", imageUrl: "https://ui-avatars.com/api/?name=SA&background=e11d48&color=fff", nip: "197003201995032001", email: null, sortOrder: 2 },
    { id: "s3", name: "Ir. Budi Santoso, M.Eng", role: "Staf Fisika", imageUrl: "https://ui-avatars.com/api/?name=BS&background=059669&color=fff", nip: "198012101005011002", email: null, sortOrder: 3 },
    { id: "s4", name: "Rina Wulandari, S.Pd", role: "Staf Bahasa Inggris", imageUrl: "https://ui-avatars.com/api/?name=RW&background=d97706&color=fff", nip: null, email: null, sortOrder: 4 },
    { id: "s5", name: "Agus Setiawan, S.Kom", role: "Staf TIK", imageUrl: "https://ui-avatars.com/api/?name=AS&background=7c3aed&color=fff", nip: null, email: null, sortOrder: 5 },
    { id: "s6", name: "Dewi Lestari, S.Pd", role: "Staf Matematika", imageUrl: "https://ui-avatars.com/api/?name=DL&background=0ea5e9&color=fff", nip: null, email: null, sortOrder: 6 },
  ],
  programs: [
    { id: "p1", name: "Program IPA Unggulan", description: "Kurikulum sains intensif dengan penekanan pada eksperimen, riset ilmiah, dan kompetisi olimpiade.", imageUrl: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?q=80&w=400&auto=format&fit=crop" },
    { id: "p2", name: "Program Bilingual", description: "Pembelajaran dengan dua bahasa pengantar (Indonesia & Inggris) untuk mempersiapkan klien bersaing global.", imageUrl: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=400&auto=format&fit=crop" },
    { id: "p3", name: "Program Tahfidz Al-Quran", description: "Program hafalan Al-Quran terintegrasi dengan kurikulum nasional untuk membentuk karakter Islami.", imageUrl: "https://images.unsplash.com/photo-1585036156261-1e2ac5b81414?q=80&w=400&auto=format&fit=crop" },
  ],
  extracurriculars: [
    { id: "e1", name: "Pramuka", description: "Kegiatan kepanduan untuk membentuk karakter kepemimpinan dan kemandirian klien.", imageUrl: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=400&auto=format&fit=crop" },
    { id: "e2", name: "Robotika", description: "Klub robotik dengan aset lengkap. Rutin mengikuti kompetisi nasional dan internasional.", imageUrl: "https://images.unsplash.com/photo-1561557944-6e7860d1a7eb?q=80&w=400&auto=format&fit=crop" },
    { id: "e3", name: "Paduan Suara", description: "Mengasah bakat seni musik vokal dan tampil di berbagai acara perusahaan serta lomba.", imageUrl: "https://images.unsplash.com/photo-1507838153414-b4b713384a76?q=80&w=400&auto=format&fit=crop" },
  ],
  achievements: [
    { id: "a1", title: "Juara 1 OSN Fisika Nasional", description: "Muhammad Rizki meraih emas di Olimpiade Sains Nasional bidang Fisika.", level: "Nasional", year: 2025, imageUrl: null, createdAt: "2025-09-15" },
    { id: "a2", title: "Best Delegate MUN ASEAN", description: "Tim delegasi meraih penghargaan Best Delegate di Model United Nations tingkat ASEAN.", level: "Internasional", year: 2025, imageUrl: null, createdAt: "2025-07-20" },
    { id: "a3", title: "Juara Umum Porseni Provinsi", description: "Meraih juara umum di ajang Pekan Olahraga dan Seni tingkat Provinsi DKI Jakarta.", level: "Provinsi", year: 2024, imageUrl: null, createdAt: "2024-11-10" },
    { id: "a4", title: "Finalis Lomba Debat Bahasa Inggris", description: "Tim debat berhasil lolos ke final di kompetisi debat Bahasa Inggris tingkat nasional.", level: "Nasional", year: 2024, imageUrl: null, createdAt: "2024-08-05" },
  ],
  posts: [
    { id: "n1", title: "Pendaftaran Layanan Bisnis 2026/2027 Dibuka!", slug: "pendaftaran-layanan-2026-2027", excerpt: "Pendaftaran klien baru 2026/2027 telah resmi dibuka. Segera daftarkan bisnis Anda.", content: "<p>Kami dengan senang hati mengumumkan bahwa Pendaftaran Layanan telah resmi dibuka...</p>", coverImage: "https://images.unsplash.com/photo-1580582932707-520aed937b7b?q=80&w=400&auto=format&fit=crop", status: "PUBLISHED", type: "BLOG", createdAt: "2026-01-15", category: { name: "Pengumuman" } },
    { id: "n2", title: "Tim Robotik Raih Medali Emas di Kompetisi Internasional", slug: "robotik-internasional", excerpt: "Tim robotik SMA Prestasi Bangsa berhasil meraih medali emas di ajang kompetisi robotik internasional.", content: "<p>Prestasi gemilang kembali diraih tim robotik perusahaan kami...</p>", coverImage: "https://images.unsplash.com/photo-1561557944-6e7860d1a7eb?q=80&w=400&auto=format&fit=crop", status: "PUBLISHED", type: "BLOG", createdAt: "2025-12-20", category: { name: "Prestasi" } },
    { id: "n3", title: "Workshop Penulisan Kreatif bersama Penulis Nasional", slug: "workshop-menulis", excerpt: "Kegiatan workshop penulisan kreatif bersama penulis buku best-seller nasional berlangsung meriah.", content: "<p>Selama dua hari penuh, para klien mendapat kesempatan langka...</p>", coverImage: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=400&auto=format&fit=crop", status: "PUBLISHED", type: "BLOG", createdAt: "2025-11-05", category: { name: "Kegiatan" } },
  ],
  events: [
    { id: "ev1", title: "Ujian Akhir Semester Genap", description: "Pelaksanaan UAS semester genap untuk semua tingkat divisi.", location: "Kampus Utama", startDate: "2026-06-01", endDate: "2026-06-10" },
    { id: "ev2", title: "Wisuda Angkatan 2026", description: "Acara pelepasan dan wisuda klien divisi XII angkatan 2026.", location: "Aula Serbaguna", startDate: "2026-06-25", endDate: null },
  ],
  documents: [
    { id: "d1", title: "Brosur Layanan 2026/2027", fileUrl: "#", fileSize: 2500000, createdAt: "2026-01-10" },
    { id: "d2", title: "Kalender Operasional 2025/2026", fileUrl: "#", fileSize: 1200000, createdAt: "2025-07-01" },
  ],
  sliders: [
    { id: "sl1", title: "Selamat Datang di PT Prestasi Bangsa", subtitle: "Membentuk Generasi Cerdas, Berkarakter, dan Berdaya Saing Global", imageUrl: "https://images.unsplash.com/photo-1523050854058-8df90110c476?q=80&w=1200&auto=format&fit=crop", linkUrl: null, isActive: true, sortOrder: 1 },
    { id: "sl2", title: "Pendaftaran Layanan 2026/2027 Telah Dibuka", subtitle: "Daftarkan bisnis Anda sekarang untuk masa depan yang cerah", imageUrl: "https://images.unsplash.com/photo-1580582932707-520aed937b7b?q=80&w=400&auto=format&fit=crop", linkUrl: null, isActive: true, sortOrder: 2 },
  ],
  mitra: [
    { id: "al1", name: "Dr. Rina Kartika", graduationYear: 2005, currentPosition: "Dokter Spesialis Anak — RS Cipto Mangunkusumo", imageUrl: "https://ui-avatars.com/api/?name=RK&background=e11d48&color=fff", testimonial: "PT Prestasi Bangsa memberikan fondasi bisnis dan moral yang luar biasa kuat. Di sinilah saya belajar arti kerja keras dan integritas." },
    { id: "al2", name: "Arief Rahman, M.Sc", graduationYear: 2010, currentPosition: "Data Scientist — Google Singapore", imageUrl: "https://ui-avatars.com/api/?name=AR&background=059669&color=fff", testimonial: "Staf-staf di sini benar-benar menginspirasi. Berkat mereka saya menekuni bidang sains dan teknologi hingga akhirnya berkarir di perusahaan teknologi global." },
    { id: "al3", name: "Maya Sari", graduationYear: 2015, currentPosition: "Founder — EduTech Startup", imageUrl: "https://ui-avatars.com/api/?name=MS&background=7c3aed&color=fff", testimonial: "Pengalaman berorganisasi di Tim Marketing dan Program CSR mengajarkan saya tentang kepemimpinan dan inovasi yang saya terapkan dalam membangun startup." },
  ],
  partnerships: [
    { id: "pt1", name: "Universitas Indonesia", logo: "https://ui-avatars.com/api/?name=UI&background=FFC107&color=000&size=100", website: "https://ui.ac.id", isActive: true, sortOrder: 1 },
    { id: "pt2", name: "ITB", logo: "https://ui-avatars.com/api/?name=ITB&background=0D47A1&color=fff&size=100", website: "https://itb.ac.id", isActive: true, sortOrder: 2 },
    { id: "pt3", name: "Google for Education", logo: "https://ui-avatars.com/api/?name=GE&background=4285F4&color=fff&size=100", website: "https://edu.google.com", isActive: true, sortOrder: 3 },
  ],
  websiteMenus: [],
  _count: { staff: 85, programs: 3, achievements: 45 },
}

export default async function ThemeDemoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  // Jangan render demo untuk tema sistem (karena mereka berbasis React, bukan Handlebars)
  if (id.startsWith("sys-")) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white rounded-xl shadow-sm border max-w-md">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Live Demo Tidak Tersedia</h1>
          <p className="text-gray-600">Tema bawaan sistem (System Themes) tidak dapat di-preview melalui URL ini. Preview hanya berlaku untuk tema kustom yang di-upload (.zip).</p>
        </div>
      </div>
    )
  }

  // Fetch tema dari database
  const theme = await db.customTheme.findUnique({
    where: { id }
  })

  if (!theme) notFound()

  try {
    // Kompilasi template dengan data dummy lengkap
    const template = Handlebars.compile(theme.indexHtml)
    const layoutTemplate = Handlebars.compile(theme.layoutHtml)
    
    const themeContext = {
      tenant: DUMMY_TENANT,
      base: `/theme/${id}`,
      gallery: DUMMY_TENANT.gallery,
      stats: [
        { value: "1250+", label: "Klien Aktif", icon: "users" },
        { value: "85+", label: "Tenaga Pendidik", icon: "book" },
        { value: "45+", label: "Prestasi Diraih", icon: "award" },
        { value: "1985", label: "Tahun Berdiri", icon: "clock" },
      ],
      settings: DUMMY_TENANT.settings,
    }
    
    const pageHtml = template(themeContext)
    const finalHtml = layoutTemplate({ ...themeContext, body: new Handlebars.SafeString(pageHtml) })
    
    return (
      <>
        {/* Inject CSS kustom jika ada */}
        {theme.customCss && (
          <style dangerouslySetInnerHTML={{ __html: theme.customCss }} />
        )}
        
        {/* Render HTML hasil kompilasi Handlebars */}
        {parse(finalHtml)}

        {/* Inject Banner Preview Mode */}
        <div className="fixed bottom-0 left-0 right-0 bg-indigo-600 text-white p-3 flex justify-between items-center z-[9999] shadow-lg">
          <div className="flex items-center gap-4 container mx-auto">
            <span className="font-bold bg-white text-indigo-600 px-2 py-1 rounded text-xs uppercase tracking-wider">Preview Mode</span>
            <p className="text-sm font-medium">Anda sedang melihat demo untuk tema: <span className="font-bold">{theme.name}</span> by {theme.author}</p>
          </div>
        </div>
        
        {/* Inject JS kustom jika ada */}
        {theme.customJs && (
          <Script id={`custom-js-${theme.id}`} dangerouslySetInnerHTML={{ __html: theme.customJs }} />
        )}
      </>
    )
  } catch (e: any) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50 p-4">
        <div className="bg-white rounded-lg shadow-sm border border-red-200 p-6 max-w-2xl w-full">
          <h1 className="text-xl font-bold text-red-600 mb-4">Gagal Me-render Tema</h1>
          <p className="text-gray-700 mb-4">Terdapat kesalahan sintaks Handlebars di dalam tema ini:</p>
          <pre className="bg-gray-900 text-gray-100 p-4 rounded text-sm overflow-auto whitespace-pre-wrap">
            {e.message}
          </pre>
        </div>
      </div>
    )
  }
}
