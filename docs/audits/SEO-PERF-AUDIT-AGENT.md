"Saya ingin kamu bertindak sebagai **Principal Web Performance Engineer & SEO Specialist** untuk mengevaluasi *Frontend* aplikasi SchoolPro (Next.js 14 App Router). Platform ini bergantung pada *Landing Page* sekolah yang cepat, mudah ditemukan di Google (SEO), dan tidak membuat baterai HP wali murid cepat habis.

Lakukan audit teknis khusus terhadap *Core Web Vitals*, *Metatags*, dan inefisiensi pengiriman *Asset* (Gambar/JS). Buatkan **Dokumen Laporan Audit Performance & SEO**.

Susun dokumen dengan struktur:

## 1. Executive Performance Summary
- **Core Web Vitals Prediction:** (Skor 1-100) prediksi skor Lighthouse untuk LCP, FID/INP, dan CLS.
- **Top 3 Traffic Killers:** Masalah terbesar yang membuat sekolah sulit ditemukan di Google atau *loading* lama di jaringan 3G.

## 2. SEO & Rendering Audit (Tabel Performa)
Sajikan dalam **Tabel Audit** (Kategori, Temuan, Tingkat Keparahan, Perbaikan). Kategori wajib:
- **Rendering Strategy (SSR vs CSR):** Apakah halaman publik (Profil Sekolah, Artikel) menggunakan Server-Side Rendering (SSR) / Static Site Generation (SSG) agar terindeks SEO, atau malah memblokir *crawler* dengan `"use client"` yang tidak perlu?
- **Image & Media Optimization:** Apakah logo dan banner raksasa dimuat menggunakan tag `<img>` biasa, atau sudah dioptimasi formatnya (WebP/AVIF) dengan `<Image>` Next.js lengkap dengan atribut `priority`?
- **Dynamic SEO Metatags:** Apakah setiap artikel/pengumuman sekolah secara dinamis menghasilkan *Open Graph* (OG Image) dan *Twitter Cards* agar terlihat menarik saat di-*share* ke grup WhatsApp?
- **Bundle Size & Layout Shifts (CLS):** Apakah pemuatan *font* pihak ketiga atau komponen lambat menyebabkan layar bergeser (Layout Shift) saat *user* sedang membaca?

## 3. Deep Dive: SEO & LCP Bottlenecks
- Jelaskan secara teknis mengapa arsitektur saat ini mencegah *ranking* tinggi di mesin pencari lokal.

## 4. Performance Tuning Roadmap
- **Fase 1: Image Optimization & Metatags (H+1 - H+3)**
- **Fase 2: SSG Transition & Font Loading (H+4 - H+7)**

Gunakan *GitHub Flavored Markdown* dan simpan sebagai `README_SEO_PERF_AUDIT.md`."
