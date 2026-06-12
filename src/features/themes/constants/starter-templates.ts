// =============================================
// DOCUMENTATION
// =============================================
export const STARTER_README = `# SchoolPro Theme Starter Kit

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
│   ├── guru-detail.hbs     # Halaman detail profil guru
│   ├── berita.hbs          # Halaman daftar berita
│   ├── berita-detail.hbs   # Halaman detail berita
│   ├── galeri.hbs          # Halaman galeri foto
│   ├── kontak.hbs          # Halaman kontak
│   ├── ekstrakurikuler.hbs # Halaman daftar ekstrakurikuler
│   ├── program.hbs         # Halaman daftar program
│   ├── prestasi.hbs        # Halaman daftar prestasi
│   ├── pengumuman.hbs      # Halaman daftar pengumuman
│   ├── pengumuman-detail.hbs # Halaman detail pengumuman
│   ├── ppdb.hbs            # Halaman pendaftaran siswa baru
│   ├── alumni.hbs          # Halaman daftar alumni & testimonial
│   ├── agenda.hbs          # Halaman kalender agenda/event
│   └── unduhan.hbs         # Halaman dokumen & file download
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
| \`tenant.websiteMenus[]\` | \`label\`, \`url\`, \`children[]\` — menu dari admin Navigasi Website |

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

## Custom Handlebars Helpers (Shopify Liquid Style)
| Kategori | Helper | Contoh Penggunaan |
|----------|--------|-------------------|
| **Teks** | \`uppercase\` | \`{{uppercase title}}\` |
| | \`lowercase\` | \`{{lowercase title}}\` |
| | \`slugify\` | \`{{slugify title}}\` |
| | \`truncate\` | \`{{truncate description 100}}\` |
| | \`default\` | \`{{default bio "Belum ada bio"}}\` |
| **Logika** | \`eq\`, \`neq\` | \`{{#if (eq status "active")}}\` |
| | \`gt\`, \`lt\` | \`{{#if (gt price 1000)}}\` |
| | \`and\`, \`or\` | \`{{#if (and isAdmin isActive)}}\` |
| **Array** | \`length\` | \`Total: {{length users}}\` |
| | \`limit\` | \`{{#each (limit posts 3)}}\` |
| | \`join\` | \`{{join tags ", "}}\` |
| **URL** | \`menuHref\` | \`{{menuHref base this.url}}\` |
| **Format**| \`dateFormat\`| \`{{dateFormat createdAt}}\` |
| | \`currencyFormat\`| \`{{currencyFormat price}}\` |

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
export const LAYOUT_MAIN_HBS = `<!DOCTYPE html>
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
        {{#if tenant.websiteMenus}}
        <div class="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
          {{#each tenant.websiteMenus}}
            {{#if this.children}}
            <div class="relative group py-5 -my-5">
              <a href="{{menuHref ../base this.url}}" class="hover:text-indigo-600 transition-colors inline-flex items-center gap-1">
                {{this.label}}
                <span class="text-xs">▾</span>
              </a>
              <div class="absolute left-0 top-full hidden group-hover:block w-56 rounded-xl border border-gray-100 bg-white p-2 shadow-xl">
                {{#each this.children}}
                <a href="{{menuHref ../../base this.url}}" class="block rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 transition-colors">{{this.label}}</a>
                {{/each}}
              </div>
            </div>
            {{else}}
            <a href="{{menuHref ../base this.url}}" class="hover:text-indigo-600 transition-colors">{{this.label}}</a>
            {{/if}}
          {{/each}}
        </div>
        {{/if}}
        <!-- Mobile hamburger -->
        <button id="mobile-menu-btn" class="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors" onclick="document.getElementById('mobile-menu').classList.toggle('hidden')">
          <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
        </button>
      </div>
      <!-- Mobile menu -->
      <div id="mobile-menu" class="hidden md:hidden pb-4 border-t border-gray-100 mt-2 pt-4">
        {{#if tenant.websiteMenus}}
        <div class="flex flex-col gap-2 text-sm font-medium text-gray-600">
          {{#each tenant.websiteMenus}}
          <a href="{{menuHref ../base this.url}}" class="hover:text-indigo-600 px-2 py-1.5 rounded-lg hover:bg-indigo-50 transition-all">{{this.label}}</a>
          {{#if this.children}}
          <div class="ml-4 flex flex-col gap-1 border-l border-gray-100 pl-3">
            {{#each this.children}}
            <a href="{{menuHref ../../base this.url}}" class="hover:text-indigo-600 px-2 py-1.5 rounded-lg hover:bg-indigo-50 transition-all text-gray-500">{{this.label}}</a>
            {{/each}}
          </div>
          {{/if}}
          {{/each}}
        </div>
        {{/if}}
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
      <div class="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
        <div>
          <h3 class="text-white font-bold text-lg mb-3">{{tenant.name}}</h3>
          <p class="text-sm leading-relaxed text-gray-400">{{tenant.tagline}}</p>
          {{#if tenant.address}}
            <p class="text-sm mt-3 text-gray-400">📍 {{tenant.address}}</p>
          {{/if}}
        </div>
        {{#if tenant.websiteMenus}}
        <div>
          <h4 class="text-white font-semibold mb-3">Menu Website</h4>
          <ul class="space-y-2 text-sm">
            {{#each tenant.websiteMenus}}
            <li>
              <a href="{{menuHref ../base this.url}}" class="hover:text-white transition-colors">{{this.label}}</a>
              {{#if this.children}}
              <ul class="mt-2 ml-3 space-y-1.5 text-xs text-gray-500">
                {{#each this.children}}
                <li><a href="{{menuHref ../../base this.url}}" class="hover:text-white transition-colors">{{this.label}}</a></li>
                {{/each}}
              </ul>
              {{/if}}
            </li>
            {{/each}}
          </ul>
        </div>
        {{/if}}
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
            {{#if tenant.tiktok}}<a href="https://tiktok.com/{{tenant.tiktok}}" target="_blank" class="text-gray-400 hover:text-white transition-colors text-sm">TikTok</a>{{/if}}
          </div>
        </div>
      </div>
      <div class="border-t border-gray-800 pt-6 text-center text-xs text-gray-500">
        <p>&copy; {{tenant.name}} — All rights reserved.</p>
      </div>
    </div>
  </footer>

  <!-- ═══════════════ BACK TO TOP ═══════════════ -->
  <button id="back-to-top" onclick="window.scrollTo({top:0,behavior:'smooth'})" class="fixed bottom-6 right-6 h-12 w-12 bg-indigo-600 text-white rounded-full shadow-xl hover:bg-indigo-700 transition-all opacity-0 translate-y-4 pointer-events-none z-50" style="transition: opacity 0.3s, transform 0.3s;">
    <svg class="h-5 w-5 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 15l7-7 7 7"/></svg>
  </button>
  <script>
    window.addEventListener('scroll', function() {
      var btn = document.getElementById('back-to-top');
      if (window.scrollY > 400) {
        btn.style.opacity = '1';
        btn.style.transform = 'translateY(0)';
        btn.style.pointerEvents = 'auto';
      } else {
        btn.style.opacity = '0';
        btn.style.transform = 'translateY(1rem)';
        btn.style.pointerEvents = 'none';
      }
    });
  </script>
</body>
</html>`

// =============================================
// TEMPLATE: INDEX (HOMEPAGE)
// =============================================
export const TEMPLATE_INDEX_HBS = `<!-- ═══════════════ HERO SLIDER ═══════════════ -->
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
{{#if (gt (length tenant.posts) 0)}}
<section class="py-20 bg-gray-50">
  <div class="max-w-7xl mx-auto px-8">
    <div class="text-center mb-12">
      <span class="text-indigo-600 font-bold text-sm uppercase tracking-widest">{{uppercase "Informasi"}}</span>
      <h3 class="text-3xl font-bold mt-2">Berita & Pengumuman Terbaru</h3>
      <p class="text-sm text-gray-400 mt-2">Menampilkan 3 dari total {{length tenant.posts}} artikel</p>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
      {{#each (limit tenant.posts 3)}}
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
        <p class="text-sm text-gray-500 mt-1">{{default this.description "Tanpa Deskripsi"}}</p>
        {{#if this.level}}<span class="inline-block mt-2 text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full font-semibold">{{uppercase this.level}}</span>{{/if}}
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
      {{#each (limit tenant.alumni 3)}}
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
export const TEMPLATE_PROFIL_HBS = `<section class="py-20">
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
export const TEMPLATE_FASILITAS_HBS = `<section class="py-20">
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
export const TEMPLATE_GURU_HBS = `<section class="py-20">
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
export const TEMPLATE_BERITA_HBS = `<section class="py-20">
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
export const TEMPLATE_BERITA_DETAIL_HBS = `<article class="py-20">
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
export const TEMPLATE_GALERI_HBS = `<section class="py-20">
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
export const TEMPLATE_KONTAK_HBS = `<section class="py-20">
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
export const TEMPLATE_EKSKUL_HBS = `<section class="py-20">
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
export const TEMPLATE_PROGRAM_HBS = `<section class="py-20">
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
export const TEMPLATE_PRESTASI_HBS = `<section class="py-20">
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
// TEMPLATE: PENGUMUMAN (LIST)
// =============================================
export const TEMPLATE_PENGUMUMAN_HBS = `<section class="py-20">
  <div class="max-w-7xl mx-auto px-8">
    <nav class="text-sm text-gray-400 mb-6"><a href="{{base}}" class="hover:text-indigo-600">Beranda</a> / <span class="text-gray-700">Pengumuman</span></nav>
    <div class="text-center mb-12">
      <span class="text-indigo-600 font-bold text-sm uppercase tracking-widest">Informasi</span>
      <h2 class="text-4xl font-black mt-2">Pengumuman Resmi</h2>
      <p class="text-gray-500 mt-3 max-w-xl mx-auto">Informasi penting dan pengumuman resmi dari sekolah untuk seluruh civitas akademika.</p>
    </div>
    {{#if tenant.posts}}
    <div class="space-y-6">
      {{#each tenant.posts}}
      <a href="{{../base}}/pengumuman/{{this.slug}}" class="block bg-white rounded-2xl p-6 border hover:border-indigo-200 hover:shadow-lg transition-all group">
        <div class="flex items-start gap-6">
          <div class="shrink-0 w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-2xl group-hover:bg-indigo-100 transition-colors">📢</div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-3 mb-1">
              {{#if this.category}}<span class="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">{{this.category.name}}</span>{{/if}}
              <span class="text-xs text-gray-400">{{dateFormat this.createdAt}}</span>
            </div>
            <h3 class="text-lg font-bold text-gray-800 group-hover:text-indigo-600 transition-colors">{{this.title}}</h3>
            <p class="text-sm text-gray-500 mt-1 line-clamp-2">{{this.excerpt}}</p>
          </div>
        </div>
      </a>
      {{/each}}
    </div>
    {{else}}
    <div class="text-center py-20 bg-gray-50 rounded-3xl border border-dashed">
      <div class="text-5xl mb-4">📭</div>
      <h3 class="text-xl font-bold text-gray-600">Belum Ada Pengumuman</h3>
      <p class="text-gray-400 mt-2">Belum ada pengumuman yang dipublikasikan saat ini.</p>
    </div>
    {{/if}}
  </div>
</section>`

// =============================================
// TEMPLATE: PENGUMUMAN DETAIL
// =============================================
export const TEMPLATE_PENGUMUMAN_DETAIL_HBS = `<article class="py-16">
  <div class="max-w-3xl mx-auto px-8">
    <nav class="text-sm text-gray-400 mb-8"><a href="{{base}}" class="hover:text-indigo-600">Beranda</a> / <a href="{{base}}/pengumuman" class="hover:text-indigo-600">Pengumuman</a> / <span class="text-gray-700">Detail</span></nav>
    {{#if post.category}}<span class="text-xs bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full font-semibold uppercase">{{post.category.name}}</span>{{/if}}
    <h1 class="text-3xl md:text-4xl font-black mt-4 mb-4 leading-tight">{{post.title}}</h1>
    <div class="flex items-center gap-4 text-sm text-gray-400 mb-8 pb-8 border-b">
      <span>📅 {{dateFormat post.createdAt}}</span>
      <span>✍️ {{post.author.name}}</span>
    </div>
    <div class="prose prose-lg max-w-none text-gray-700 leading-relaxed">
      {{{post.content}}}
    </div>
    <div class="mt-12 pt-8 border-t text-center">
      <a href="{{base}}/pengumuman" class="text-indigo-600 font-semibold hover:underline">← Kembali ke Daftar Pengumuman</a>
    </div>
  </div>
</article>`

// =============================================
// TEMPLATE: PPDB
// =============================================
export const TEMPLATE_PPDB_HBS = `<!-- Hero PPDB -->
<section class="bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 text-white py-24 relative overflow-hidden">
  <div class="absolute inset-0 opacity-10" style="background-image: url('data:image/svg+xml,<svg xmlns=\\"http://www.w3.org/2000/svg\\" viewBox=\\"0 0 80 80\\"><circle cx=\\"40\\" cy=\\"40\\" r=\\"2\\" fill=\\"white\\"/></svg>'); background-size: 40px 40px;"></div>
  <div class="max-w-4xl mx-auto px-8 text-center relative z-10">
    <span class="inline-block bg-white/20 backdrop-blur-sm text-white px-4 py-1 rounded-full text-sm font-bold mb-6">📚 Tahun Ajaran Baru</span>
    <h2 class="text-4xl md:text-5xl font-black mb-4 leading-tight">Penerimaan Peserta Didik Baru</h2>
    <p class="text-xl text-indigo-200 max-w-2xl mx-auto mb-10">Bergabunglah bersama {{tenant.name}} dan raih masa depan gemilang putra-putri Anda.</p>
    {{#if tenant.whatsapp}}
    <a href="https://wa.me/{{tenant.whatsapp}}" target="_blank" class="inline-flex items-center gap-3 bg-white text-indigo-600 px-8 py-4 rounded-full font-bold text-lg hover:shadow-2xl transition-all">
      💬 Hubungi via WhatsApp
    </a>
    {{/if}}
  </div>
</section>

<!-- Info Sekolah -->
<section class="py-20">
  <div class="max-w-6xl mx-auto px-8">
    <div class="text-center mb-16">
      <h3 class="text-3xl font-bold">Mengapa Memilih {{tenant.name}}?</h3>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div class="text-center p-8 bg-indigo-50 rounded-2xl">
        <div class="text-4xl mb-4">🎓</div>
        <h4 class="font-bold text-lg mb-2">Pendidikan Berkualitas</h4>
        <p class="text-sm text-gray-600">Kurikulum terpadu dengan standar nasional dan internasional.</p>
      </div>
      <div class="text-center p-8 bg-emerald-50 rounded-2xl">
        <div class="text-4xl mb-4">👨‍🏫</div>
        <h4 class="font-bold text-lg mb-2">Guru Profesional</h4>
        <p class="text-sm text-gray-600">Tenaga pendidik berpengalaman dan bersertifikasi.</p>
      </div>
      <div class="text-center p-8 bg-amber-50 rounded-2xl">
        <div class="text-4xl mb-4">🏫</div>
        <h4 class="font-bold text-lg mb-2">Fasilitas Lengkap</h4>
        <p class="text-sm text-gray-600">Sarana dan prasarana modern untuk menunjang pembelajaran.</p>
      </div>
    </div>
  </div>
</section>

<!-- Kontak PPDB -->
<section class="py-16 bg-gray-50">
  <div class="max-w-3xl mx-auto px-8 text-center">
    <h3 class="text-2xl font-bold mb-4">Informasi Lebih Lanjut</h3>
    <p class="text-gray-500 mb-8">Hubungi panitia PPDB untuk informasi jadwal, persyaratan, dan prosedur pendaftaran.</p>
    <div class="flex flex-wrap justify-center gap-4">
      {{#if tenant.phone}}<a href="tel:{{tenant.phone}}" class="bg-white px-6 py-3 rounded-xl border hover:shadow-md transition-shadow font-medium">📞 {{tenant.phone}}</a>{{/if}}
      {{#if tenant.email}}<a href="mailto:{{tenant.email}}" class="bg-white px-6 py-3 rounded-xl border hover:shadow-md transition-shadow font-medium">✉️ {{tenant.email}}</a>{{/if}}
    </div>
  </div>
</section>`

// =============================================
// TEMPLATE: ALUMNI
// =============================================
export const TEMPLATE_ALUMNI_HBS = `<section class="py-20">
  <div class="max-w-7xl mx-auto px-8">
    <nav class="text-sm text-gray-400 mb-6"><a href="{{base}}" class="hover:text-indigo-600">Beranda</a> / <span class="text-gray-700">Alumni</span></nav>
    <div class="text-center mb-16">
      <span class="text-indigo-600 font-bold text-sm uppercase tracking-widest">Kebanggaan Kami</span>
      <h2 class="text-4xl font-black mt-2">Alumni {{tenant.name}}</h2>
      <p class="text-gray-500 mt-3 max-w-2xl mx-auto">Mengenal lebih dekat para alumni yang telah berhasil di berbagai bidang dan menjadi inspirasi generasi berikutnya.</p>
    </div>
    {{#if tenant.alumni}}
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {{#each tenant.alumni}}
      <div class="bg-white rounded-2xl p-8 shadow-sm border hover:shadow-lg transition-all text-center group">
        {{#if this.imageUrl}}
        <img src="{{this.imageUrl}}" alt="{{this.name}}" class="w-24 h-24 rounded-full object-cover mx-auto mb-6 ring-4 ring-indigo-50 group-hover:ring-indigo-200 transition-all">
        {{else}}
        <div class="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center mx-auto mb-6 text-white text-3xl font-bold">👤</div>
        {{/if}}
        <h4 class="font-bold text-lg text-gray-800">{{this.name}}</h4>
        <p class="text-xs text-indigo-600 font-semibold mt-1">Angkatan {{this.graduationYear}}</p>
        {{#if this.currentPosition}}<p class="text-sm text-gray-500 mt-2">{{this.currentPosition}}</p>{{/if}}
        {{#if this.testimonial}}
        <blockquote class="text-sm text-gray-500 italic mt-4 pt-4 border-t border-gray-100">"{{truncate this.testimonial 150}}"</blockquote>
        {{/if}}
      </div>
      {{/each}}
    </div>
    {{else}}
    <div class="text-center py-20 bg-gray-50 rounded-3xl border border-dashed">
      <div class="text-5xl mb-4">🎓</div>
      <h3 class="text-xl font-bold text-gray-600">Data Alumni Segera Hadir</h3>
    </div>
    {{/if}}
  </div>
</section>`

// =============================================
// TEMPLATE: AGENDA / EVENT
// =============================================
export const TEMPLATE_AGENDA_HBS = `<section class="py-20">
  <div class="max-w-7xl mx-auto px-8">
    <nav class="text-sm text-gray-400 mb-6"><a href="{{base}}" class="hover:text-indigo-600">Beranda</a> / <span class="text-gray-700">Agenda</span></nav>
    <div class="text-center mb-16">
      <span class="text-indigo-600 font-bold text-sm uppercase tracking-widest">Kalender</span>
      <h2 class="text-4xl font-black mt-2">Agenda & Kegiatan</h2>
      <p class="text-gray-500 mt-3">Jadwal kegiatan dan acara penting yang akan datang.</p>
    </div>
    {{#if tenant.events}}
    <div class="space-y-6 max-w-3xl mx-auto">
      {{#each tenant.events}}
      <div class="bg-white rounded-2xl p-6 border hover:shadow-lg transition-all flex gap-6 items-start group">
        <div class="shrink-0 w-20 h-20 bg-indigo-50 rounded-2xl flex flex-col items-center justify-center group-hover:bg-indigo-100 transition-colors">
          <span class="text-2xl">📅</span>
        </div>
        <div class="flex-1">
          <h4 class="font-bold text-lg text-gray-800 group-hover:text-indigo-600 transition-colors">{{this.title}}</h4>
          <p class="text-sm text-gray-500 mt-1">{{this.description}}</p>
          <div class="flex flex-wrap gap-3 mt-3 text-xs text-gray-400">
            <span>📅 {{dateFormat this.startDate}}</span>
            {{#if this.endDate}}<span>→ {{dateFormat this.endDate}}</span>{{/if}}
            {{#if this.location}}<span>📍 {{this.location}}</span>{{/if}}
          </div>
        </div>
      </div>
      {{/each}}
    </div>
    {{else}}
    <div class="text-center py-20 bg-gray-50 rounded-3xl border border-dashed">
      <div class="text-5xl mb-4">📅</div>
      <h3 class="text-xl font-bold text-gray-600">Belum Ada Agenda</h3>
    </div>
    {{/if}}
  </div>
</section>`

// =============================================
// TEMPLATE: UNDUHAN / DOKUMEN
// =============================================
export const TEMPLATE_UNDUHAN_HBS = `<section class="py-20">
  <div class="max-w-4xl mx-auto px-8">
    <nav class="text-sm text-gray-400 mb-6"><a href="{{base}}" class="hover:text-indigo-600">Beranda</a> / <span class="text-gray-700">Unduhan</span></nav>
    <div class="text-center mb-16">
      <span class="text-indigo-600 font-bold text-sm uppercase tracking-widest">Dokumen</span>
      <h2 class="text-4xl font-black mt-2">Pusat Unduhan</h2>
      <p class="text-gray-500 mt-3">Unduh dokumen, formulir, dan berkas penting dari sekolah.</p>
    </div>
    {{#if tenant.documents}}
    <div class="space-y-4">
      {{#each tenant.documents}}
      <a href="{{this.fileUrl}}" target="_blank" class="block bg-white rounded-xl p-5 border hover:border-indigo-200 hover:shadow-md transition-all group">
        <div class="flex items-center gap-4">
          <div class="shrink-0 w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center text-xl group-hover:bg-red-100 transition-colors">📄</div>
          <div class="flex-1 min-w-0">
            <h4 class="font-bold text-gray-800 group-hover:text-indigo-600 transition-colors">{{this.title}}</h4>
            <p class="text-xs text-gray-400 mt-0.5">{{dateFormat this.createdAt}}</p>
          </div>
          <div class="shrink-0 text-indigo-600 font-bold text-sm">Unduh ↓</div>
        </div>
      </a>
      {{/each}}
    </div>
    {{else}}
    <div class="text-center py-20 bg-gray-50 rounded-3xl border border-dashed">
      <div class="text-5xl mb-4">📂</div>
      <h3 class="text-xl font-bold text-gray-600">Belum Ada Dokumen</h3>
    </div>
    {{/if}}
  </div>
</section>`

// =============================================
// TEMPLATE: GURU DETAIL
// =============================================
export const TEMPLATE_GURU_DETAIL_HBS = `<section class="py-20">
  <div class="max-w-4xl mx-auto px-8">
    <nav class="text-sm text-gray-400 mb-8"><a href="{{base}}" class="hover:text-indigo-600">Beranda</a> / <a href="{{base}}/gtk" class="hover:text-indigo-600">Guru & Staf</a> / <span class="text-gray-700">{{staff.name}}</span></nav>
    <div class="bg-white rounded-3xl shadow-lg border overflow-hidden">
      <div class="md:flex">
        <div class="md:w-1/3 shrink-0">
          {{#if staff.imageUrl}}
          <img src="{{staff.imageUrl}}" alt="{{staff.name}}" class="w-full h-72 md:h-full object-cover">
          {{else}}
          <div class="w-full h-72 md:h-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-6xl">👤</div>
          {{/if}}
        </div>
        <div class="p-8 md:p-12 flex-1">
          <span class="text-indigo-600 font-bold text-xs uppercase tracking-widest">{{staff.role}}</span>
          <h2 class="text-3xl font-black mt-2 mb-4">{{staff.name}}</h2>
          {{#if staff.nip}}<p class="text-sm text-gray-400 mb-4">NIP: {{staff.nip}}</p>{{/if}}
          {{#if staff.education}}<div class="flex items-center gap-2 text-sm text-gray-600 mb-4">🎓 {{staff.education}}</div>{{/if}}
          {{#if staff.bio}}
          <div class="prose text-gray-600 mt-6 pt-6 border-t">
            <p>{{staff.bio}}</p>
          </div>
          {{/if}}
          {{#if staff.email}}<a href="mailto:{{staff.email}}" class="inline-flex items-center gap-2 mt-6 text-indigo-600 font-semibold hover:underline">✉️ {{staff.email}}</a>{{/if}}
        </div>
      </div>
    </div>
    <div class="text-center mt-10">
      <a href="{{base}}/gtk" class="text-indigo-600 font-semibold hover:underline">← Kembali ke Daftar Guru</a>
    </div>
  </div>
</section>`

// =============================================
// STARTER CSS & JS
// =============================================
export const STARTER_CSS = `/* ═══════════════════════════════════════════
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

export const STARTER_JS = `// ═══════════════════════════════════════════
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
