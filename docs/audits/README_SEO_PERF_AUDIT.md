# Enterprise Frontend Performance & SEO Audit Report: SchoolPro SaaS

> [!CAUTION]
> **Tujuan Dokumen:** Evaluasi kehandalan *Frontend* (Next.js 14 App Router) dan Arsitektur SEO untuk profil sekolah (*Tenants*). Dokumen ini membedah inefisiensi pengiriman aset, potensi *Hydration Bottlenecks*, dan efektivitas *Metatags*.

## 1. Executive Performance Summary

- **Core Web Vitals & INP Prediction:** **8.5 / 10** (Sangat Baik)
- **Status:** **Telah menerapkan *Edge Caching* dan *Dynamic SEO*, dengan sedikit isu LCP dan INP pada skrip pihak ketiga dan aset statis.**

**Top 3 SEO & Traffic Killers (Risiko Tersisa):**
1. **Raw Script Tags untuk Analytics (INP Killer):** Skrip analitik *Umami* disematkan menggunakan `<script defer src="...">` HTML murni di dalam `layout.tsx`. Hal ini dapat memblokir eksekusi *Main Thread* React selama proses *Hydration*, sehingga merusak skor *Interaction to Next Paint (INP)*.
2. **Penggunaan Tag HTML `<img>` Murni pada Galeri & Partner:** Walau banyak halaman telah menggunakan `<Image>` (Next.js Image Optimization), komponen berat seperti *Gallery Lightbox* dan *Partnerships Section* justru lolos menggunakan `<img src="..." loading="eager">`. Ini menyebabkan *Cumulative Layout Shift (CLS)* dan lonjakan *Largest Contentful Paint (LCP)* karena gambar tidak diubah ke format Next-Gen (WebP/AVIF).
3. **Canonical URLs:** Mekanisme `rel="canonical"` belum sepenuhnya digabungkan ke seluruh rute (hanya di *homepage*). Hal ini bisa menyebabkan *Content Cannibalization* jika rute dapat diakses dari `namasekolah.schoolpro.id` sekaligus `domainutama.com/site/namasekolah`.

---

## 2. Advanced SEO & Edge Rendering Audit

| Kategori Evaluasi | Temuan & Analisis | Tingkat Keparahan | Rekomendasi / Perbaikan |
| :--- | :--- | :---: | :--- |
| **Edge Caching & Rendering (ISR)** | **SANGAT BAIK.** Rute *Public Website* memanfaatkan metode resolusi *subdomain* dan terhubung erat dengan `unstable_cache` untuk meredam jutaan kunjungan halaman per detik. | 🟢 Aman | Pertahankan struktur saat ini. |
| **Multi-Tenant SEO Architecture** | **SANGAT BAIK.** Aplikasi merender file `sitemap.ts` dinamis untuk setiap sekolah, mengekstrak direktori halaman (`/berita`, `/prestasi`, dll) dengan presisi. | 🟢 Aman | Pastikan pendaftaran *Google Search Console* dilakukan secara *Wildcard Subdomain*. |
| **Structured Data (JSON-LD)** | **SANGAT BAIK.** Skema `EducationalOrganization` JSON-LD sudah disuntikkan secara statis di `layout.tsx`. Sekolah akan mendapatkan *Rich Snippets* di hasil pencarian. | 🟢 Aman | Pertimbangkan menambahkan tipe `Article` untuk halaman `/berita/[id]`. |
| **Image & Media Optimization** | **PERLU PERBAIKAN.** *Raw* `<img>` tag ditemukan berserakan di modul `partnerships-section.tsx` dan `gallery/page.tsx` dengan `loading="eager"`. | 🟡 Sedang | Migrasi seluruh `<img>` menjadi `<Image>` dari `next/image` dan gunakan properti `sizes`. |
| **Open Graph & Twitter Cards** | **SANGAT BAIK.** Seluruh rute memiliki fungsi `generateMetadata()` yang mengekstrak data dari `tenant`, memproduksi pratinjau kartu WhatsApp dan Twitter yang sangat memikat. | 🟢 Aman | Tambahkan validasi *fallback image* jika `tenant.logo` kosong. |
| **Third-Party Script & Hydration** | **PERLU PERBAIKAN.** Pemanggilan *Umami Analytics* mem-*bypass* strategi asinkronus `next/script`. | 🟡 Sedang | Ubah `<script src="..."/>` menjadi `<Script strategy="afterInteractive" src="..."/>`. |

---

## 3. Deep Dive: SEO & LCP Bottlenecks

### Mengapa `<img loading="eager">` Menghancurkan LCP?
Saat Anda merender `<img src={partner.imageUrl} loading="eager">` pada komponen *Partnerships*:
- *Browser* dipaksa mengunduh *file* gambar ukuran asli (terkadang hingga 5MB JPG) seketika sebelum halaman selesai digambar (*paint*).
- Jika *user* membuka via koneksi 3G/4G pelan, layar akan putih selama beberapa detik. Next.js Image Optimization (`<Image>`) memotong berat 5MB menjadi ~80KB dalam format WebP secara terpusat (*On-the-Fly*), membuat *Loading* hampir instan.

---

## 4. Performance Tuning Roadmap

Langkah aman yang diusulkan untuk fase optimasi:

- **Fase 1: INP & Script Deferral (H+1)**
  - Mengganti tag `<script>` statis pada `layout.tsx` menjadi komponen `<Script>` bawaan Next.js dengan `strategy="afterInteractive"`.
  
- **Fase 2: Image Component Overhaul (H+2 - H+3)**
  - Refaktor komponen `partnerships-section.tsx` dan `gallery-grid.tsx` dengan `<Image>`.
  - Jika `imageUrl` tidak memiliki rasio baku, manfaatkan properti `fill` digabung dengan *CSS object-fit* `object-cover` untuk menghindari pergeseran layout (CLS).

- **Fase 3: Multi-Domain Canonical Tags (H+4)**
  - Menginjeksi `alternates: { canonical: url }` ke dalam `generateMetadata` untuk mengarahkan Googlebot memprioritaskan domain kustom jika *tenant* telah membayarnya, bukan sekadar indeks di `schoolpro.id`.
