# 🛡️ Next.js Production Audit Report: SchoolPro SaaS

**Auditor:** Lead Technical Auditor & Senior Next.js Architect  
**Project:** SchoolPro (Multi-tenant SaaS)  
**Tech Stack:** Next.js 14/15 App Router, Prisma ORM, PostgreSQL, NextAuth, Zod, TailwindCSS  
**Date:** 05 Mei 2026

---

## 1. Executive Summary (Ringkasan Eksekutif)

- **Status Kesehatan Kode:** **7.5 / 10 (Good, tapi butuh refactor fundamental di beberapa area)**
- **Kesimpulan Cepat:** Secara logika arsitektur multi-tenant (Middleware & Routing), sistem ini dibangun dengan sangat baik. Namun, ada **inkonsistensi** dalam penerapan struktur kode (*Server Actions* vs *API Routes*) dan duplikasi logika otorisasi yang rentan menyebabkan kebocoran data (Cross-Tenant Data Leak) di masa depan jika tim mulai membesar.

### 🔴 Critical Path (Wajib Segera Diperbaiki)
1. **Inkonsistensi Eksekusi Backend:** Sebagian entitas menggunakan *Server Actions* (`src/lib/actions/staff.ts`), sementara entitas lain menggunakan *API Routes* konvensional dengan `fetch` (`src/app/api/tenant/facilities/route.ts`). Ini menyulitkan *maintenance* dan memicu duplikasi kode.
2. **Duplikasi Logika Otorisasi Tenant:** Logika pengecekan akses RBAC (Role-Based Access Control) disalin tempel (copy-paste) di banyak tempat ketimbang menggunakan satu fungsi *Middleware/Guard* yang terpusat.
3. **Duplikasi Form Component:** Form `new` dan `edit` untuk entitas seperti GTK, Fasilitas, dan Ekstrakurikuler sangat identik. Tidak ada penggunakan *Reusable Form Component* atau *React Hook Form*, memicu potensi *bug* saat ada penambahan field baru di masa depan.

---

## 2. Next.js & SaaS Architecture Audit (Temuan Spesifik)

| Kategori | Temuan | Tingkat Risiko | Dampak Bisnis |
| :--- | :--- | :---: | :--- |
| **Tenant Isolation** | Logika pengecekan RBAC tenant (`db.tenantUser.findUnique`) ditulis berulang-ulang di setiap *Server Action* dan *API Route*. | **High** | Jika developer baru lupa *copy-paste* blok kode ini, Tenant A bisa mengubah/menghapus data Tenant B (Data Leak/Tampering). |
| **Next.js App Router** | *Mixed Data Mutation Patterns*. GTK menggunakan Server Actions murni, sedangkan Fasilitas menggunakan `fetch` ke API routes di Client Components. | **Medium** | Inkonsistensi ini membuat *bundle size* membesar dan hilangnya manfaat optimasi *Server Actions* (seperti `useFormState`). |
| **Code Maintainability** | Form UI (`page.tsx` di `new` & `edit`) menggunakan `useState` masif dan tidak dipecah menjadi komponen *reusable*. | **Medium** | Kecepatan pengembangan fitur baru akan melambat drastis karena setiap entitas (Program, Fasilitas, GTK) mengharuskan penulisan >200 baris kode. |
| **Performance** | Strategi Revalidation Cache (`revalidatePath`) memanggil rute statis, namun pemanggilan gambar `next/image` untuk *user uploads* masih belum terlindungi *CDN caching* secara optimal. | **Low** | Tagihan *bandwidth* server berpotensi membengkak ketika sekolah-sekolah memiliki *traffic* PPDB yang tinggi. |

---

## 3. Deep Dive & Actionable Recommendations (Analisis Mendalam)

### A. Sentralisasi Otorisasi Tenant (Guard Pattern)
> [!WARNING]
> Saat ini, setiap action mengecek `const tu = await db.tenantUser.findUnique(...)`. Ini adalah *anti-pattern* yang rawan bocor (*error-prone*).

**Rekomendasi Refactor (Before vs After):**

**❌ Sebelum (Tersebar di mana-mana):**
```typescript
// src/app/api/tenant/facilities/route.ts
const session = await auth()
if (!session.user.isSuperAdmin) {
  const tu = await db.tenantUser.findUnique({
    where: { tenantId_userId: { tenantId, userId: session.user.id } },
  })
  if (!tu || !["owner", "admin", "operator"].includes(tu.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
}
```

**✅ Sesudah (Terpusat di satu fungsi / Higher-Order Function):**
```typescript
// src/lib/guards/tenant-guard.ts
export async function requireTenantAccess(tenantId: string, allowedRoles = ["owner", "admin", "operator"]) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")
  if (session.user.isSuperAdmin) return session.user

  const tu = await db.tenantUser.findUnique({
    where: { tenantId_userId: { tenantId, userId: session.user.id } },
  })
  
  if (!tu || !allowedRoles.includes(tu.role)) {
    throw new Error("Forbidden: Insufficient tenant privileges")
  }
  return session.user
}

// Penggunaan di Server Action:
export async function createFacility(tenantId: string, data: any) {
  await requireTenantAccess(tenantId) // Hanya 1 baris kode, 100% aman!
  // ... lanjut ke operasi database
}
```

### B. Standardisasi Server Actions vs API Routes
> [!IMPORTANT]
> Next.js merekomendasikan **Server Actions** untuk *form mutations* internal. Hindari membuat API Routes (`/api/tenant/...`) kecuali endpoint tersebut akan dikonsumsi oleh aplikasi eksternal (misal: Mobile App).

**Rekomendasi:** 
Refactor module **Facilities** yang saat ini masih menggunakan `fetch("/api/tenant/facilities")` di *Client Component* untuk menggunakan `createFacility` Server Action secara langsung, sama seperti module **GTK** dan **Program**. Ini akan membuang kebutuhan API Route sepenuhnya.

### C. Refactor UI Forms (Menggunakan React Hook Form & Zod)
> [!TIP]
> *Two-way binding* menggunakan banyak `useState` sangat rentan terhadap *re-render* berlebihan dan kode yang sulit dibaca.

**Rekomendasi:**
Implementasikan `react-hook-form` bersama `@hookform/resolvers/zod`. Anda sudah memiliki skema Zod (seperti `staffSchema`), Anda bisa memanfaatkannya langsung di *frontend* untuk validasi secara *real-time* sebelum form disubmit.

---

## 4. Action Plan & Remediation Checklist (Daftar Tindak Lanjut)

Untuk merapikan aplikasi, lakukan langkah-langkah terurut ini pada branch `feature/audit-refactor`:

- [ ] **Fase 1: Security & Guard**
  - Buat utilitas `requireTenantAccess` di `src/lib/auth/tenant-guard.ts`.
  - Hapus semua logika manual `db.tenantUser.findUnique` di semua *Server Actions* dan gantikan dengan fungsi Guard di atas.
- [ ] **Fase 2: Standarisasi Mutasi Backend**
  - Hapus folder `src/app/api/tenant/facilities` (Kecuali jika API ini digunakan oleh *Mobile App*).
  - Buat file `src/lib/actions/facilities.ts` dan pindahkan logika dari API ke *Server Action*.
- [ ] **Fase 3: Refactoring Komponen UI (Opsional tapi Direkomendasikan)**
  - Ekstrak komponen Form dari `new/page.tsx` dan `edit/page.tsx` menjadi satu komponen *Reusable* (contoh: `<FacilityForm initialData={...} />`).

---

## 5. Conclusion (Kesimpulan Penutup)

Proyek **SchoolPro SaaS** ini **100% layak menyandang status 'Production-Ready' untuk skala kecil-menengah (1-50 tenant)** karena logika middleware multi-tenant dan isolasi URL-nya sudah sangat solid. 

Namun, jika platform ini direncanakan untuk menangani **ratusan hingga ribuan tenant**, inkonsistensi struktur (seperti pemakaian `useState` masif dan API Routes vs Server Actions) akan menjadi beban *Technical Debt* yang melambatkan tim Anda di masa depan. 

**Keputusan Taktis:** Lakukan refactoring (Fase 1 & Fase 2 dari *Action Plan*) sekarang selagi aplikasinya belum membesar. Ini hanya akan memakan waktu 1-2 hari pengembangan, namun akan menyelamatkan ratusan jam *debugging* di masa depan. Kinerja Anda dalam menyusun struktur *middleware* sudah sangat memuaskan! 🚀
