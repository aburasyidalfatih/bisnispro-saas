# SchoolPro SaaS - Comprehensive Technical Audit Report

> [!IMPORTANT]
> Laporan ini disusun oleh **Lead Technical Auditor & Senior Next.js Architect**. Dokumen ini mengevaluasi arsitektur, keamanan, dan skalabilitas SchoolPro (Multi-tenant SaaS) berbasis standar *Enterprise/Production*.

## 1. Executive Summary (Ringkasan Eksekutif)

- **Status Kesehatan Kode:** **7.5 / 10**
  Secara keseluruhan, SchoolPro telah mengadopsi tumpukan teknologi modern (*Next.js App Router, Prisma, Zod*) dengan implementasi yang cukup baik, terutama pada pemisahan *Client* dan *Server Components*. Namun, untuk mencapai standar Enterprise, masih terdapat celah fundamental pada abstraksi isolasi *tenant*, manajemen *state*, dan sentralisasi logika bisnis yang harus segera diatasi sebelum *scaling*.

**Critical Path (Temuan Paling Kritis):**
1. **Risiko Kebocoran Data (Cross-Tenant Data Leak):** Isolasi *tenant* saat ini sangat bergantung pada penambahan manual `tenantId` di setiap *query* Prisma (`where: { tenantId }`). Jika satu developer lupa menambahkannya pada fitur baru, kebocoran data antar sekolah dapat terjadi.
2. **Desentralisasi Logika Bisnis:** Logika bisnis yang kompleks (seperti kalkulasi tagihan atau verifikasi pembayaran) tersebar di antara *API Routes* (`/api/...`) dan *Server Components* (`page.tsx`), menyulitkan pemeliharaan dan berpotensi memicu inkonsistensi kalkulasi.
3. **Overhead API Internal:** Sering terjadi pemanggilan *API Routes internal* dari *Client Components* (menggunakan `fetch('/api/...')`) untuk operasi yang sebenarnya bisa dioptimalkan menggunakan *Server Actions* yang lebih terintegrasi dengan ekosistem React modern dan Next.js.

---

## 2. Next.js & SaaS Architecture Audit (Temuan Spesifik)

Berikut adalah hasil audit mendalam terhadap seluruh lapisan arsitektur aplikasi:

| Kategori | Temuan | Tingkat Risiko | Dampak Bisnis |
| :--- | :--- | :---: | :--- |
| **Tenant Isolation & Security** | Penjagaan akses (Tenant Guard) sudah ada di API, namun banyak *query* di *Server Components* masih mem-pas *hardcode* `where: { tenantId }`. | **CRITICAL** | Developer *error* sekecil apa pun dapat memperlihatkan data keuangan/siswa sekolah A kepada sekolah B. |
| **Next.js App Router Practices** | Terlalu banyak menggunakan *Route Handlers* (`/api/*`) untuk melayani *Client Components* internal, alih-alih memanfaatkan *Server Actions* untuk mutasi data. | **MEDIUM** | Kode menjadi lebih bertele-tele, rentan terhadap masalah jaringan internal (*waterfall network requests*), dan lambat dalam *development*. |
| **Data Fetching & Caching** | Beban Prisma cukup tinggi karena *deep nested includes* (contoh: `invoice -> student -> parents`) dilakukan di setiap navigasi tanpa mekanisme *caching* (seperti `unstable_cache` atau Redis). | **HIGH** | Lambatnya *load time* pada *dashboard* saat jumlah data siswa dan transaksi sekolah mencapai puluhan ribu (*N+1 Query Issue*). |
| **Code Maintainability** | Logika pemrosesan transaksi (mutasi `Wallet`, `Cashflow`, `Invoice`) bercampur secara *inline* di dalam *Route Handlers* dan komponen UI. | **HIGH** | Saat aturan bisnis berubah (misal aturan denda keterlambatan), developer harus mencari dan memodifikasi banyak *file* secara manual. |
| **Performance & Web Vitals** | Beberapa komponen UI yang berat tidak menggunakan *Dynamic Import* (`next/dynamic`), menyebabkan ukuran *bundle* inisial JS membengkak. | **MEDIUM** | *First Contentful Paint (FCP)* dan *Time to Interactive (TTI)* melambat, terutama bagi orang tua yang mengakses via perangkat seluler kelas bawah. |

---

## 3. Deep Dive & Actionable Recommendations (Analisis Mendalam)

### A. Isu Kritis: Isolasi Tenant Manual (Manual Tenant Scoping)

> [!WARNING]
> Mengandalkan `where: { tenantId }` di setiap baris *query* Prisma adalah bom waktu pada aplikasi Multi-tenant.

**Mengapa ini berbahaya:**
Manusia bisa melakukan kesalahan. Di aplikasi SaaS, kebocoran data (*data leak*) adalah hal yang paling ditakuti. Jika sekolah mendapati data keuangannya bocor ke sekolah lain, reputasi *platform* akan hancur seketika.

**Rekomendasi Arsitektur (Prisma Client Extension / RLS):**
Gunakan fitur **Prisma Client Extensions** untuk menginjeksi filter `tenantId` secara otomatis di tingkat ORM, atau manfaatkan fitur *Row Level Security (RLS)* milik PostgreSQL.

*Contoh Refactor menggunakan Prisma Extension:*

```typescript
// Sebelum: Risiko tinggi lupa memasukkan tenantId
const invoices = await db.invoice.findMany({
  where: { status: "UNPAID" } // Bencana! Menarik tagihan dari SEMUA tenant
})

// Sesudah: Praktik Terbaik (Repository Pattern / Extension)
// 1. Buat custom prisma client per-request
const tenantDb = db.$extends({
  query: {
    $allModels: {
      async findMany({ model, operation, args, query }) {
        args.where = { ...args.where, tenantId: currentTenantId }
        return query(args)
      },
      // Lakukan untuk findFirst, update, delete, dll.
    },
  },
})

// 2. Pemanggilan menjadi aman secara default
const invoices = await tenantDb.invoice.findMany({
  where: { status: "UNPAID" } // Hanya menarik data dari tenantId saat ini!
})
```

### B. Isu Maintainability: Fat Controllers & Scattered Logic

> [!CAUTION]
> Menaruh ratusan baris logika transaksi (seperti pada pembayaran *Invoice* yang memanipulasi *Wallet, InvoicePayment, Cashflow, dan Notifikasi*) di dalam satu *Route Handler* atau komponen membuatnya sulit untuk diuji (*unit testing*) dan rentan *bug*.

**Rekomendasi Arsitektur (Service Layer Pattern):**
Pisahkan logika bisnis ke dalam `/src/lib/services/`. Pastikan *Route Handlers* atau *Server Actions* hanya bertugas menangani HTTP/Validasi, dan langsung mendelegasikan pemrosesan ke *Service*.

*Contoh Refactor:*

```typescript
// src/app/api/ortu/invoices/[id]/pay/route.ts (AFTER Refactor)
import { processManualInvoicePayment } from "@/lib/services/invoice.service"

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { method, ...data } = await req.json()
  
  if (method === "MANUAL_TRANSFER") {
      // API Route HANYA fokus pada otorisasi dan respon
      const result = await processManualInvoicePayment(params.id, session.user.id, data)
      if (!result.success) return NextResponse.json({ error: result.error }, { status: 400 })
      
      return NextResponse.json({ message: "Sukses", redirectUrl: result.url })
  }
}
```

---

## 4. Action Plan & Remediation Checklist (Daftar Tindak Lanjut)

Untuk menstabilkan *codebase* ini ke taraf *Enterprise*, jalankan langkah-langkah berikut pada branch `feature/audit-refactor`:

- [ ] **Fase 1: Keamanan Isolasi Tenant (H+1 - H+2)**
  - Implementasikan *Prisma Client Extensions* untuk memaksakan klausa `where: { tenantId }` secara global pada level koneksi ORM bagi request yang masuk.
- [ ] **Fase 2: Pemusatan Logika Bisnis (H+3 - H+5)**
  - Pindahkan semua logika mutasi kompleks (Pembuatan Tagihan, Pembayaran, Top-up Wallet) ke dalam file-file *Services* khusus (`invoice.service.ts`, `wallet.service.ts`).
  - Tulis *Unit Test* (menggunakan Vitest/Jest) khusus untuk fungsi-fungsi *Service* ini.
- [ ] **Fase 3: Migrasi ke Server Actions (H+6 - H+7)**
  - Identifikasi *Client Components* yang memanggil API internal hanya untuk mutasi sederhana (seperti ubah status kehadiran atau hapus data).
  - Ganti *fetch API* tersebut dengan memanggil *Next.js Server Actions* langsung dari tombol atau form.
- [ ] **Fase 4: Optimasi Performa Database (H+8 - H+9)**
  - Lakukan audit query dengan mengaktifkan log Prisma (`log: ['query']`).
  - Tambahkan indeks (`@@index`) pada Prisma Schema untuk kolom-kolom yang sering difilter (seperti `status`, `dueDate`, `createdAt`).
- [ ] **Fase 5: Standarisasi Error & Feedback UI (H+10)**
  - Buat `lib/api-response.ts` untuk menstandarkan format balikan JSON ke Client (selalu ada `{ success, data, error }`).

---

## 5. Conclusion (Kesimpulan Penutup)

> [!TIP]
> **Keputusan Final Audit:** Saat ini, arsitektur SchoolPro sudah **layak untuk masuk ke tahap Beta/Soft Launching** dengan tenant dalam jumlah terbatas (< 10 Sekolah).

Inisiatif awal dalam memisahkan arsitektur *Server Component* dan penerapan `Zod` telah memberi pondasi ketahanan yang kuat. Meskipun demikian, sebelum membuka platform ini untuk **publik berskala besar (Ratusan Sekolah/Mass Production)**, tim *Engineering* **DIWAJIBKAN** untuk merefaktor manajemen keamanan isolasi *tenant* (menggunakan ORM Extensions atau PostgreSQL RLS) dan memusatkan logika bisnis ke dalam *Service Layer*.

Pengabaian terhadap rekomendasi tersebut di masa depan akan menyebabkan tumpukan *Technical Debt* yang membuat sistem semakin sulit dirawat, sulit ditambahkan fitur baru, dan membuka risiko terjadinya *Cross-Tenant Data Breach* yang fatal bagi kelangsungan bisnis SaaS ini.
