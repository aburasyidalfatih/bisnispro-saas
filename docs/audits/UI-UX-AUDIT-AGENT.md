"Saya ingin kamu bertindak sebagai **Lead SaaS Product Designer & UX Architect** untuk mengevaluasi project SaaS saya (SchoolPro). Aplikasi ini adalah platform **Massive-Scale Multi-tenant SaaS** modern.

Lakukan audit visual dan struktural secara mendalam terhadap seluruh halaman (Landing Page, Dashboard Admin, Panel Siswa, Panel Guru, dan Halaman Ortu). Buatkan **Dokumen Laporan Audit UI/UX Enterprise** yang tajam, sangat estetis, dan sangat kritis terhadap inkonsistensi desain.

Susun dokumen tersebut dengan struktur sebagai berikut:

## 1. Executive Summary (Ringkasan Eksekutif UI/UX)
- **SaaS UX Score:** Berikan penilaian objektif (Skor 1-10) berdasarkan standar *Premium B2B/B2C SaaS* (seperti Vercel, Linear, Stripe).
- **Critical Friction Points:** 3-5 daftar masalah UX paling fatal yang menyebabkan pengguna (guru/ortu) bingung, frustrasi, atau melakukan kesalahan fatal (misal: tombol hapus tanpa konfirmasi).

## 2. Visual & Interaction Audit (Tabel Temuan Desain)
Sajikan temuan dalam bentuk **Tabel Audit** (Kategori, Temuan, Tingkat Keparahan UX, Dampak Bisnis). Kategori wajib:
- **Design System Consistency:** Apakah elemen (Tombol, Input, Modal, Warna, Tipografi, Jarak/Spacing) konsisten di seluruh halaman? Apakah ada variasi warna '*primary*' yang tidak perlu?
- **Micro-interactions & Feedback:** Apakah setiap aksi *mutational* (Submit, Delete, Edit) memiliki *Loading State* yang jelas? Apakah ada *Toast/Snackbar* untuk status Berhasil/Gagal?
- **Empty States & Onboarding:** Bagaimana tampilan tabel atau halaman saat data kosong? Apakah layarnya hanya "putih kosong" (Buruk) atau ada ilustrasi indah dengan *Call-to-Action* yang jelas (Premium)?
- **Responsive & Mobile-First:** Evaluasi kegunaan panel *Dashboard* (khususnya Panel Siswa & Ortu) saat diakses melalui *smartphone* (tabel meluap, tombol terlalu kecil, navigasi tertutup).
- **Accessibility (a11y) & Contrast:** Apakah kontras teks memadai untuk dibaca oleh orang tua murid? Apakah form input bisa diakses menggunakan `Tab` keyboard secara berurutan?

## 3. Deep Dive & UI Polish Recommendations
- Untuk setiap kelemahan *UI/UX*, berikan analisis mengapa itu menurunkan kepercayaan klien (sekolah).
- Sertakan **Blok Kode (Refactor Shadcn UI/TailwindCSS)** atau saran struktur komponen untuk menyelaraskan desain dengan *Best Practices* Modern Web App.

## 4. UI/UX Refactoring Roadmap (Peta Jalan Pemolesan Visual)
- **Fase 1: Feedback & Skeleton (H+1 - H+3):** Penambahan *Loading Skeleton*, *Spinners*, dan standardisasi *Toast Notifications* di seluruh aplikasi.
- **Fase 2: Layout & Empty States (H+4 - H+7):** Standarisasi jarak komponen (`spacing`), pembuatan komponen khusus *Empty State*, dan *Mobile-responsive Table*.
- **Fase 3: Premium Polish (H+8 - H+14):** Penambahan transisi/animasi transparan (Framer Motion / CSS transition), penyempurnaan tipografi (`Inter`/`Geist`), dan standardisasi mode gelap (*Dark Mode*).

## 5. Conclusion (Kesimpulan Penutup)
- Kesimpulan: Apakah antarmuka saat ini terasa seperti "Aplikasi Murahan" atau sudah layak dijual secara masif sebagai "SaaS Enterprise Premium"?

Tampilkan dokumen ini menggunakan format Markdown standar GitHub (*GitHub Flavored Markdown*) yang elegan dan menggunakan *Alerts* agar rapi saat saya salin ke `README_UX_AUDIT.md`."
