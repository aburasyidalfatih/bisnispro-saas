# Panduan Refactor Skala Enterprise (Feature-Sliced Design)

Dokumen ini adalah standar arsitektur resmi untuk SchoolPro SaaS.

## Status: ✅ REFACTOR SELESAI (Fase 1-4 + Fase A-C)

### Fase yang Telah Dituntaskan
1. **Fase 1:** Decoupling Services dari `src/lib/` ke `src/features/[fitur]/services/`
2. **Fase 2:** Strict DTO Mappings & Verification Token Service
3. **Fase 3:** End-to-End Encapsulation (Server Actions & Zod Schemas)
4. **Fase 4:** Thin Controllers untuk Cron Jobs
5. **Fase A:** Thin Controllers untuk Finance, Wallet, Billing, & Super Admin
6. **Fase B:** Thin Controllers untuk Tenant, Website CMS, Posts, Events, Categories
7. **Fase C:** Thin Controllers untuk Notifications, Messages, Users, AI Settings

## Aturan Emas (Boy Scout Rule)
1. **Fitur Baru:** Setiap fitur baru WAJIB dibuat menggunakan pola arsitektur ini.
2. **Perbaikan Bug (Refactor Sambil Jalan):** Jika Anda ditugaskan memperbaiki bug di fitur lama (misal: Tagihan), perbaiki bug tersebut sekaligus pindahkan file-file yang berserakan ke dalam folder fitur yang baru.

## Struktur Folder Standar
Silakan salin folder `src/features/_template/` setiap kali membuat fitur baru.

Struktur folder untuk sebuah fitur (contoh: `billing`):
```text
src/features/billing/
 ├── components/           # UI Component KHUSUS untuk fitur ini
 ├── services/             # Logika Bisnis & Koneksi Database (Prisma)
 │    └── billing.service.ts
 ├── actions/              # Next.js Server Actions (Mutasi Data via Form)
 │    └── billing.action.ts
 └── schemas/              # Skema Zod untuk input pengguna
      └── billing.schema.ts
```

## Service Registry (28 Service Files)
Berikut peta lengkap service layer yang sudah terbentuk:

| Domain | Service File | Tanggung Jawab |
|--------|-------------|----------------|
| **AI** | `ai/services/ai.service.ts` | Core AI logic |
| | `ai/services/ai-settings.service.ts` | Get/update AI settings, usage logs |
| **Audit** | `audit/services/audit.service.ts` | Audit logging |
| **Auth** | `auth/services/token.service.ts` | Token management |
| | `auth/services/two-factor.service.ts` | 2FA logic |
| **Dashboard** | `dashboard/services/dashboard-cache.service.ts` | Cached dashboard stats |
| **Export** | `export/services/export.service.ts` | Data export logic |
| **Finance** | `finance/services/billing.service.ts` | Billing CRUD, auto-debet, invoice expiry |
| | `finance/services/billing-notification.service.ts` | Invoice/payment WA & email notifications |
| | `finance/services/finance.service.ts` | SPP & invoice management |
| | `finance/services/payment.service.ts` | Payment processing |
| | `finance/services/wallet.service.ts` | Wallet history, topup, settings, billing dashboard |
| **Gamification** | `gamification/services/gamification.service.ts` | Points system |
| | `gamification/services/leaderboard.service.ts` | Leaderboard sync |
| **Import** | `import/services/import.service.ts` | Bulk data import |
| **Notification** | `notification/services/notification.service.ts` | WA, email, in-app sender |
| | `notification/services/inbox.service.ts` | Notifications, messages, unread counts |
| | `notification/services/drip-campaign.service.ts` | Drip campaign processing |
| | `notification/services/wa-queue.service.ts` | WA queue retry logic |
| **Post/CMS** | `post/services/content.service.ts` | Posts, events, categories CRUD |
| **Super Admin** | `super-admin/services/super-admin.service.ts` | Tenant management, payment reports |
| **Tenant** | `tenant/services/tenant-management.service.ts` | Website data, settings, subdomain |
| | `tenant/services/user-management.service.ts` | User CRUD, role checks, password hashing |
| | `tenant/services/tenant-public.service.ts` | Public tenant cache |
| | `tenant/services/domain.service.ts` | Custom domain management |
| | `tenant/services/application.service.ts` | Tenant application/registration |
| **Upload** | `upload/services/upload.service.ts` | File upload handling |

## Keuntungan Pola Ini
1. **Separation of Concerns:** `actions.ts` hanya mengatur validasi dan HTTP request. Logika bisnis yang rumit aman tersembunyi di `services.ts`.
2. **Mencegah "Spaghetti Imports":** Semua kebutuhan fitur ada di dalam folder `features/[nama-fitur]/`.
3. **Mencegah Prisma Leakage:** Di `actions.ts`, kita memvalidasi input *sebelum* dikirim ke Service. Di `services.ts`, kita me-return objek bersih, bukan objek mentah Prisma yang membocorkan data sensitif.
4. **Thin Controllers:** API Routes (`src/app/api/...`) hanya bertugas sebagai pengatur lalu lintas HTTP (auth check, parse body, delegate ke service, return response).

## Cara Menggunakan API Routes vs Server Actions
- Gunakan **Server Actions (`actions.ts`)** untuk 95% interaksi dashboard (Submit Form, Hapus Data, Edit Profil).
- Gunakan **API Routes (`src/app/api/...`)** HANYA untuk:
  - *Webhooks* (seperti Callback dari Tripay/Midtrans).
  - *Public API* untuk pihak ketiga.
  - Endpoint yang diakses oleh layanan luar (Cron Jobs, Upstash QStash).

## Folder `src/lib/` — Cross-Cutting Concerns SAJA
Folder `src/lib/` HANYA boleh berisi infrastruktur global yang digunakan oleh SELURUH fitur:
- `db.ts` — Prisma client singleton
- `auth.ts` / `auth.config.ts` — NextAuth configuration
- `api-utils.ts` — HTTP parsing & auth helpers (`requireAuth`, `parseBody`, `requireTenantMembership`)
- `logger.ts` — Logger global (Winston)
- `redis.ts` — Redis client & cache helpers
- `queue/` — BullMQ job queue infrastructure
- `utils.ts` / `utils/` — Generic utilities (format, slug, dll)
- `rate-limit.ts` / `edge-rate-limit.ts` — Rate limiting middleware
- `tenant-guard.ts` / `guards/` — Auth & role guards
- `error-reporter.ts` — Error reporting (Sentry/custom)
- `themes.ts` — Theme constants & config
- `data/` — Static data (plan definitions, pricing, dll)

**JANGAN menambahkan logika bisnis baru ke `src/lib/`!**

## Sisa Refactor (Boy Scout Rule)
~50 API routes di `src/app/api/` masih meng-import `db` secara langsung. Mayoritas adalah **CRUD ultra-sederhana** (1-2 query), **webhooks**, atau **utility endpoints**. Mereka BOLEH di-refactor secara bertahap (Boy Scout Rule) ketika ada bug yang perlu diperbaiki, tetapi TIDAK wajib karena tidak mengandung logika bisnis kompleks.

## Strategi Caching & Invalidation (Fase 4 - Skala Enterprise)
Untuk memastikan performa 10/10 dan meminimalkan beban database pada 10.000+ tenant, SchoolPro menerapkan strategi caching multi-tier:

### 1. Unified Cache Helper (`src/lib/cache.ts`)
Semua fitur caching wajib menggunakan `cacheGet`, `cacheSet`, dan `cacheInvalidate` dari unified cache helper dengan konvensi key yang terpusat (`cacheKeys`). Caching ini mendukung 3-tier fallback otomatis (Upstash -> Local Redis -> In-memory).

### 2. Standar Konvensi Key Cache
*   **Public Site Data:** `tenant:site:${slug}` (Invalidasi setiap kali profil, kontak, program, atau setting website berubah).
*   **Posts/News List:** `posts:${tenantId}:p${page}` (Invalidasi jika ada postingan baru dibuat, dihapus, atau diedit).
*   **Post Details:** `post:${slug}:${postId}` (Invalidasi jika isi post/berita diupdate).
*   **Events/Staff/Gallery:** `events:${tenantId}`, `staff:${tenantId}`, `gallery:${tenantId}`.

### 3. Invalidation Actions (Pemicu Invalidasi)
Setiap kali Service melakukan operasi mutasi data (CREATE/UPDATE/DELETE), panggil fungsi invalidasi yang bersesuaian:
```typescript
import { cacheInvalidate, cacheKeys } from "@/lib/cache"

// Contoh saat edit profil sekolah
await db.tenant.update({ ... })
await cacheInvalidate(cacheKeys.tenantSite(slug))
```

### 4. Incremental Static Regeneration (ISR)
Halaman publik tenant (`src/app/site/[slug]/page.tsx`) diatur menggunakan ISR dengan `export const revalidate = 300` (5 menit). Hal ini menjamin Time-to-First-Byte (TTFB) super cepat di level Edge CDN serta mengurangi overhead query database yang berulang.

### 5. Client & CDN Static Headers
Semua aset statis tenant (seperti logo, galeri, lampiran dokumen) yang di-serve via `/api/files/...` disematkan header `Cache-Control: public, max-age=31536000, s-maxage=31536000, immutable` untuk memanfaatkan caching permanen di level Browser dan Edge CDN.

