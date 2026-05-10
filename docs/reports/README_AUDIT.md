# Dokumen Laporan Audit Produksi - SchoolPro SaaS

## 1. Executive Summary (Ringkasan Eksekutif)

- **Status Kesehatan Kode:** **7.5 / 10** (Layak Produksi dengan Catatan Kritis)
- **Konteks:** Secara fundamental, arsitektur *Multi-tenant* SchoolPro sudah sangat solid. Implementasi `tenantId` di tingkat database dan proteksi `tenant-guard.ts` telah membangun tembok isolasi data yang kuat. Namun, terdapat celah dalam optimalisasi *frontend* (Core Web Vitals) dan efisiensi *caching* yang berpotensi menjadi *bottleneck* ketika aplikasi *scaling* ke ratusan tenant.

### **Critical Path (Ancaman Stabilitas & Performa):**
1. **Unoptimized Media Delivery (High Risk):** Penggunaan tag HTML murni `<img>` yang masif (ditemukan lebih dari 60 lokasi) alih-alih `next/image`, berpotensi merusak *Core Web Vitals* (LCP & CLS) dan menghabiskan *bandwidth* Vercel secara eksponensial.
2. **Aggressive Cache Invalidation (Medium Risk):** Penggunaan `revalidatePath` yang terlalu luas pada *Server Actions* berpotensi memicu *rebuild* halaman yang tidak perlu, membebani CPU server.
3. **Connection Pooling di Serverless (Medium Risk):** Mengingat penggunaan Prisma ORM di lingkungan Next.js Serverless, ketiadaan mekanisme *connection pooling* pihak ketiga (seperti Prisma Accelerate atau pgBouncer) berpotensi memicu error `Too many connections` saat lonjakan trafik PPDB.

---

## 2. Next.js & SaaS Architecture Audit

| Kategori | Temuan Observasi | Tingkat Risiko | Dampak Bisnis |
| :--- | :--- | :---: | :--- |
| **Tenant Isolation & Security** | Penjagaan (Guards) di `api-utils.ts` (`requireTenantMembership`) dan *Server Actions* sudah terstruktur dengan baik. Namun, verifikasi *cross-tenant* harus selalu diwaspadai jika ada *nested relations* di Prisma yang lupa disaring dengan `tenantId`. | **Low** | Kebocoran data antar sekolah dapat merusak reputasi SaaS. (Saat ini aman, butuh konsistensi tim). |
| **Next.js App Router Practices** | Pola *Server Components* dan *Client Components* (`"use client"`) sudah terpisah. *Server Actions* digunakan secara ekstensif untuk mutasi (seperti di `staff.ts`, `program.ts`). | **Low** | Stabilitas arsitektur yang baik mempercepat *onboarding* developer baru. |
| **Data Fetching & Caching** | Mayoritas mutasi menggunakan `revalidatePath(..., "page")` alih-alih `revalidateTag`. Ini memaksa sistem membuang seluruh *cache* rute, alih-alih entitas spesifik. | **Medium** | Beban *server/database* membengkak untuk merender ulang halaman yang 90% kontennya tidak berubah. |
| **Performance & Core Web Vitals** | Ditemukan puluhan elemen `<img src="...">` (contoh: di galeri, logo tenant, avatar) yang dirender tanpa optimasi format (WebP/AVIF), dimensi, atau *lazy loading*. | **High** | Waktu *loading* situs sekolah yang lambat akan memicu *bounce rate* tinggi dan menurunkan SEO sekolah. |
| **Code Maintainability** | Pemisahan antara UI, Server Actions, dan utilitas API sudah *scalable*. Penggunaan Zod untuk validasi memberikan *type-safety* yang prima. | **Low** | Meminimalisir utang teknis (*Technical Debt*). |

---

## 3. Deep Dive & Actionable Recommendations

### Temuan 1: Rendering Gambar Tidak Optimal (Unoptimized Images)
> [!WARNING]
> Tag `<img>` bawaan HTML mengunduh file gambar dengan ukuran aslinya. Jika sekolah mengunggah foto galeri sebesar 5MB, browser klien akan mengunduh 5MB secara penuh. Ini akan menghabiskan kuota *bandwidth* infrastruktur Anda dan memperlambat *rendering*.

**Solusi:** Migrasi secara menyeluruh ke komponen `next/image` buatan Next.js yang otomatis menangani kompresi WebP, perubahan ukuran cerdas (*smart resizing*), dan *lazy loading*.

**Refactor (Before vs After):**
```tsx
// ❌ BEFORE (Contoh pada Gallery Grid)
<img 
  src={item.url} 
  alt={`Foto ${i + 1}`} 
  className="h-full w-full object-cover" 
/>

// ✅ AFTER (Rekomendasi Best Practice)
import Image from "next/image"

<div className="relative h-full w-full">
  <Image 
    src={item.url} 
    alt={`Foto ${i + 1}`} 
    fill
    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
    className="object-cover"
    placeholder="blur"
    blurDataURL="data:image/png;base64,iVBORw..." // Optional: Low Quality Image Placeholder
  />
</div>
```
*(Catatan: Anda wajib menambahkan domain penyimpanan (seperti AWS S3 / Vercel Blob) ke dalam konfigurasi `images.remotePatterns` di `next.config.js`).*

### Temuan 2: Granular Cache Invalidation
> [!TIP]
> Di Next.js App Router, gunakan `revalidateTag` daripada `revalidatePath` jika memungkinkan. `revalidatePath` menghapus *cache* secara *brute-force* pada satu URL, sedangkan `revalidateTag` memungkinkan Anda menargetkan data spesifik.

**Refactor (Before vs After):**
```typescript
// ❌ BEFORE (Global Path Purging)
export async function updateStaff(...) {
  // ... update DB
  revalidatePath(`/site/${tenant.slug}/gtk`, "page")
  revalidatePath(`/site/${tenant.slug}`, "page")
}

// ✅ AFTER (Tag-Based Invalidation)
export async function updateStaff(...) {
  // ... update DB
  // Hanya menghapus cache dari fetch request yang di-tag 'staff-{tenantId}'
  revalidateTag(`staff-${tenant.slug}`) 
}
```

### Temuan 3: Mitigasi Connection Exhaustion (Prisma)
> [!CAUTION]
> Lingkungan *Serverless Function* (Vercel/AWS Lambda) berpotensi membuka ratusan koneksi Prisma baru secara independen jika terjadi lonjakan trafik. Hal ini dapat menghancurkan alokasi koneksi PostgreSQL.

**Solusi:** Pastikan instance Prisma Anda (di `src/lib/db.ts`) dipasang dengan arsitektur Singleton (yang sepertinya sudah ada), namun pertimbangkan untuk menambahkan batas koneksi di URL Database `?connection_limit=10&pool_timeout=15` atau migrasi ke **Prisma Accelerate / pgBouncer**.

---

## 4. Action Plan & Remediation Checklist

Lakukan langkah-langkah berikut di *branch* `feature/audit-refactor` sebelum digabungkan (*merge*) ke `main`:

- [ ] **Fase 1: Optimasi Aset (Performance)**
  - Cari dan ganti semua tag `<img ` menjadi `<Image ` (khususnya di halaman publik/landing page sekolah).
  - Daftarkan *hostname* Vercel Blob / S3 Anda ke `next.config.ts`.
- [ ] **Fase 2: Efisiensi Database & Caching**
  - Evaluasi *Server Actions* (seperti `staff.ts`, `program.ts`) untuk menggunakan sistem *tagging* (opsional, jika dirasa sering terjadi lonjakan akses).
  - Tinjau ulang `prisma/schema.prisma` dan URL koneksi `.env` untuk optimasi parameter.
- [ ] **Fase 3: Keamanan Skala Enterprise**
  - Terapkan *Rate Limiting* (dengan Redis/Upstash) pada *Server Actions* kritis seperti formulir pengajuan PPDB untuk mencegah serangan bot.
- [ ] **Fase 4: Pengujian Produksi**
  - Lakukan *build* simulasi (`npm run build && npm run start`) untuk mendeteksi *hydration error* yang mungkin muncul pasca-refactor komponen `Image`.

---

## 5. Conclusion (Kesimpulan Penutup)

Secara arsitektur fondasi, **SchoolPro sudah sangat layak menyandang status 'Production-Ready'**. Pemisahan antar tenant dilakukan secara disiplin dan struktur direktori App Router yang digunakan sangat terorganisir. Tidak diperlukan perombakan fundamental yang masif.

Namun, untuk memastikan platform tetap bernapas ringan di bawah tekanan trafik tinggi (seperti saat musim PPDB atau ujian), **optimasi Core Web Vitals melalui penyesuaian aset gambar (`next/image`) adalah hal yang tidak bisa ditawar (mandatory)**. Setelah ceklis remediasi di atas diselesaikan, SchoolPro siap untuk *scaling* secara agresif ke ratusan sekolah tanpa kendala berarti.
