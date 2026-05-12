"Saya ingin kamu bertindak sebagai **Lead SaaS Product Designer & UX Architect** untuk mengevaluasi project SaaS saya (SchoolPro). Aplikasi ini adalah platform **Massive-Scale Multi-tenant SaaS** modern.

Lakukan audit visual dan struktural secara mendalam terhadap seluruh halaman (Landing Page, Dashboard Admin, Panel Siswa, Panel Guru, dan Halaman Ortu). Buatkan **Dokumen Laporan Audit UI/UX Enterprise** yang tajam, sangat estetis, dan sangat kritis terhadap inkonsistensi desain.

Susun dokumen tersebut dengan struktur sebagai berikut:

## 1. Executive Summary (Ringkasan Eksekutif UI/UX)
- **SaaS UX Score:** Berikan penilaian objektif (Skor 1-10) berdasarkan standar *Premium B2B/B2C SaaS* (seperti Vercel, Linear, Stripe).
- **Critical Friction Points:** 3-5 daftar masalah UX paling fatal yang menyebabkan pengguna (guru/ortu) bingung, frustrasi, atau melakukan kesalahan fatal (misal: tombol hapus tanpa konfirmasi).

## 2. Visual, Interaction & Cognitive Audit (Tabel Temuan Desain)
Sajikan temuan dalam bentuk **Tabel Audit** (Kategori, Temuan, Tingkat Keparahan UX, Dampak Bisnis). Kategori wajib:
- **Information Architecture (IA) & Click-Depth:** Apakah hierarki menu logis? Evaluasi seberapa banyak klik yang dibutuhkan (friction) untuk menyelesaikan tugas krusial (misal: pendaftaran siswa atau pembuatan tagihan).
- **Cognitive Load & Data Visualization:** Untuk dasbor yang padat (tabel jutaan baris), apakah antarmuka memicu kelelahan mata (*Cognitive Overload*)? Apakah *Data Grid* mendukung *Advanced Filtering*, *Pagination*, dan penyortiran tanpa merusak *layout* seluler?
- **Design System Consistency:** Apakah elemen (Tombol, Input, Modal, Warna, Tipografi, Jarak/Spacing) selaras sempurna di seluruh halaman? Apakah rasio warna "*primary*" digunakan dengan elegan?
- **Perceived Performance & Micro-interactions:** Apakah aplikasi mengimplementasikan *Optimistic UI* untuk tugas ringan, atau terus memaksa pengguna menatap *Loading Spinner*? Apakah aksi mutasional memiliki *Toast* sukses/gagal yang komunikatif?
- **Empty States & Onboarding:** Bagaimana sistem menangani *zero-data*? Apakah menampilkan ruang putih ("*Dead End*") atau menyajikan ilustrasi *Onboarding* yang mengarahkan pengguna melakukan *Call-to-Action* (CTA) layaknya *Premium SaaS*?
- **Responsive & Mobile-First Data:** Evaluasi keandalan Dasbor Ortu & Siswa di perangkat seluler terkecil (resolusi 320px). Apakah tabel ditransformasi menjadi *Card List* yang *touch-friendly*?
- **Accessibility (WCAG 2.1 AA/AAA) & Contrast:** Apakah aplikasi lolos audit kontras untuk kelompok orang tua lanjut usia? Apakah navigasi murni menggunakan *Keyboard* (`Tab`, `Space`, `Enter`) didukung secara *native* pada komponen *form* dan *modal*?

## 3. Deep Dive & UI Polish Recommendations
- Untuk setiap kelemahan *UI/UX*, berikan analisis mengapa itu menurunkan kepercayaan klien (sekolah).
- Sertakan **Blok Kode (Refactor Shadcn UI/TailwindCSS)** atau saran struktur komponen untuk menyelaraskan desain dengan *Best Practices* Modern Web App.

## 4. UI/UX Refactoring Roadmap (Peta Jalan Pemolesan Visual)
- **Fase 1: Information Architecture & Skeleton (H+1 - H+3):** Restrukturisasi kedalaman klik navigasi, implementasi *Skeleton Loading* vs *Optimistic UI*, dan standardisasi *Toast Notifications* global.
- **Fase 2: Layout, Empty States, & Data Grids (H+4 - H+7):** Standarisasi metrik spasial (`spacing`), penciptaan komponen `<EmptyState />` premium, dan konversi tabel *desktop* ke *Mobile Cards*.
- **Fase 3: Silicon Valley Polish (H+8 - H+14):** Eksekusi transisi *hardware-accelerated* via Framer Motion, lokalisasi tipografi (*Inter/Geist*), penyempurnaan skala kontras *Dark Mode*, dan dukungan a11y *screen-reader*.

## 5. Conclusion (Kesimpulan Penutup)
- Kesimpulan: Apakah antarmuka saat ini terasa seperti "Aplikasi Murahan" atau sudah layak dijual secara masif sebagai "SaaS Enterprise Premium"?

Tampilkan dokumen ini menggunakan format Markdown standar GitHub (*GitHub Flavored Markdown*) yang elegan dan menggunakan *Alerts* agar rapi saat saya salin ke `README_UX_AUDIT.md`."
