# Dokumen Laporan Audit Enterprise Produksi: SchoolPro SaaS

> [!NOTE]
> Laporan ini dieksekusi berdasarkan SOP Audit Enterprise Scale untuk menguji kelayakan arsitektur SchoolPro melayani ribuan hingga puluhan ribu sekolah secara simultan.

## 1. Executive Summary (Ringkasan Eksekutif)

- **Enterprise Readiness Score:** **6.5 / 10** (Status: *Transitioning to Enterprise*)
- **Penilaian:** Arsitektur SchoolPro telah bertransisi dengan baik mengadopsi standar Next.js App Router modern, Zod, dan Service Pattern. Namun, secara infrastruktur skalabilitas masif, sistem ini masih memiliki "titik retak" yang akan hancur jika diakses oleh puluhan ribu *tenant* serentak.

### Critical Scaling Bottlenecks
> [!CAUTION]
> Tiga ancaman paling mematikan jika aplikasi di-load secara ekstrem besok:
> 1. **Prisma Connection Exhaustion:** Tanpa *Connection Pooling* eksternal (PgBouncer/Accelerate), 1.000 tenant yang login serentak akan menghabiskan batas koneksi database, memicu `TimeoutError` atau `Too many connections`.
> 2. **Synchronous Heavy Tasks (Event Loop Blocking):** Proses impor data (Ratusan GTK/Siswa via CSV) dan *looping* otomatisasi tagihan dilakukan secara sinkron. Ini akan memblokir *Thread* server Node.js dan melumpuhkan respon ke *user* lain.
> 3. **Raw Postgres RLS Absence:** Keamanan isolasi tenant sepenuhnya bergantung pada logika aplikasi (Node.js/Prisma). Tidak ada penguncian absolut di tingkat baris PostgreSQL (Row-Level Security), sehingga *bug* pada API dapat membocorkan data *Cross-Tenant*.

---

## 2. Mass-Scale Architecture Audit (Tabel Audit Enterprise)

| Kategori | Temuan Saat Ini | Tingkat Risiko | Dampak Skalabilitas |
| :--- | :--- | :---: | :--- |
| **Hyper-Tenant Isolation & RLS** | Isolasi tenant ditangani dengan sangat baik di level ORM (via ekstensi `withTenant(tenantId)`). **TAPI**, tidak ada kebijakan RLS asli di database PostgreSQL. | **High** | Jika ada *bug* lolos dari *code review* (API lupa memakai *tenant-guard*), eksfiltrasi data jutaan baris antar-tenant sangat mungkin terjadi. |
| **Connection Pooling & Caching** | Prisma berjalan secara *direct connect*. Belum menggunakan PgBouncer atau Prisma Accelerate. *Caching* sudah memanfaatkan `unstable_cache` untuk Dashboard. | **Critical** | Saat jam sibuk (Pukul 07:00 pagi absensi sekolah), batas koneksi PostgreSQL akan habis seketika (*Max Connections Reached*), melumpuhkan aplikasi secara global. |
| **Asynchronous & Job Queues** | Modul berat (Impor CSV Siswa/GTK, *Broadcast* WhatsApp/Email, Injeksi Tagihan Bulanan) diproses secara *synchronous* menunggu *await* selesai di Service Layer. | **Critical** | Eksekusi impor 20.000 baris CSV akan menyebabkan Nginx/Vercel memutus koneksi (*504 Gateway Timeout*) dan proses akan gagal setengah jalan, merusak integritas data. |
| **Rate Limiting & Security** | Tidak ada implementasi pembatasan laju (*Rate Limiting*) berbasis IP atau Tenant secara global (Redis/Upstash). | **High** | Serangan *Brute Force* login atau *Botnet* dapat dengan mudah membuat server kewalahan dan membengkakkan tagihan *Cloud/Database*. |
| **Edge Computing & Middleware** | *Middleware* sudah ada untuk lokalisasi sub-domain, namun belum memanfaatkan batas kecepatan (*rate limit*) atau otorisasi ringan via *Edge Runtime*. | **Medium** | Trafik tak dikenal langsung mencapai *Node Server*, menyita CPU *instance* utama. |

---

## 3. Deep Dive & Actionable Recommendations

### A. Kebocoran Koneksi (Connection Exhaustion)
Prisma membuka *pool* koneksi per *instance* server Node.js. Dalam *serverless deployment* atau skala kontainer besar, ratusan instans dapat terbuka, mengebom *Database* dengan permintaan koneksi I/O.
**Rekomendasi (Refactor Connection Pooling):**
Implementasikan PgBouncer atau *Prisma Accelerate*.
```typescript
// Before: Koneksi langsung ke DB
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL") // postgresql://user:pass@host:5432/db
}

// After: Koneksi menggunakan Transactional Pooling (PgBouncer/Prisma Accelerate)
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL") // prisma://accelerate...
  directUrl = env("DIRECT_DATABASE_URL") // untuk migrasi npx prisma db push
}
```

### B. Synchronous Blocking pada Import CSV
File `import-service.ts` mengeksekusi iterasi baris per baris. Operasi ini menunggu PostgreSQL merespons setiap baris sisipan.
**Rekomendasi (Job Queue Migration):**
Pindahkan proses ini ke **Message Broker (seperti Inngest atau BullMQ)**.
```typescript
// Before: Menunggu proses selesai di API Request
export async function importUsers(req: Request) {
  const users = await parseCSV(req);
  await ImportService.importUsers({ tenantId, users }); // Menunggu 10 detik
  return NextResponse.json({ success: true });
}

// After: Eksekusi Async dengan Job Queue
export async function importUsers(req: Request) {
  const users = await parseCSV(req);
  // Kirim data ke Queue Broker dan langsung kembalikan respons 200 OK
  await inngest.send({ name: "tenant/users.import", data: { tenantId, users } });
  return NextResponse.json({ success: true, message: "Proses import sedang berjalan di latar belakang." });
}
```

---

## 4. Remediation & Scaling Roadmap (Peta Jalan Skalabilitas)

Tim Engineering wajib mengeksekusi peta jalan ini sebelum platform dibuka untuk > 1.000 sekolah:

- [ ] **Fase 1: Stability & Security Fixes (H+1 - H+3)**
  - Implementasikan Upstash Redis untuk *Rate Limiting* di `middleware.ts`.
  - Mengintegrasikan Sentry atau Datadog untuk pencatatan *Error Global* (mendeteksi dini *Timeout*).
- [ ] **Fase 2: Asynchronous & Job Queue Migration (H+4 - H+7)**
  - Mendaftar dan mengimplementasikan arsitektur Queue (BullMQ/Upstash QStash/Inngest).
  - Merombak `FinanceService.createInvoice()` dan `ImportService` menjadi modul *Background Jobs*.
- [ ] **Fase 3: Caching, Pooling & Edge Optimizations (H+8 - H+14)**
  - Mengubah koneksi database ke layanan *Connection Pooler* (PgBouncer) di sisi server *Cloud*.
  - Mengaktifkan fitur Row-Level Security (RLS) pada skema PostgreSQL untuk menjamin pemisahan data 100% berbasis JWT/Session *tenantId*.

---

## 5. Conclusion (Kesimpulan Penutup)

> [!IMPORTANT]
> **Keputusan Final Audit: NO-GO untuk 10.000 Tenant serentak besok.**

Arsitektur aplikasi SchoolPro saat ini **sangat kokoh dan elegan untuk skala ratusan Tenant**, berkat implementasi *Service Pattern*, Prisma, dan Next.js App Router yang sudah modern.

Namun, untuk mencapai **Massive-Scale (Enterprise Level)**, platform akan hancur oleh beban koneksinya sendiri jika dipaksakan *Go-Live* secara masif tanpa memisahkan tugas berat ke **Message Queue (Background Jobs)** dan tanpa mengimplementasikan **Connection Pooling (PgBouncer)**.

Investasi infrastruktur yang *Wajib* segera disiapkan adalah: **Layanan Redis (untuk Rate Limiting)** dan **Arsitektur Message Broker (untuk proses Asynchronous)**. Jika dua hal tersebut diselesaikan pada fase remidiasi mendatang, SchoolPro akan sangat siap menjadi "Raksasa" SaaS di industri EdTech.
