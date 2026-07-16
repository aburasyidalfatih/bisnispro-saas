# Audit Kode SchoolPro

**Tanggal:** 2026-07-16
**Cakupan:** Menyeluruh — keamanan, arsitektur, kualitas, database/performa, testing, DevOps, kebersihan repo
**Stack:** Next.js 15 (App Router) · React 19 · TypeScript (strict) · Prisma 6 / PostgreSQL (RLS) · NextAuth v5 · BullMQ · Redis/Upstash

> Semua temuan diverifikasi langsung dari kode (bukan asumsi). Lokasi ditulis sebagai `file:line`.

---

## Ringkasan Eksekutif

Fondasi arsitektur project ini **sudah profesional**: struktur feature-based, service layer, Prisma dengan Row-Level Security, `withTenant()` untuk isolasi tenant, guard otorisasi, rate limiting, structured logger, Sentry, CI cron, Docker. Namun **pola-pola bagus itu tidak ditegakkan secara konsisten**, sehingga menyisakan lubang keamanan serius dan utang teknis besar.

| Severity | Jumlah area | Isu utama |
|----------|-------------|-----------|
| 🔴 **Critical** | 2 | Cross-tenant IDOR di ~32 route; validasi build dimatikan |
| 🟠 **High** | 5 | Guard duplikat, service layer di-bypass 80%, God components, `any` masif, error bocor |
| 🟡 **Medium** | 6 | findMany unbounded, index kurang, test minim, caching tidak seragam, rate-limit payment, feature struktur tidak konsisten |
| 🟢 **Low** | 3 | Repo kotor, logger/utils duplikat, gitignore bocor |

**Verdict:** Belum sepenuhnya memenuhi standar "fundamental profesional" — terutama karena **isolasi tenant tidak dijamin di seluruh boundary** (risiko kebocoran data antar-sekolah) dan **type/lint checking dimatikan saat build**. Ini yang harus diperbaiki lebih dulu.

---

## 🔴 CRITICAL

### C1. Cross-tenant IDOR — data satu sekolah bisa dibaca/ditulis sekolah lain

**Root cause:** Banyak route API hanya memeriksa `auth()` (apakah user login), lalu **mempercayai `tenantId` yang dikirim client** (query param / body) dan langsung query ke `db` mentah — tanpa memastikan user tersebut anggota tenant itu.

Contoh terkonfirmasi (`src/app/api/finance/cashflow/route.ts`):
```ts
const session = await auth()
if (!session?.user) return ... 401
const tenantId = url.searchParams.get("tenantId")   // dipercaya mentah
const data = await db.cashflow.findMany({ where: { tenantId }, ... })  // db mentah, bukan withTenant
```
User sekolah A cukup mengirim `?tenantId=<sekolah_B>` untuk membaca/menulis keuangan sekolah B.

**Skala (terukur):**
- **304** file `route.ts` total.
- Hanya **44** memakai guard `requireTenant*`, **39** `requireTenantMembership`, **6** `withTenant(`, **4** `runWithTenantContext`.
- **69** route membaca `?tenantId`; **~32–35** di antaranya **tanpa guard/RLS sama sekali**.

Route paling berisiko (finansial & data pribadi):
- `src/app/api/finance/cashflow/route.ts:10` (GET+POST keuangan)
- `src/app/api/canteen/withdrawals/route.ts:19` (penarikan dana kantin)
- `src/app/api/ppdb/tagihan/route.ts:14` (tagihan), `ppdb/rekening/route.ts:9` (rekening bank)
- `src/app/api/ppdb/pendaftar/route.ts:14` (data pendaftar/PII)
- `src/app/api/grades/route.ts:10`, `ortu/grades/route.ts:10` (nilai siswa)
- `src/app/api/subjects/route.ts`, `schedules/route.ts`, `discipline/route.ts`, `gtk/staff|jurnal|schedules`, `tenant/documents/[id]`, `tenant/domain`, `panel-gtk/posts` — pola identik.

> Catatan positif: RLS (`withTenant`/`runWithTenantContext` + `set_config`) sudah dibangun dengan benar di `src/lib/db.ts` dan `tenant-scope.ts`. Masalahnya hanya **~10 route** yang memakainya; sisanya bypass.

**Rekomendasi (prioritas #1):**
1. Wajibkan setiap route tenant-scoped melewati `requireTenantAccess(tenantId)` **lalu** query via `withTenant(tenantId)` — jangan pernah `db.<model>` mentah dengan `tenantId` dari client.
2. Buat helper standar (mis. `getScopedDb(req)`) yang mengambil tenant dari sesi/subdomain, bukan dari input client.
3. Aktifkan/percayakan RLS Postgres sebagai jaring pengaman lapis kedua untuk semua model tenant-scoped.

---

### C2. Type checking & ESLint dimatikan saat build

`next.config.ts:60-69`:
```ts
typescript: { ignoreBuildErrors: true },   // "asumsinya type check sudah di lokal"
eslint:     { ignoreDuringBuilds: true },
```
Artinya build produksi **tidak pernah gagal** karena error tipe/lint. Digabung dengan ~1.370 pemakaian `any` (lihat H4), jaminan keamanan tipe praktis hilang di CI/CD. `prebuild` memang menjalankan `typecheck`, tapi ini mudah ter-skip (mis. Docker/Vercel yang memanggil `next build` langsung).

**Rekomendasi:** Perbaiki error tipe secara bertahap, lalu set `ignoreBuildErrors: false`. Minimal, pastikan pipeline deploy benar-benar menjalankan `npm run typecheck` sebagai gate wajib.

---

## 🟠 HIGH

### H1. Guard otorisasi duplikat dengan kontrak berbeda

Ada **dua** `requireTenantAccess` dengan signature tak kompatibel:
- `src/lib/guards/tenant-guard.ts` — **melempar `throw`** saat gagal, mengembalikan `session.user`.
- `src/lib/tenant-guard.ts` — **mengembalikan objek** `{ membership, session, error }` (tidak throw).

Membingungkan pemanggil dan mudah salah pakai (lupa cek `.error` → otorisasi terlewati). Plus `requireTenantMembership` di `src/lib/api-utils.ts` sebagai jalur ketiga.

**Rekomendasi:** Satukan menjadi satu modul guard dengan satu kontrak (disarankan pola return-object yang eksplisit), migrasikan semua pemanggil, hapus yang lain.

### H2. Service layer di-bypass ~80%

Service layer ada (`src/features/*/services/*.service.ts`) tetapi **244 dari 305** `route.ts` mengimpor `@/lib/db` dan query Prisma inline; **46** `page.tsx` juga query DB langsung. Business logic tersebar di route/komponen, bukan di service.
Contoh: `api/super-admin/analytics/route.ts` (520 baris agregasi inline), `api/admin/academy/enroll/route.ts`, `api/admin/website/faq/route.ts`.

**Rekomendasi:** Pindahkan akses DB + logika ke service; route hanya jadi thin controller (auth → validasi → panggil service → response).

### H3. God components (700–1300 baris)

Beberapa `page.tsx` client menggabung data-fetching + logika + UI:
- `admin/attendance/gtk/overview/page.tsx` — **1303 baris**, 31 `useState`, 6 `useEffect`, 7 `fetch()`.
- `admin/attendance/gtk/presence/page.tsx` — 1213 baris.
- `panel-gtk/absensi/page.tsx` — 782 · `(public)/daftarkan-sekolah/page.tsx` — 688 · `super-admin/tenants/plans/page.tsx` — 613.

**Rekomendasi:** Pecah jadi sub-komponen + custom hooks (data ke `use*` hooks / server components), targetkan <300 baris per file.

### H4. Type safety dirusak `any` masif

- **`: any` → 996** occurrences, **`as any` → 372** (total ~1.370) di `src/`, meski `strict: true`.
- Contoh: `(session?.user as any)?.tenants?.[0]?.plan` (`admin/broadcast/page.tsx:101`), prop `course: any` (`academy/learn/[slug]/player-client.tsx:11`), banyak `(res as any).error`, `metadata as any`.

**Rekomendasi:** Ketik sesi NextAuth dengan augmentasi modul, tipe DTO Prisma, dan lint rule `no-explicit-any` (warn → error bertahap).

### H5. Error handling bocor & logging tidak konsisten

- **~393** `catch (…: any)` yang umumnya `return NextResponse.json({ error: error.message }, 500)` → **membocorkan detail internal** ke client (**221** referensi `error.message`).
- Logger terstruktur (`src/lib/logger.ts`) hanya dipakai di 95 file, sementara ada **363 `console.*`** mentah. Tiga util logging tumpang tindih: `logger.ts`, `error-logger.ts`, `error-reporter.ts`.

**Rekomendasi:** Standarisasi: log detail via `logger`/Sentry di server, kembalikan pesan generik + kode error ke client. Satukan util logging.

---

## 🟡 MEDIUM

### M1. `findMany` tanpa `take` (unbounded)
**321** panggilan `findMany`, **~208 (65%) tanpa `take:`**. Contoh: `affiliate/referrals/page.tsx:254`, `admin/academy/page.tsx:714`. Berpotensi memori/latency membengkak seiring pertumbuhan data. → Terapkan pagination default.

### M2. Index tenant kurang
8 model tenant-scoped tanpa `@@index` pada `tenantId`: `TenantUser`, `TenantScore`, `SocialMediaCredential`, `LearningObjective`, `FormativeScore`, `SummativeScore`, `ReportCard`, `P5Project` (`prisma/schema.prisma`). → Query tenant memicu full scan. Tambahkan index.

### M3. Caching tidak seragam
Infra cache ada (`lib/cache.ts`, `lib/redis.ts`, `dashboard-cache.service.ts`, 86 call-site) tetapi ad hoc; mayoritas read path (208 findMany) langsung ke DB. → Tetapkan strategi read-through cache untuk data panas.

### M4. Rate limiting tidak menutup jalur pembayaran
Rate limit granular hanya di route auth/public. Route **payment/webhook/topup/pay** hanya mengandalkan limit per-IP global di `middleware.ts:155`. → Tambahkan rate limit + verifikasi signature khusus pada callback pembayaran & webhook.

### M5. Validasi input tidak konsisten (Zod)
Dari **135** route yang membaca JSON body, **106 tidak memvalidasi** dengan schema (destructure manual). Zod hanya di 51 file. Bahkan dalam satu file bisa campur: `finance/invoices/[id]/pay/route.ts` — POST tervalidasi (`:22`), PUT tidak (`:62`). → Wajibkan `schema.safeParse` di semua boundary.

### M6. Testing minim untuk skala aplikasi
Hanya **17** file test. Terisolasi baik: tenant-scope, guard, token, rate-limit, validations. **Tidak ada test** untuk auth/login/session dan **seluruh domain finance/billing/invoice/payment** (padahal 114 model & service finance kompleks). → Prioritaskan test isolasi tenant + finance + auth.

---

## 🟢 LOW

### L1. Repo kotor
File scratch/artefak di root: `rclone.zip` (~29MB), `update.tar`, `tsconfig.tsbuildinfo` (~1.2MB), `next_log.txt`, puluhan `query*.sql/.js`, `test-*.ts`, `check-*.ts`, `scratch*.ts`, `audit-buttons.js`, report JSON. → Bersihkan; sebagian binari besar untung belum ter-track.

### L2. Duplikasi util & 8 dir agent
3 util logging (lihat H5); `lib/utils.ts` vs folder `lib/utils/`. 8 direktori config AI-agent (`.claude`, `.factory`, `.iflow`, `.kilocode`, `.kiro`, `.trae`, `.windsurf`, `.agents`). → Konsolidasi.

### L3. `.gitignore` bocor untuk scratch `.ts`
Meng-ignore `check-*.js`/`test-*.js` tapi **bukan** varian `.ts`/`scratch_*.ts`, sehingga file scratch TypeScript tetap ter-track. `dist/`, `backups/`, `rclone-*/` juga belum di-ignore. Selain itu bagus (`.env` gitignored, `.env.example` ada). Catatan: `docker-compose` pakai default kredensial `postgres`/`postgres` (`${POSTGRES_PASSWORD:-postgres}`) — ganti untuk produksi. Tidak ada field `engines` di package.json (hanya `.nvmrc`=22).

---

## Yang Sudah Baik (jangan diubah)

- Isolasi tenant lapis-dalam **tersedia** (RLS + `withTenant` + `set_config` transaction-local) — desainnya benar, tinggal ditegakkan.
- Security headers + CSP di `next.config.ts`.
- `src/lib/env.ts` memvalidasi env produksi wajib (fail-fast).
- Rate limiter fail-closed di produksi (`rate-limit.ts:45`).
- Slow-query telemetry + Sentry di `db.ts`.
- Tidak ada secret hardcoded; `.env` gitignored; `.env.example` lengkap.
- Struktur feature-based + `_template` (walau belum konsisten diikuti).

---

## Urutan Perbaikan yang Disarankan

1. **C1 — IDOR** (paling mendesak): audit & tutup ~32 route tenant-scoped, mulai dari finance & PII. Buat helper scoped-db terpusat.
2. **C2** — pastikan typecheck jadi gate deploy wajib; rencanakan `ignoreBuildErrors: false`.
3. **H1** — satukan guard.
4. **M4/M5** — amankan jalur pembayaran (rate limit + signature + Zod).
5. **H2/H3** — refactor bertahap (service layer + pecah God components) sambil menambah **test** (M6) untuk finance & tenant isolation.
6. **M1/M2/M3** — pagination, index, caching.
7. **L1–L3** — housekeeping repo.
