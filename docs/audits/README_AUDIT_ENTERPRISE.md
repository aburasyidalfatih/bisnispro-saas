# Enterprise Production Audit Report: SchoolPro SaaS

> [!IMPORTANT]
> **Tujuan Dokumen:** Evaluasi kesiapan arsitektur SchoolPro untuk *Massive-Scale Production* (melayani 10.000+ sekolah) dengan standar SLA 99.9%. Audit ini dilakukan oleh Principal Enterprise Architect.

## 1. Executive Summary (Ringkasan Eksekutif)

- **Enterprise Readiness Score:** **7.5 / 10**
- **Status:** **Ready for Scaling (dengan catatan kritis)**

SchoolPro memiliki pondasi arsitektur modern yang sangat baik (Next.js App Router, Prisma Accelerate, Inngest/BullMQ, dan Upstash Edge Rate Limiting). Namun, untuk menahan beban hingga puluhan ribu sekolah secara bersamaan, terdapat beberapa *bottlenecks* yang dapat menyebabkan *Downtime* atau Kebocoran Data (Data Leakage) antar institusi.

**Critical Scaling Bottlenecks (Temuan Paling Kritis):**
1. **Absennya PostgreSQL Row Level Security (RLS):** Saat ini isolasi multi-tenant murni bergantung pada *Prisma Client Extension* (`withTenant`). Jika terjadi bug di level ORM atau *raw query* eksekusi, data antar sekolah dapat saling terekspos.
2. **Ketiadaan Composite Indexing Masif:** Mayoritas tabel berukuran besar (`Student`, `User`, `AttendanceRecord`) tidak memiliki *composite index* gabungan antara `tenantId` dan kolom pencarian lainnya, memicu *Full Table Scan* yang akan mencekik I/O Database.
3. **Ketergantungan Eksekusi Sinkron:** Masih banyak potensi eksekusi sinkron pada endpoint kritikal. Perlu migrasi total semua beban kerja (seperti *Mass Email*, *Billing Generation*, *Data Import*) ke arsitektur asinkron via Inngest/BullMQ secara konsisten.

---

## 2. Mass-Scale Architecture Audit

| Kategori Arsitektur | Temuan Saat Ini | Tingkat Risiko | Dampak Skalabilitas |
| :--- | :--- | :---: | :--- |
| **Hyper-Tenant Isolation & RLS** | Menggunakan Prisma Extension (`withTenant`). **Belum** menggunakan PostgreSQL RLS. | 🔴 Tinggi | *Data Breach*. Kebocoran data antar tenant jika terjadi celah di lapisan aplikasi. |
| **Connection Pooling & Caching** | Prisma Accelerate telah diinstal. Namun ketergantungan pada *Redis Cache* untuk *Read-Heavy* queries (Dashboard/Stats) belum menyeluruh. | 🟡 Sedang | *Connection Exhaustion* (Max Connections Reached) di saat jam sibuk (pagi hari saat absensi). |
| **Asynchronous Processing** | *Inngest* & *BullMQ* tersedia di `package.json`, tetapi *coverage* penggunaannya pada fitur-fitur berat perlu diaudit total. | 🟡 Sedang | *Event loop blocking* dan *Timeout (504 Gateway Timeout)* saat *batch processing* / *import* siswa massal. |
| **Rate Limiting & Security** | *Edge Rate Limiting* menggunakan Upstash Redis tersedia (`edge-rate-limit.ts`). | 🟢 Rendah | Sangat efisien, namun perlu pengaturan spesifik untuk *Auth Routes* (proteksi *Brute Force* login). |
| **Database Indexing** | Tabel raksasa memiliki indeks tunggal (`@@index([tenantId])`), namun minim *Composite Index* yang spesifik untuk *sorting* dan *filtering*. | 🔴 Tinggi | Penurunan performa eksponensial (lambat) saat data melampaui 1 juta baris. |

---

## 3. Deep Dive & Actionable Recommendations

### A. Kerapuhan Multi-Tenant (Implementasi RLS)
> [!CAUTION]
> Mengandalkan *App-Level Isolation* (Prisma Extension) di skala Enterprise sangat berisiko. Satu kesalahan manipulasi *variable* `tenantId` pada Server Actions dapat menyebabkan sekolah A melihat data tagihan sekolah B.

**Rekomendasi:** Implementasikan PostgreSQL Row Level Security (RLS) dengan *Prisma Client Extension* yang meng-set `current_setting('app.current_tenant_id')`.

**Refactor (Before vs After) - Konsep RLS Prisma:**
```typescript
// BEFORE: Hanya bergantung pada query manipulation (App-Level)
export function withTenant(tenantId: string) {
  return db.$extends({
    query: { $allModels: { async findMany({ args, query }) { args.where = { ...args.where, tenantId }; return query(args) } } }
  })
}

// AFTER: Injeksi Tenant ID ke Database Session (Database-Level RLS)
export function withTenantRLS(tenantId: string) {
  return db.$extends({
    query: {
      $allModels: {
        async $allOperations({ args, query }) {
          // 1. Eksekusi SET LOCAL app.current_tenant_id = tenantId;
          await db.$executeRaw`SELECT set_config('app.current_tenant_id', ${tenantId}, TRUE)`;
          // 2. Jalankan query, database secara otomatis memfilter berdasarkan RLS Policy
          return query(args);
        }
      }
    }
  })
}
```

### B. Optimalisasi Kueri dengan Composite Indexing
> [!WARNING]
> Tabel transaksi seperti `Payment`, `AuditLog`, dan `AttendanceRecord` akan membengkak drastis. Indeks `@@index([tenantId])` tidak cukup jika Anda sering mencari data berdasarkan tanggal di dashboard.

**Rekomendasi:** Tambahkan *Composite Index* pada file `schema.prisma` di tabel-tabel berukuran besar.

```prisma
// BEFORE (Contoh di schema.prisma)
@@index([tenantId])
@@index([createdAt])

// AFTER (Composite Indexing untuk Query Dashboard yang lebih cepat)
@@index([tenantId, createdAt(sort: Desc)])
@@index([tenantId, status])
@@index([tenantId, isActive, role]) // Untuk user/student query
```

### C. Eksekusi Operasi Berat secara Asinkron
> [!TIP]
> Semua fungsi yang memakan waktu > 2 detik (misal: *Generate* Tagihan Bulanan untuk 2000 siswa, *Kirim Email Pemberitahuan*) wajib dimasukkan ke antrean pekerjaan (Job Queues).

**Rekomendasi:** Gunakan Inngest (yang sudah terinstal di `package.json`) untuk memindahkan beban ini dari eksekusi sinkron Vercel/Node.js.

---

## 4. Remediation & Scaling Roadmap

Segera delegasikan eksekusi langkah ini kepada tim Engineering.

- **Fase 1: Stability & Security Fixes (H+1 - H+3)**
  - Terapkan *Composite Indexing* pada seluruh tabel transaksional di `schema.prisma`.
  - Konfigurasi *Rate Limiting* agresif spesifik untuk rute otentikasi (mencegah *credential stuffing*).
  - Lakukan *Code Review* pada seluruh Server Actions untuk memastikan `requireTenantMembership` dipanggil sebelum mutasi data.

- **Fase 2: Asynchronous & Job Queue Migration (H+4 - H+7)**
  - Identifikasi proses-proses lambat (Import CSV Siswa, Ekspor PDF Rapor, Mass Email).
  - Tulis ulang logika tersebut sebagai *Inngest Functions* yang dieksekusi secara asinkron di *background*.

- **Fase 3: RLS, Pooling & Edge Optimizations (H+8 - H+14)**
  - Implementasikan PostgreSQL Row Level Security (RLS) melalui skrip migrasi SQL.
  - Aktifkan fitur *Caching* yang agresif menggunakan Redis untuk data yang jarang berubah (Profil Tenant, Konfigurasi Platform).
  - Pastikan `DATABASE_URL` di *Production* sudah melewati PgBouncer atau layanan Prisma Accelerate murni.

---

## 5. Conclusion

**Keputusan Skalabilitas: GO with Conditional Upgrades.**

Arsitektur SchoolPro saat ini **mampu** menangani *launching* awal (100 - 500 sekolah) berkat penggunaan Prisma Accelerate, Next.js App Router, dan arsitektur yang cukup modern. Namun, jika jumlah tenant melonjak melebihi 1.000 sekolah secara mendadak, aplikasi berisiko tumbang karena **keterbatasan I/O Database (N+1 dan ketiadaan Composite Indexing)** dan potensi *Timeout* pada operasi sinkron yang berat.

**Investasi Terpenting:** Fokuskan *resource* tim pada **Fase 1** (Indexing & Optimation Queries) dan **Fase 2** (Migrasi ke Inngest/BullMQ). Setelah itu tercapai, SchoolPro siap melayani skala masif.
