"Saya ingin kamu bertindak sebagai **Principal Web Performance Engineer & SEO Specialist** untuk mengevaluasi *Frontend* aplikasi SchoolPro (Next.js 14 App Router). Platform ini bergantung pada *Landing Page* sekolah yang cepat, mudah ditemukan di Google (SEO), dan tidak membuat baterai HP wali murid cepat habis.

Lakukan audit teknis khusus terhadap *Core Web Vitals*, *Metatags*, dan inefisiensi pengiriman *Asset* (Gambar/JS). Buatkan **Dokumen Laporan Audit Performance & SEO**.

Susun dokumen dengan struktur:

## 1. Executive Performance Summary
- **Core Web Vitals & INP Prediction:** (Skor 1-100) Prediksi metrik krusial Google Lighthouse (LCP, CLS, dan **INP / Interaction to Next Paint**). Soroti biaya *React Hydration* yang memblokir *Main Thread*.
- **Top 3 SEO & Traffic Killers:** Masalah teknis terbesar yang membuat situs sekolah gagal meraih *Rich Snippets* di Google atau *loading* lama (terutama bagi *mobile browser*).

## 2. Advanced SEO & Edge Rendering Audit (Tabel Performa)
Sajikan dalam **Tabel Audit** (Kategori, Temuan, Tingkat Keparahan, Perbaikan). Kategori wajib:
- **Edge Caching & Rendering Strategy (ISR vs CSR):** Apakah arsitektur memanfaatkan *Incremental Static Regeneration* (ISR) / `stale-while-revalidate`? Ataukah semua *request* publik menembus *database* secara buta, mengancam *availability* dan memperburuk TTFB (*Time to First Byte*)?
- **Multi-Tenant SEO Architecture:** Apakah *platform* secara dinamis memproduksi `sitemap.xml` dan `robots.txt` independen untuk setiap domain/subdomain tenant? Apakah ada `rel="canonical"` untuk mematikan kanibalisasi konten antar domain?
- **Structured Data (JSON-LD):** Apakah artikel atau halaman sekolah menyuntikkan *Schema.org JSON-LD* (misal: `Organization`, `Article`, `Event`) untuk meraup Google *Rich Snippets*?
- **Image & Media Next-Gen Optimization:** Apakah logo/banner dimuat menggunakan `<Image priority>` dengan rasio (`width/height`) pasti guna menangkis *Cumulative Layout Shift (CLS)* dan menekan angka LCP di bawah 2.5 detik?
- **Dynamic Open Graph & Twitter Cards:** Apakah *Server Components* menyajikan `generateMetadata` secara komprehensif, menampilkan *preview* cantik bagi setiap URL yang di- *share* ke WhatsApp?
- **Third-Party Script & Hydration Cost (INP):** Apakah skrip *analytics*/eksternal di-*defer* menggunakan `@next/third-parties` atau *Partytown* agar *Interaction to Next Paint (INP)* tidak memburuk?

## 3. Deep Dive: SEO & LCP Bottlenecks
- Jelaskan secara teknis mengapa arsitektur saat ini mencegah *ranking* tinggi di mesin pencari lokal.

## 4. Performance Tuning Roadmap
- **Fase 1: INP, Asset Opt, & Open Graph (H+1 - H+3):** Penertiban ukuran gambar via `next/image`, injeksi meta tags OG dinamis, dan penundaan pemuatan *script* eksternal.
- **Fase 2: Multi-Tenant Technical SEO (H+4 - H+7):** Integrasi *Dynamic Sitemaps* per *tenant*, penyediaan Canonical URLs, dan injeksi komponen *JSON-LD Structured Data*.
- **Fase 3: Edge Delivery & ISR Caching (H+8 - H+14):** Implementasi fungsi `generateStaticParams` dipadu *Route Segment Config* untuk *caching* statis (ISR), meminimalisir beban *database* di jam sibuk.

Gunakan *GitHub Flavored Markdown* dan simpan sebagai `README_SEO_PERF_AUDIT.md`."
