import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import JSZip from "jszip"
import { db } from "@/lib/db"

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.isSuperAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const themeId = searchParams.get("theme")
    
    if (!themeId) {
      return NextResponse.json({ error: "Theme ID is required" }, { status: 400 })
    }

    const zip = new JSZip()

    // If custom theme, export from DB
    if (!themeId.startsWith("sys-")) {
      const theme = await db.customTheme.findUnique({ where: { id: themeId } })
      if (!theme) return NextResponse.json({ error: "Tema tidak ditemukan" }, { status: 404 })

      zip.file("theme.json", JSON.stringify({
        name: theme.name,
        author: theme.author,
        version: theme.version,
        description: `Tema kustom ${theme.name} diekspor dari SchoolPro.`
      }, null, 2))

      zip.file("layouts/main.hbs", theme.layoutHtml)
      zip.file("templates/index.hbs", theme.indexHtml)
      if (theme.facilityHtml) zip.file("templates/fasilitas.hbs", theme.facilityHtml)
      if (theme.aboutHtml) zip.file("templates/profil.hbs", theme.aboutHtml)
      if (theme.staffHtml) zip.file("templates/guru.hbs", theme.staffHtml)
      if (theme.newsHtml) zip.file("templates/berita.hbs", theme.newsHtml)
      if (theme.newsDetailHtml) zip.file("templates/berita-detail.hbs", theme.newsDetailHtml)
      if (theme.galleryHtml) zip.file("templates/galeri.hbs", theme.galleryHtml)
      if (theme.contactHtml) zip.file("templates/kontak.hbs", theme.contactHtml)
      if (theme.extracurricularHtml) zip.file("templates/ekstrakurikuler.hbs", theme.extracurricularHtml)
      if (theme.programHtml) zip.file("templates/program.hbs", theme.programHtml)
      if (theme.achievementHtml) zip.file("templates/prestasi.hbs", theme.achievementHtml)
      if (theme.customCss) zip.file("assets/styles.css", theme.customCss)
      if (theme.customJs) zip.file("assets/scripts.js", theme.customJs)

      const buffer = await zip.generateAsync({ type: "nodebuffer" })
      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          "Content-Type": "application/zip",
          "Content-Disposition": `attachment; filename="${theme.name.replace(/\s+/g, '-').toLowerCase()}-v${theme.version}.zip"`,
        }
      })
    }

    // ========================================
    // SYSTEM THEME: Generate full starter kit
    // ========================================
    const themeName = themeId === "sys-modern" ? "Tema Corporat" : "Tema Default"

    // 1. theme.json
    zip.file("theme.json", JSON.stringify({
      name: themeName,
      author: "SchoolPro Official",
      version: "1.0.0",
      description: "Template starter kit lengkap dari SchoolPro. Berisi semua halaman yang tersedia untuk dikustomisasi oleh tim desain."
    }, null, 2))

    // 2. README.md — Dokumentasi variabel Handlebars
    zip.file("README.md", STARTER_README)

    // 3. layouts/main.hbs — Layout utama
    zip.file("layouts/main.hbs", LAYOUT_MAIN_HBS)

    // 4. Semua template halaman
    zip.file("templates/index.hbs", TEMPLATE_INDEX_HBS)
    zip.file("templates/profil.hbs", TEMPLATE_PROFIL_HBS)
    zip.file("templates/fasilitas.hbs", TEMPLATE_FASILITAS_HBS)
    zip.file("templates/guru.hbs", TEMPLATE_GURU_HBS)
    zip.file("templates/berita.hbs", TEMPLATE_BERITA_HBS)
    zip.file("templates/berita-detail.hbs", TEMPLATE_BERITA_DETAIL_HBS)
    zip.file("templates/galeri.hbs", TEMPLATE_GALERI_HBS)
    zip.file("templates/kontak.hbs", TEMPLATE_KONTAK_HBS)
    zip.file("templates/ekstrakurikuler.hbs", TEMPLATE_EKSKUL_HBS)
    zip.file("templates/program.hbs", TEMPLATE_PROGRAM_HBS)
    zip.file("templates/prestasi.hbs", TEMPLATE_PRESTASI_HBS)

    // 5. Assets
    zip.file("assets/styles.css", STARTER_CSS)
    zip.file("assets/scripts.js", STARTER_JS)

    const buffer = await zip.generateAsync({ type: "nodebuffer" })

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="template-${themeId}.zip"`,
      }
    })

  } catch (error: any) {
    console.error("Theme export error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}

// =============================================
// DOCUMENTATION
// =============================================
const STARTER_README = `# SchoolPro Theme Starter Kit

## Struktur Folder
\`\`\`
├── theme.json              # Metadata tema (wajib)
├── layouts/
│   └── main.hbs            # Layout utama (wajib) — berisi {{{body}}}
├── templates/
│   ├── index.hbs           # Halaman utama (wajib)
│   ├── profil.hbs          # Halaman profil/tentang sekolah
│   ├── fasilitas.hbs       # Halaman daftar fasilitas
│   ├── guru.hbs            # Halaman daftar guru/staff
│   ├── berita.hbs          # Halaman daftar berita
│   ├── berita-detail.hbs   # Halaman detail berita
│   ├── galeri.hbs          # Halaman galeri foto
│   ├── kontak.hbs          # Halaman kontak
│   ├── ekstrakurikuler.hbs # Halaman daftar ekstrakurikuler
│   ├── program.hbs         # Halaman daftar program
│   └── prestasi.hbs        # Halaman daftar prestasi
└── assets/
    ├── styles.css           # CSS kustom
    └── scripts.js           # JavaScript kustom
\`\`\`

## Variabel Handlebars yang Tersedia

### Objek \`tenant\`
| Variabel | Tipe | Contoh |
|----------|------|--------|
| \`tenant.name\` | string | "SMA Prestasi Bangsa" |
| \`tenant.tagline\` | string | "Membentuk Generasi Cerdas" |
| \`tenant.about\` | string | Deskripsi panjang sekolah |
| \`tenant.address\` | string | "Jl. Pendidikan No. 123" |
| \`tenant.phone\` | string | "+62 812 345 678" |
| \`tenant.whatsapp\` | string | "6281234567890" |
| \`tenant.email\` | string | "info@sekolah.id" |
| \`tenant.logo\` | string | URL logo |
| \`tenant.heroImage\` | string | URL hero image |
| \`tenant.instagram\` | string | "sekolahprestasi" |
| \`tenant.facebook\` | string | "sekolahprestasi" |
| \`tenant.youtube\` | string | "@sekolahprestasi" |
| \`tenant.tiktok\` | string | "@sekolahprestasi" |

### Objek \`tenant.settings\`
| Variabel | Tipe | Contoh |
|----------|------|--------|
| \`settings.principalName\` | string | "Dr. Ahmad Fauzi, M.Pd" |
| \`settings.principalTitle\` | string | "Kepala Sekolah" |
| \`settings.principalImage\` | string | URL foto |
| \`settings.principalMessage\` | string | Sambutan panjang |
| \`settings.visi\` | string | Visi sekolah |
| \`settings.misi\` | string | Misi sekolah (HTML) |
| \`settings.npsn\` | string | "12345678" |
| \`settings.akreditasi\` | string | "A (Unggul)" |
| \`settings.establishedYear\` | string | "1985" |

### Array Data
| Variabel | Properti tiap item |
|----------|--------------------|
| \`tenant.staff[]\` | \`name\`, \`role\`, \`imageUrl\`, \`nip\`, \`email\` |
| \`tenant.programs[]\` | \`name\`, \`description\`, \`imageUrl\` |
| \`tenant.extracurriculars[]\` | \`name\`, \`description\`, \`imageUrl\` |
| \`tenant.facilities[]\` | \`name\`, \`description\`, \`imageUrl\`, \`category\` |
| \`tenant.achievements[]\` | \`title\`, \`description\`, \`level\`, \`year\`, \`imageUrl\` |
| \`tenant.posts[]\` | \`title\`, \`slug\`, \`excerpt\`, \`content\`, \`coverImage\`, \`createdAt\`, \`category.name\` |
| \`tenant.events[]\` | \`title\`, \`description\`, \`location\`, \`startDate\`, \`endDate\` |
| \`tenant.sliders[]\` | \`title\`, \`subtitle\`, \`imageUrl\`, \`linkUrl\` |
| \`tenant.alumni[]\` | \`name\`, \`graduationYear\`, \`currentPosition\`, \`imageUrl\`, \`testimonial\` |
| \`tenant.gallery[]\` | \`url\`, \`caption\` |
| \`tenant.documents[]\` | \`title\`, \`fileUrl\`, \`fileSize\`, \`createdAt\` |
| \`tenant.partnerships[]\` | \`name\`, \`logo\`, \`website\` |

### Variabel Lainnya
| Variabel | Tipe | Keterangan |
|----------|------|------------|
| \`base\` | string | Base URL situs (misal: "/site/sma-prestasi") |
| \`stats[]\` | array | \`{ value, label, icon }\` — statistik ringkasan |
| \`gallery[]\` | array | \`{ url, caption }\` — galeri foto |

### Variabel khusus \`berita-detail.hbs\`
| Variabel | Tipe |
|----------|------|
| \`post.title\` | string |
| \`post.content\` | string (HTML) |
| \`post.coverImage\` | string (URL) |
| \`post.createdAt\` | string |
| \`post.category.name\` | string |

## Custom Handlebars Helpers
| Helper | Penggunaan | Keterangan |
|--------|------------|------------|
| \`{{truncate text 100}}\` | Potong teks hingga N karakter |
| \`{{dateFormat date "dd MMM yyyy"}}\` | Format tanggal |
| \`{{ifEqual a b}}\` | Cek kesamaan dua value |
| \`{{json data}}\` | Dump data ke JSON (debugging) |

## Tips
1. Gunakan \`{{{body}}}\` di main.hbs untuk menyisipkan konten halaman
2. CSS dari \`assets/styles.css\` otomatis di-inject ke semua halaman
3. JavaScript dari \`assets/scripts.js\` di-inject di akhir body
4. Gunakan CDN Tailwind untuk development cepat: \`<script src="https://cdn.tailwindcss.com"></script>\`
5. Semua gambar menggunakan URL absolut (R2/CDN), gunakan langsung di tag \`<img>\`
`

// =============================================
// LAYOUT UTAMA
// =============================================
const LAYOUT_MAIN_HBS = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{tenant.name}} — {{tenant.tagline}}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
  <style>body { font-family: 'Inter', sans-serif; }</style>
</head>
<body class="bg-white text-gray-900 antialiased">

  <!-- ═══════════════ NAVBAR ═══════════════ -->
  <nav class="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center h-16">
        <a href="{{base}}" class="flex items-center gap-3">
          {{#if tenant.logo}}
            <img src="{{tenant.logo}}" alt="Logo" class="h-10 w-10 rounded-lg object-contain">
          {{/if}}
          <div>
            <h1 class="text-lg font-bold text-gray-900 leading-tight">{{tenant.name}}</h1>
            {{#if tenant.tagline}}
              <p class="text-xs text-gray-500 -mt-0.5">{{tenant.tagline}}</p>
            {{/if}}
          </div>
        </a>
        <div class="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
          <a href="{{base}}" class="hover:text-indigo-600 transition-colors">Beranda</a>
          <a href="{{base}}/profil" class="hover:text-indigo-600 transition-colors">Profil</a>
          <a href="{{base}}/program" class="hover:text-indigo-600 transition-colors">Program</a>
          <a href="{{base}}/gtk" class="hover:text-indigo-600 transition-colors">Guru & Staf</a>
          <a href="{{base}}/fasilitas" class="hover:text-indigo-600 transition-colors">Fasilitas</a>
          <a href="{{base}}/berita" class="hover:text-indigo-600 transition-colors">Berita</a>
          <a href="{{base}}/gallery" class="hover:text-indigo-600 transition-colors">Galeri</a>
          <a href="{{base}}/prestasi" class="hover:text-indigo-600 transition-colors">Prestasi</a>
          <a href="{{base}}/contact" class="hover:text-indigo-600 transition-colors">Kontak</a>
        </div>
      </div>
    </div>
  </nav>

  <!-- ═══════════════ MAIN CONTENT ═══════════════ -->
  <main>
    {{{body}}}
  </main>

  <!-- ═══════════════ FOOTER ═══════════════ -->
  <footer class="bg-gray-900 text-gray-300 pt-16 pb-8 mt-20">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-10 mb-10">
        <div>
          <h3 class="text-white font-bold text-lg mb-3">{{tenant.name}}</h3>
          <p class="text-sm leading-relaxed text-gray-400">{{tenant.tagline}}</p>
          {{#if tenant.address}}
            <p class="text-sm mt-3 text-gray-400">📍 {{tenant.address}}</p>
          {{/if}}
        </div>
        <div>
          <h4 class="text-white font-semibold mb-3">Menu</h4>
          <ul class="space-y-2 text-sm">
            <li><a href="{{base}}/profil" class="hover:text-white transition-colors">Profil Sekolah</a></li>
            <li><a href="{{base}}/program" class="hover:text-white transition-colors">Program Unggulan</a></li>
            <li><a href="{{base}}/gtk" class="hover:text-white transition-colors">Guru & Staf</a></li>
            <li><a href="{{base}}/berita" class="hover:text-white transition-colors">Berita Terbaru</a></li>
            <li><a href="{{base}}/gallery" class="hover:text-white transition-colors">Galeri Foto</a></li>
          </ul>
        </div>
        <div>
          <h4 class="text-white font-semibold mb-3">Kontak</h4>
          <ul class="space-y-2 text-sm">
            {{#if tenant.phone}}<li>📞 {{tenant.phone}}</li>{{/if}}
            {{#if tenant.email}}<li>✉️ {{tenant.email}}</li>{{/if}}
            {{#if tenant.whatsapp}}<li>💬 WhatsApp: {{tenant.whatsapp}}</li>{{/if}}
          </ul>
          <div class="flex gap-3 mt-4">
            {{#if tenant.instagram}}<a href="https://instagram.com/{{tenant.instagram}}" target="_blank" class="text-gray-400 hover:text-pink-400 transition-colors text-sm">Instagram</a>{{/if}}
            {{#if tenant.facebook}}<a href="https://facebook.com/{{tenant.facebook}}" target="_blank" class="text-gray-400 hover:text-blue-400 transition-colors text-sm">Facebook</a>{{/if}}
            {{#if tenant.youtube}}<a href="https://youtube.com/{{tenant.youtube}}" target="_blank" class="text-gray-400 hover:text-red-400 transition-colors text-sm">YouTube</a>{{/if}}
          </div>
        </div>
      </div>
      <div class="border-t border-gray-800 pt-6 text-center text-xs text-gray-500">
        <p>&copy; {{tenant.name}} — All rights reserved.</p>
      </div>
    </div>
  </footer>
</body>
</html>`

// =============================================
// TEMPLATE: INDEX (HOMEPAGE)
// =============================================
const TEMPLATE_INDEX_HBS = `<!-- ═══════════════ HERO SLIDER ═══════════════ -->
{{#if tenant.sliders}}
<section class="relative h-[70vh] min-h-[500px] overflow-hidden">
  {{#each tenant.sliders}}
  {{#if @first}}
  <div class="absolute inset-0">
    <img src="{{this.imageUrl}}" alt="{{this.title}}" class="w-full h-full object-cover">
    <div class="absolute inset-0 bg-gradient-to-r from-black/70 to-transparent"></div>
    <div class="absolute inset-0 flex items-center">
      <div class="max-w-7xl mx-auto px-8 text-white">
        <h2 class="text-5xl font-black mb-4 leading-tight">{{this.title}}</h2>
        <p class="text-xl text-gray-200 max-w-xl">{{this.subtitle}}</p>
      </div>
    </div>
  </div>
  {{/if}}
  {{/each}}
</section>
{{else}}
<section class="bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 text-white py-28">
  <div class="max-w-7xl mx-auto px-8 text-center">
    <h2 class="text-5xl font-black mb-4">Selamat Datang di {{tenant.name}}</h2>
    <p class="text-xl text-indigo-200 max-w-2xl mx-auto">{{tenant.tagline}}</p>
  </div>
</section>
{{/if}}

<!-- ═══════════════ STATISTIK ═══════════════ -->
{{#if stats}}
<section class="bg-indigo-600 py-8 -mt-1">
  <div class="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-6 text-center text-white">
    {{#each stats}}
    <div>
      <div class="text-3xl font-black">{{this.value}}</div>
      <div class="text-sm text-indigo-200 mt-1">{{this.label}}</div>
    </div>
    {{/each}}
  </div>
</section>
{{/if}}

<!-- ═══════════════ SAMBUTAN KEPALA SEKOLAH ═══════════════ -->
{{#if settings.principalName}}
<section class="py-20 bg-gray-50">
  <div class="max-w-6xl mx-auto px-8 flex flex-col md:flex-row items-center gap-12">
    {{#if settings.principalImage}}
    <div class="shrink-0">
      <img src="{{settings.principalImage}}" alt="{{settings.principalName}}" class="w-48 h-48 rounded-2xl object-cover shadow-xl">
    </div>
    {{/if}}
    <div>
      <span class="text-indigo-600 font-bold text-sm uppercase tracking-widest">Sambutan</span>
      <h3 class="text-3xl font-bold mt-2 mb-4">{{settings.principalName}}</h3>
      <p class="text-sm text-gray-500 mb-3">{{settings.principalTitle}}</p>
      <p class="text-gray-600 leading-relaxed">{{settings.principalMessage}}</p>
    </div>
  </div>
</section>
{{/if}}

<!-- ═══════════════ TENTANG SEKOLAH ═══════════════ -->
<section class="py-20">
  <div class="max-w-6xl mx-auto px-8">
    <div class="text-center mb-12">
      <span class="text-indigo-600 font-bold text-sm uppercase tracking-widest">Tentang Kami</span>
      <h3 class="text-3xl font-bold mt-2">{{tenant.name}}</h3>
    </div>
    <p class="text-gray-600 text-lg leading-relaxed text-center max-w-3xl mx-auto">{{tenant.about}}</p>
  </div>
</section>

<!-- ═══════════════ PROGRAM UNGGULAN ═══════════════ -->
{{#if tenant.programs}}
<section class="py-20 bg-gray-50">
  <div class="max-w-7xl mx-auto px-8">
    <div class="text-center mb-12">
      <span class="text-indigo-600 font-bold text-sm uppercase tracking-widest">Kurikulum</span>
      <h3 class="text-3xl font-bold mt-2">Program Unggulan</h3>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
      {{#each tenant.programs}}
      <div class="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-shadow group">
        {{#if this.imageUrl}}
        <div class="h-48 overflow-hidden">
          <img src="{{this.imageUrl}}" alt="{{this.name}}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
        </div>
        {{/if}}
        <div class="p-6">
          <h4 class="text-xl font-bold mb-2">{{this.name}}</h4>
          <p class="text-gray-500 text-sm">{{this.description}}</p>
        </div>
      </div>
      {{/each}}
    </div>
    <div class="text-center mt-10">
      <a href="{{base}}/program" class="text-indigo-600 font-semibold hover:underline">Lihat Semua Program →</a>
    </div>
  </div>
</section>
{{/if}}

<!-- ═══════════════ FASILITAS ═══════════════ -->
{{#if tenant.facilities}}
<section class="py-20">
  <div class="max-w-7xl mx-auto px-8">
    <div class="text-center mb-12">
      <span class="text-indigo-600 font-bold text-sm uppercase tracking-widest">Sarana Prasarana</span>
      <h3 class="text-3xl font-bold mt-2">Fasilitas Sekolah</h3>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
      {{#each tenant.facilities}}
      <div class="bg-white rounded-2xl overflow-hidden shadow-sm border group hover:shadow-lg transition-shadow">
        {{#if this.imageUrl}}
        <img src="{{this.imageUrl}}" alt="{{this.name}}" class="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500">
        {{/if}}
        <div class="p-5">
          <h4 class="font-bold text-lg text-indigo-700">{{this.name}}</h4>
          <p class="text-sm text-gray-500 mt-2">{{this.description}}</p>
        </div>
      </div>
      {{/each}}
    </div>
    <div class="text-center mt-10">
      <a href="{{base}}/fasilitas" class="text-indigo-600 font-semibold hover:underline">Lihat Semua Fasilitas →</a>
    </div>
  </div>
</section>
{{/if}}

<!-- ═══════════════ BERITA TERBARU ═══════════════ -->
{{#if tenant.posts}}
<section class="py-20 bg-gray-50">
  <div class="max-w-7xl mx-auto px-8">
    <div class="text-center mb-12">
      <span class="text-indigo-600 font-bold text-sm uppercase tracking-widest">Informasi</span>
      <h3 class="text-3xl font-bold mt-2">Berita & Pengumuman Terbaru</h3>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
      {{#each tenant.posts}}
      <a href="{{../base}}/berita/{{this.slug}}" class="bg-white rounded-2xl overflow-hidden shadow-sm border hover:shadow-lg transition-all group">
        {{#if this.coverImage}}
        <div class="h-48 overflow-hidden">
          <img src="{{this.coverImage}}" alt="{{this.title}}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
        </div>
        {{else}}
        <div class="h-48 bg-indigo-50 flex items-center justify-center">
          <span class="text-indigo-300 text-4xl">📰</span>
        </div>
        {{/if}}
        <div class="p-5">
          {{#if this.category}}<span class="text-xs text-indigo-600 font-semibold uppercase">{{this.category.name}}</span>{{/if}}
          <h4 class="font-bold text-lg mt-1 group-hover:text-indigo-600 transition-colors">{{this.title}}</h4>
          <p class="text-sm text-gray-500 mt-2 line-clamp-2">{{this.excerpt}}</p>
        </div>
      </a>
      {{/each}}
    </div>
    <div class="text-center mt-10">
      <a href="{{base}}/berita" class="text-indigo-600 font-semibold hover:underline">Lihat Semua Berita →</a>
    </div>
  </div>
</section>
{{/if}}

<!-- ═══════════════ PRESTASI ═══════════════ -->
{{#if tenant.achievements}}
<section class="py-20">
  <div class="max-w-7xl mx-auto px-8">
    <div class="text-center mb-12">
      <span class="text-indigo-600 font-bold text-sm uppercase tracking-widest">Kebanggaan</span>
      <h3 class="text-3xl font-bold mt-2">Prestasi Terbaru</h3>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
      {{#each tenant.achievements}}
      <div class="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl p-6 border border-yellow-100 hover:shadow-md transition-shadow">
        <div class="text-3xl mb-3">🏆</div>
        <h4 class="font-bold text-gray-800">{{this.title}}</h4>
        <p class="text-sm text-gray-500 mt-1">{{this.description}}</p>
        {{#if this.level}}<span class="inline-block mt-2 text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full font-semibold">{{this.level}}</span>{{/if}}
      </div>
      {{/each}}
    </div>
  </div>
</section>
{{/if}}

<!-- ═══════════════ GALERI ═══════════════ -->
{{#if gallery}}
<section class="py-20 bg-gray-50">
  <div class="max-w-7xl mx-auto px-8">
    <div class="text-center mb-12">
      <span class="text-indigo-600 font-bold text-sm uppercase tracking-widest">Dokumentasi</span>
      <h3 class="text-3xl font-bold mt-2">Galeri Kegiatan</h3>
    </div>
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      {{#each gallery}}
      <div class="aspect-square rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow">
        <img src="{{this.url}}" alt="{{this.caption}}" class="w-full h-full object-cover hover:scale-105 transition-transform duration-500">
      </div>
      {{/each}}
    </div>
    <div class="text-center mt-10">
      <a href="{{base}}/gallery" class="text-indigo-600 font-semibold hover:underline">Lihat Semua Galeri →</a>
    </div>
  </div>
</section>
{{/if}}

<!-- ═══════════════ ALUMNI TESTIMONIALS ═══════════════ -->
{{#if tenant.alumni}}
<section class="py-20">
  <div class="max-w-6xl mx-auto px-8">
    <div class="text-center mb-12">
      <span class="text-indigo-600 font-bold text-sm uppercase tracking-widest">Alumni</span>
      <h3 class="text-3xl font-bold mt-2">Apa Kata Alumni Kami</h3>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
      {{#each tenant.alumni}}
      <div class="bg-white rounded-2xl p-6 shadow-sm border text-center">
        {{#if this.imageUrl}}
        <img src="{{this.imageUrl}}" alt="{{this.name}}" class="w-20 h-20 rounded-full object-cover mx-auto mb-4">
        {{else}}
        <div class="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center mx-auto mb-4 text-2xl text-indigo-400">👤</div>
        {{/if}}
        <p class="text-gray-600 text-sm italic mb-4">"{{this.testimonial}}"</p>
        <h4 class="font-bold">{{this.name}}</h4>
        <p class="text-xs text-gray-400">Angkatan {{this.graduationYear}} · {{this.currentPosition}}</p>
      </div>
      {{/each}}
    </div>
  </div>
</section>
{{/if}}

<!-- ═══════════════ MITRA ═══════════════ -->
{{#if tenant.partnerships}}
<section class="py-16 bg-gray-50 border-y">
  <div class="max-w-7xl mx-auto px-8">
    <h3 class="text-center text-sm font-bold uppercase tracking-widest text-gray-400 mb-8">Mitra & Kerjasama</h3>
    <div class="flex flex-wrap justify-center items-center gap-10">
      {{#each tenant.partnerships}}
      <div class="grayscale hover:grayscale-0 transition-all opacity-60 hover:opacity-100">
        {{#if this.logo}}
        <img src="{{this.logo}}" alt="{{this.name}}" class="h-12 object-contain">
        {{else}}
        <span class="text-gray-400 font-bold text-lg">{{this.name}}</span>
        {{/if}}
      </div>
      {{/each}}
    </div>
  </div>
</section>
{{/if}}

<!-- ═══════════════ CTA PPDB ═══════════════ -->
<section class="py-20 bg-indigo-600 text-white text-center">
  <div class="max-w-3xl mx-auto px-8">
    <h3 class="text-3xl font-black mb-4">Bergabunglah Bersama Kami!</h3>
    <p class="text-indigo-200 text-lg mb-8">Pendaftaran siswa baru telah dibuka. Jangan lewatkan kesempatan untuk menjadi bagian dari keluarga besar {{tenant.name}}.</p>
    <a href="{{base}}/ppdb" class="inline-block bg-white text-indigo-600 px-8 py-3 rounded-full font-bold hover:shadow-xl transition-all">Daftar Sekarang</a>
  </div>
</section>`

// =============================================
// TEMPLATE: PROFIL
// =============================================
const TEMPLATE_PROFIL_HBS = `<section class="py-20">
  <div class="max-w-6xl mx-auto px-8">
    <div class="text-center mb-16">
      <span class="text-indigo-600 font-bold text-sm uppercase tracking-widest">Profil</span>
      <h2 class="text-4xl font-black mt-2">Tentang {{tenant.name}}</h2>
    </div>

    <!-- Tentang -->
    <div class="prose prose-lg max-w-3xl mx-auto text-gray-600 mb-16 text-center">
      <p>{{tenant.about}}</p>
    </div>

    <!-- Visi & Misi -->
    {{#if settings.visi}}
    <div class="grid grid-cols-1 md:grid-cols-2 gap-10 mb-16">
      <div class="bg-indigo-50 rounded-2xl p-8">
        <h3 class="text-xl font-bold text-indigo-700 mb-4">🎯 Visi</h3>
        <p class="text-gray-700 leading-relaxed">{{settings.visi}}</p>
      </div>
      <div class="bg-emerald-50 rounded-2xl p-8">
        <h3 class="text-xl font-bold text-emerald-700 mb-4">🚀 Misi</h3>
        <div class="text-gray-700 leading-relaxed">{{{settings.misi}}}</div>
      </div>
    </div>
    {{/if}}

    <!-- Info Sekolah -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
      {{#if settings.npsn}}
      <div class="bg-gray-50 rounded-xl p-5 text-center">
        <div class="text-xs text-gray-400 uppercase font-bold mb-1">NPSN</div>
        <div class="text-lg font-bold">{{settings.npsn}}</div>
      </div>
      {{/if}}
      {{#if settings.akreditasi}}
      <div class="bg-gray-50 rounded-xl p-5 text-center">
        <div class="text-xs text-gray-400 uppercase font-bold mb-1">Akreditasi</div>
        <div class="text-lg font-bold">{{settings.akreditasi}}</div>
      </div>
      {{/if}}
      {{#if settings.establishedYear}}
      <div class="bg-gray-50 rounded-xl p-5 text-center">
        <div class="text-xs text-gray-400 uppercase font-bold mb-1">Tahun Berdiri</div>
        <div class="text-lg font-bold">{{settings.establishedYear}}</div>
      </div>
      {{/if}}
      {{#if settings.studentCount}}
      <div class="bg-gray-50 rounded-xl p-5 text-center">
        <div class="text-xs text-gray-400 uppercase font-bold mb-1">Jumlah Siswa</div>
        <div class="text-lg font-bold">{{settings.studentCount}}</div>
      </div>
      {{/if}}
    </div>

    <!-- Kepala Sekolah -->
    {{#if settings.principalName}}
    <div class="bg-white rounded-2xl shadow-lg p-8 flex flex-col md:flex-row items-center gap-8 border">
      {{#if settings.principalImage}}
      <img src="{{settings.principalImage}}" alt="{{settings.principalName}}" class="w-40 h-40 rounded-2xl object-cover shadow-md shrink-0">
      {{/if}}
      <div>
        <span class="text-indigo-600 font-bold text-sm uppercase tracking-widest">Sambutan {{settings.principalTitle}}</span>
        <h3 class="text-2xl font-bold mt-1 mb-3">{{settings.principalName}}</h3>
        <p class="text-gray-600 leading-relaxed">{{settings.principalMessage}}</p>
      </div>
    </div>
    {{/if}}
  </div>
</section>`

// =============================================
// TEMPLATE: FASILITAS
// =============================================
const TEMPLATE_FASILITAS_HBS = `<section class="py-20">
  <div class="max-w-7xl mx-auto px-8">
    <div class="text-center mb-16">
      <span class="text-indigo-600 font-bold text-sm uppercase tracking-widest">Sarana Prasarana</span>
      <h2 class="text-4xl font-black mt-2">Fasilitas Sekolah</h2>
      <p class="text-gray-500 mt-3 max-w-xl mx-auto">Sarana dan prasarana pendukung pendidikan untuk kenyamanan seluruh siswa</p>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
      {{#each tenant.facilities}}
      <div class="bg-white rounded-2xl overflow-hidden shadow-sm border group hover:shadow-xl transition-all">
        {{#if this.imageUrl}}
        <div class="h-56 overflow-hidden">
          <img src="{{this.imageUrl}}" alt="{{this.name}}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700">
        </div>
        {{else}}
        <div class="h-56 bg-indigo-50 flex items-center justify-center"><span class="text-5xl">🏫</span></div>
        {{/if}}
        <div class="p-6">
          <h4 class="font-bold text-lg text-indigo-700">{{this.name}}</h4>
          {{#if this.category}}<span class="inline-block mt-1 text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">{{this.category}}</span>{{/if}}
          <p class="text-sm text-gray-500 mt-3">{{this.description}}</p>
        </div>
      </div>
      {{/each}}
    </div>
  </div>
</section>`

// =============================================
// TEMPLATE: GURU / STAFF
// =============================================
const TEMPLATE_GURU_HBS = `<section class="py-20">
  <div class="max-w-7xl mx-auto px-8">
    <div class="text-center mb-16">
      <span class="text-indigo-600 font-bold text-sm uppercase tracking-widest">Tim Pendidik</span>
      <h2 class="text-4xl font-black mt-2">Guru & Tenaga Kependidikan</h2>
    </div>
    <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
      {{#each tenant.staff}}
      <div class="text-center group">
        <div class="w-32 h-32 mx-auto rounded-2xl overflow-hidden shadow-md mb-4 bg-gray-100">
          {{#if this.imageUrl}}
          <img src="{{this.imageUrl}}" alt="{{this.name}}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500">
          {{else}}
          <div class="w-full h-full flex items-center justify-center bg-indigo-50 text-4xl text-indigo-300">👤</div>
          {{/if}}
        </div>
        <h4 class="font-bold text-sm">{{this.name}}</h4>
        <p class="text-xs text-gray-500 mt-1">{{this.role}}</p>
        {{#if this.nip}}<p class="text-[10px] text-gray-400 mt-0.5">NIP: {{this.nip}}</p>{{/if}}
      </div>
      {{/each}}
    </div>
  </div>
</section>`

// =============================================
// TEMPLATE: BERITA (LIST)
// =============================================
const TEMPLATE_BERITA_HBS = `<section class="py-20">
  <div class="max-w-7xl mx-auto px-8">
    <div class="text-center mb-16">
      <span class="text-indigo-600 font-bold text-sm uppercase tracking-widest">Informasi</span>
      <h2 class="text-4xl font-black mt-2">Berita & Artikel</h2>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
      {{#each tenant.posts}}
      <a href="{{../base}}/berita/{{this.slug}}" class="bg-white rounded-2xl overflow-hidden shadow-sm border hover:shadow-xl transition-all group">
        {{#if this.coverImage}}
        <div class="h-52 overflow-hidden">
          <img src="{{this.coverImage}}" alt="{{this.title}}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
        </div>
        {{else}}
        <div class="h-52 bg-gray-100 flex items-center justify-center"><span class="text-5xl text-gray-300">📰</span></div>
        {{/if}}
        <div class="p-6">
          {{#if this.category}}<span class="text-xs text-indigo-600 font-semibold uppercase">{{this.category.name}}</span>{{/if}}
          <h4 class="text-lg font-bold mt-1 group-hover:text-indigo-600 transition-colors">{{this.title}}</h4>
          <p class="text-sm text-gray-500 mt-2 line-clamp-2">{{this.excerpt}}</p>
        </div>
      </a>
      {{/each}}
    </div>
  </div>
</section>`

// =============================================
// TEMPLATE: BERITA DETAIL
// =============================================
const TEMPLATE_BERITA_DETAIL_HBS = `<article class="py-20">
  <div class="max-w-4xl mx-auto px-8">
    {{#if post.coverImage}}
    <div class="rounded-2xl overflow-hidden mb-10 shadow-lg h-80">
      <img src="{{post.coverImage}}" alt="{{post.title}}" class="w-full h-full object-cover">
    </div>
    {{/if}}
    <div class="mb-6">
      {{#if post.category}}<span class="text-xs text-indigo-600 font-semibold uppercase bg-indigo-50 px-3 py-1 rounded-full">{{post.category.name}}</span>{{/if}}
    </div>
    <h1 class="text-4xl font-black leading-tight mb-4">{{post.title}}</h1>
    <p class="text-gray-400 text-sm mb-10">{{post.createdAt}}</p>
    <div class="prose prose-lg max-w-none">
      {{{post.content}}}
    </div>
    <div class="mt-12 pt-8 border-t text-center">
      <a href="{{base}}/berita" class="text-indigo-600 font-semibold hover:underline">← Kembali ke Daftar Berita</a>
    </div>
  </div>
</article>`

// =============================================
// TEMPLATE: GALERI
// =============================================
const TEMPLATE_GALERI_HBS = `<section class="py-20">
  <div class="max-w-7xl mx-auto px-8">
    <div class="text-center mb-16">
      <span class="text-indigo-600 font-bold text-sm uppercase tracking-widest">Dokumentasi</span>
      <h2 class="text-4xl font-black mt-2">Galeri Foto</h2>
    </div>
    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {{#each gallery}}
      <div class="aspect-square rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all group cursor-pointer">
        <img src="{{this.url}}" alt="{{this.caption}}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700">
      </div>
      {{/each}}
    </div>
  </div>
</section>`

// =============================================
// TEMPLATE: KONTAK
// =============================================
const TEMPLATE_KONTAK_HBS = `<section class="py-20">
  <div class="max-w-5xl mx-auto px-8">
    <div class="text-center mb-16">
      <span class="text-indigo-600 font-bold text-sm uppercase tracking-widest">Hubungi</span>
      <h2 class="text-4xl font-black mt-2">Kontak Kami</h2>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
      {{#if tenant.address}}
      <div class="bg-gray-50 rounded-2xl p-6 text-center">
        <div class="text-3xl mb-3">📍</div>
        <h4 class="font-bold mb-2">Alamat</h4>
        <p class="text-sm text-gray-500">{{tenant.address}}</p>
      </div>
      {{/if}}
      {{#if tenant.phone}}
      <div class="bg-gray-50 rounded-2xl p-6 text-center">
        <div class="text-3xl mb-3">📞</div>
        <h4 class="font-bold mb-2">Telepon</h4>
        <p class="text-sm text-gray-500">{{tenant.phone}}</p>
      </div>
      {{/if}}
      {{#if tenant.email}}
      <div class="bg-gray-50 rounded-2xl p-6 text-center">
        <div class="text-3xl mb-3">✉️</div>
        <h4 class="font-bold mb-2">Email</h4>
        <p class="text-sm text-gray-500">{{tenant.email}}</p>
      </div>
      {{/if}}
    </div>
    {{#if tenant.whatsapp}}
    <div class="text-center mt-12">
      <a href="https://wa.me/{{tenant.whatsapp}}" target="_blank" class="inline-flex items-center gap-2 bg-green-500 text-white px-8 py-3 rounded-full font-bold hover:bg-green-600 hover:shadow-lg transition-all">
        💬 Chat via WhatsApp
      </a>
    </div>
    {{/if}}
  </div>
</section>`

// =============================================
// TEMPLATE: EKSTRAKURIKULER
// =============================================
const TEMPLATE_EKSKUL_HBS = `<section class="py-20">
  <div class="max-w-7xl mx-auto px-8">
    <div class="text-center mb-16">
      <span class="text-indigo-600 font-bold text-sm uppercase tracking-widest">Pengembangan Diri</span>
      <h2 class="text-4xl font-black mt-2">Ekstrakurikuler</h2>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
      {{#each tenant.extracurriculars}}
      <div class="bg-white rounded-2xl overflow-hidden shadow-sm border hover:shadow-lg transition-all group">
        {{#if this.imageUrl}}
        <div class="h-48 overflow-hidden">
          <img src="{{this.imageUrl}}" alt="{{this.name}}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
        </div>
        {{else}}
        <div class="h-48 bg-indigo-50 flex items-center justify-center"><span class="text-5xl">⚽</span></div>
        {{/if}}
        <div class="p-6">
          <h4 class="font-bold text-lg text-indigo-700">{{this.name}}</h4>
          <p class="text-sm text-gray-500 mt-2">{{this.description}}</p>
        </div>
      </div>
      {{/each}}
    </div>
  </div>
</section>`

// =============================================
// TEMPLATE: PROGRAM
// =============================================
const TEMPLATE_PROGRAM_HBS = `<section class="py-20">
  <div class="max-w-7xl mx-auto px-8">
    <div class="text-center mb-16">
      <span class="text-indigo-600 font-bold text-sm uppercase tracking-widest">Kurikulum</span>
      <h2 class="text-4xl font-black mt-2">Program Unggulan</h2>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {{#each tenant.programs}}
      <div class="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all group border">
        {{#if this.imageUrl}}
        <div class="h-52 overflow-hidden">
          <img src="{{this.imageUrl}}" alt="{{this.name}}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
        </div>
        {{else}}
        <div class="h-52 bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center"><span class="text-5xl">📚</span></div>
        {{/if}}
        <div class="p-6">
          <h4 class="text-xl font-bold text-gray-800">{{this.name}}</h4>
          <p class="text-gray-500 text-sm mt-2">{{this.description}}</p>
        </div>
      </div>
      {{/each}}
    </div>
  </div>
</section>`

// =============================================
// TEMPLATE: PRESTASI
// =============================================
const TEMPLATE_PRESTASI_HBS = `<section class="py-20">
  <div class="max-w-7xl mx-auto px-8">
    <div class="text-center mb-16">
      <span class="text-indigo-600 font-bold text-sm uppercase tracking-widest">Kebanggaan</span>
      <h2 class="text-4xl font-black mt-2">Daftar Prestasi</h2>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {{#each tenant.achievements}}
      <div class="bg-white rounded-2xl p-6 shadow-sm border hover:shadow-lg transition-all">
        <div class="flex items-start gap-4">
          <div class="text-4xl shrink-0">🏆</div>
          <div>
            <h4 class="font-bold text-lg text-gray-800">{{this.title}}</h4>
            <p class="text-sm text-gray-500 mt-1">{{this.description}}</p>
            <div class="flex gap-2 mt-3">
              {{#if this.level}}<span class="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full font-medium">{{this.level}}</span>{{/if}}
              {{#if this.year}}<span class="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">{{this.year}}</span>{{/if}}
            </div>
          </div>
        </div>
      </div>
      {{/each}}
    </div>
  </div>
</section>`

// =============================================
// STARTER CSS & JS
// =============================================
const STARTER_CSS = `/* ═══════════════════════════════════════════
   SchoolPro Custom Theme — Stylesheet
   ═══════════════════════════════════════════ */

/* Global overrides */
.custom-theme-wrapper {
  --color-primary: #4f46e5;
  --color-primary-light: #e0e7ff;
}

/* Smooth scroll */
html { scroll-behavior: smooth; }

/* Image hover zoom */
.group:hover .group-hover\\:scale-105 { transform: scale(1.05); }
.group:hover .group-hover\\:scale-110 { transform: scale(1.1); }

/* Prose max width */
.prose { max-width: 65ch; }
.prose img { border-radius: 1rem; }

/* Custom line-clamp */
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .text-5xl { font-size: 2rem; }
  .text-4xl { font-size: 1.75rem; }
}
`

const STARTER_JS = `// ═══════════════════════════════════════════
// SchoolPro Custom Theme — Scripts
// ═══════════════════════════════════════════

console.log('[SchoolPro Theme] loaded successfully');

// Mobile menu toggle (contoh)
document.addEventListener('DOMContentLoaded', function() {
  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // Lazy image loading with fade-in
  const images = document.querySelectorAll('img[data-src]');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src;
        img.classList.add('loaded');
        observer.unobserve(img);
      }
    });
  });
  images.forEach(img => observer.observe(img));
});
`
