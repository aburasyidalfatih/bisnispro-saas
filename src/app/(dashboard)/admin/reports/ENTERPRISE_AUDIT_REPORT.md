# Dokumen Laporan Audit Enterprise Produksi: SchoolPro SaaS

> [!IMPORTANT]
> Laporan ini disusun oleh **Principal Enterprise Architect & Security Auditor** untuk mengevaluasi kesiapan platform SchoolPro SaaS menghadapi **Massive-Scale Multi-tenant** (Ribuan hingga puluhan ribu sekolah).

## 1. Executive Summary (Ringkasan Eksekutif)

- **Enterprise Readiness Score: 4/10**
  Saat ini arsitektur SchoolPro sudah modern secara stack (Next.js App Router, Prisma), namun belum memiliki infrastruktur tingkat *Enterprise* yang disiapkan untuk menampung *load* masif (belum ada Message Queue terpisah dan RLS Database yang memadai di Production/Docker).

- **Critical Scaling Bottlenecks:**
  1. **Asynchronous Task Anti-Pattern:** Mem-bypass *message queue* (Inngest) dan menjalankan *background jobs* (Import CSV, Bulk WA) secara *fire-and-forget* (Promises) di dalam Edge/Node.js API Route. Ini akan menyebabkan *Event Loop Blocking*, memori bocor (OOM), dan *Silent Task Failures*.
  2. **Ketiadaan Database Row Level Security (RLS):** Keamanan *multi-tenant* sepenuhnya bergantung pada lapisan aplikasi (klausul `where: { tenantId }` di Prisma). Jika satu baris kode luput/bug, kebocoran data antar sekolah (*Cross-Tenant Data Leak*) pasti terjadi.
  3. **Connection Exhaustion:** Tanpa konfigurasi *Connection Pooler* (seperti PgBouncer) secara lokal di VPS Docker, lonjakan trafik serentak (misal: pengumuman PPDB atau Rapor) akan menghabiskan batas koneksi PostgreSQL, menyebabkan *error* `too many clients already`.

## 2. Mass-Scale Architecture Audit (Tabel Audit Enterprise)

| Kategori | Temuan Saat Ini | Tingkat Risiko | Dampak Skalabilitas |
| :--- | :--- | :--- | :--- |
| **Hyper-Tenant Isolation & RLS** | Isolasi tenant hanya dikelola di level ORM (Prisma). PostgreSQL native RLS belum dikonfigurasi. | **Kritis (High)** | Jika terjadi *human error* di kode, data sekolah A dapat terbaca oleh sekolah B. |
| **Connection Pooling & Caching** | Terhubung langsung ke DB tanpa PgBouncer di layer VPS. Mengandalkan koneksi ORM langsung. | **Tinggi (High)** | Terjadinya *Connection Timeout* saat puluhan ribu siswa mengakses Rapor/PPDB bersamaan. |
| **Async & Background Processing** | Modul berat (Import CSV, Notifikasi WA) menggunakan *fire-and-forget* (Bypass Inngest karena limitasi Docker). | **Kritis (High)** | Pekerjaan berat terhenti di tengah jalan tanpa jejak saat container di-*restart* atau API menabrak batas batas *timeout*. |
| **Rate Limiting & Security** | *Rate limiting* mendasar, namun belum menggunakan isolasi proteksi redis per-tenant tingkat *Edge/Middleware*. | **Sedang (Medium)** | Rentan *DDoS* level aplikasi dan *Brute Force* login/OTP. |
| **Edge Computing & RSC** | Penggunaan *Server Components* sudah baik, namun banyak modul berat membebani *Node Server* alih-alih di-*cache*. | **Rendah (Low)** | *Latency* tinggi untuk aksi ringan yang sebenarnya bisa di-*cache* memori. |

## 3. Deep Dive & Actionable Recommendations (Analisis Mendalam)

### A. Bahaya Laten Asynchronous Process di Node.js
Menjalankan *long-running tasks* seperti *import* data ribuan siswa menggunakan `Promise` tanpa antrean (queue) adalah malapraktik di arsitektur *Enterprise*.

> [!WARNING]
> Jika server menerima trafik besar, *Event Loop* Node.js akan terblokir oleh proses CSV/WA, membuat *response time* API lain melambat tajam atau *timeout*.

**Rekomendasi (Refactor Message Queue dengan BullMQ / Redis):**
Karena aplikasi di-deploy di VPS via Docker (yang menyebabkan `Inngest` seringkali bermasalah tanpa *tunneling*), sangat disarankan untuk beralih sepenuhnya ke antrean lokal (seperti **BullMQ**) yang mengandalkan Redis.

```typescript
// BEFORE: Anti-Pattern Fire-and-Forget
export async function POST(req: Request) {
  const data = await req.json();
  // ❌ Berbahaya: Proses berat dijalankan tanpa pengawasan background worker
  processImportCSV(data).catch(console.error); 
  return NextResponse.json({ success: true });
}

// AFTER: Enterprise Queue System (BullMQ)
import { importQueue } from "@/lib/queue";

export async function POST(req: Request) {
  const data = await req.json();
  // ✅ Aman: Hanya mendaftarkan task ke Redis Queue, dieksekusi di Worker terpisah
  await importQueue.add("import-csv", { tenantId: data.tenantId, file: data.file });
  return NextResponse.json({ success: true, message: "Import diproses di background." });
}
```

### B. Menerapkan PostgreSQL Row Level Security (RLS) di Prisma
Hanya mengandalkan Prisma `where: { tenantId }` rawan kebocoran data jika terjadi bug *query builder*. Untuk *Enterprise*, pasang pertahanan lapis ganda langsung di Engine PostgreSQL.

**Rekomendasi RLS Extension:**
```typescript
// lib/db.ts
import { PrismaClient } from '@prisma/client'

export const db = new PrismaClient().$extends({
  query: {
    $allModels: {
      async $allOperations({ args, query }) {
        const tenantId = getTenantIdFromContext(); // Ambil dari request context/session
        if (tenantId) {
          // Set konteks RLS di PostgreSQL secara atomik sebelum eksekusi
          await prisma.$executeRawUnsafe(`SET LOCAL app.current_tenant = '${tenantId}';`);
        }
        return query(args)
      },
    },
  },
})
```
Dan di tingkat SQL Migration, tambahkan kebijakan `CREATE POLICY` untuk seluruh tabel sensitif.

## 4. Remediation & Scaling Roadmap (Peta Jalan Skalabilitas)

Langkah taktis yang wajib segera dieksekusi oleh tim Engineering:

- **Fase 1: Stability & Security Fixes (H+1 - H+3)**
  - Mengimplementasikan **PgBouncer** pada `docker-compose.yml` untuk memanajemen lonjakan koneksi *database* secara aman (*pooling*).
  - Mengatur *Rate Limiter* terpusat via Redis untuk *endpoint-endpoint* krusial (*checkout*, pendaftaran *tenant*, login, pengiriman WA).

- **Fase 2: Asynchronous & Job Queue Migration (H+4 - H+7)**
  - Menghapus semua implementasi `bypass Inngest` dan bermigrasi ke antrean *open-source* tangguh: **BullMQ + Redis container**.
  - Memisahkan arsitektur *Deployment*. Buat satu kontainer Node.js khusus *Worker* (Background Jobs) dan satu khusus *Web Server* (Traffic HTTP Pengguna).

- **Fase 3: Caching & RLS Database (H+8 - H+14)**
  - Mengeksekusi DDL migrasi PostgreSQL untuk *Row Level Security* (RLS).
  - Menerapkan *Caching Strategy* dengan Redis untuk konfigurasi *Tenant* dan *Theme* agar API merespons di bawah 50ms tanpa hit *database*.

## 5. Conclusion (Kesimpulan Penutup)

> [!CAUTION]
> **Keputusan Profesional: NO-GO UNTUK LOAD 1.000 TENANT SERENTAK BESOK.**

Arsitektur saat ini akan **HANCUR/TUMBANG** jika puluhan *tenant* (*schools*) mulai menggunakan fitur sinkron tugas berat (seperti import data siswa massal atau pengiriman tagihan SPP ke ribuan wali murid via WA) dalam waktu yang persis bersamaan. Kelumpuhan ini dipicu karena antrean (*background queue*) dimatikan/di-bypass di lingkungan produksi VPS, memaksa *Web Server* memproses semuanya secara *blocking*.

**Investasi Infrastruktur Terpenting:**
Prioritaskan alokasi *engineering* minggu ini semata-mata untuk mengintegrasikan ulang arsitektur *Message Queue* lokal (seperti BullMQ dengan Redis) dan memisahkan kontainer *Web Service* dengan kontainer *Worker Service*. Setelah dua pembenahan krusial ini selesai, SchoolPro akan langsung *scalable* untuk menampung puluhan ribu sekolah tanpa isu kinerja.
