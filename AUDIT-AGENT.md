"Saya ingin kamu bertindak sebagai **Lead Technical Auditor & Senior Next.js Architect** untuk mengevaluasi project SaaS saya (SchoolPro). Aplikasi ini adalah platform **Multi-tenant SaaS** yang dibangun menggunakan **Next.js (App Router), Prisma ORM, PostgreSQL, NextAuth, Zod, dan TailwindCSS**.

Lakukan audit mendalam terhadap seluruh struktur, arsitektur, dan kode base saat ini. Buatkan **Dokumen Laporan Audit Produksi** yang sangat komprehensif, kritis, dan formal. 

Susun dokumen tersebut dengan struktur sebagai berikut:

## 1. Executive Summary (Ringkasan Eksekutif)
- **Status Kesehatan Kode:** Berikan penilaian objektif (Skor 1-10) berdasarkan standar *Enterprise/Production*.
- **Critical Path:** 3-5 daftar temuan paling kritis yang mengancam stabilitas, keamanan, atau kebocoran data (*data leak*) antar tenant.

## 2. Next.js & SaaS Architecture Audit (Temuan Spesifik)
Fokuskan pencarian pada aspek fundamental SaaS dan ekosistem Next.js. Sajikan temuan dalam bentuk **Tabel Audit** (Kolom: Kategori, Temuan, Tingkat Risiko, Dampak Bisnis). Kategori wajib:
- **Tenant Isolation & Security:** Adakah celah di mana Tenant A bisa mengakses data Tenant B (Cross-Tenant Data Leak)? Apakah *Server Actions* dan *API Routes* sudah memvalidasi otorisasi peran (RBAC) dan kepemilikan tenant dengan aman?
- **Next.js App Router Practices:** Apakah pemisahan *Client Components* (`"use client"`) dan *Server Components* sudah optimal? Apakah penggunaan *Server Actions* berlebihan atau kurang terstruktur?
- **Data Fetching & Caching:** Evaluasi penggunaan `revalidatePath`, manajemen *Cache*, dan risiko koneksi Prisma (Connection Pooling) di environment Next.js.
- **Performance & Core Web Vitals:** Evaluasi *loading state*, optimasi *Next/Image*, *layout shift*, dan *hydration error*.
- **Code Maintainability:** Apakah *Business Logic* tercampur dengan *UI Components*? Apakah struktur *folder* sudah *scalable* untuk tim yang membesar?

## 3. Deep Dive & Actionable Recommendations (Analisis Mendalam)
- Untuk setiap temuan level *High/Critical*, berikan penjelasan mendalam **mengapa** ini berbahaya.
- Sertakan **Blok Kode Rekomendasi (Refactor: Before vs After)** yang menerapkan praktik terbaik (*Best Practices*).
- Jika menyangkut Prisma, berikan rekomendasi query yang lebih efisien atau perbaikan schema.

## 4. Action Plan & Remediation Checklist (Daftar Tindak Lanjut)
- Langkah-langkah taktis dan terurut yang harus saya lakukan di branch `feature/audit-refactor` sebelum kode ini di-merge ke `main`.
- Strategi migrasi atau strategi *deployment* via GitHub Actions (CI/CD) jika ada perubahan struktur yang besar.

## 5. Conclusion (Kesimpulan Penutup)
- Pernyataan profesional apakah arsitektur saat ini sudah layak menyandang status **'Production-Ready'** untuk melayani ratusan Tenant, atau masih membutuhkan perombakan *fundamental* yang masif.

Tampilkan dokumen ini menggunakan format Markdown standar GitHub (*GitHub Flavored Markdown*) yang elegan dan menggunakan *Alerts* (seperti `> [!WARNING]`, `> [!IMPORTANT]`) agar rapi saat saya salin ke `README_AUDIT.md`."