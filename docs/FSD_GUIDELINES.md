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
 ├── components/           # UI Component KHUSUS untuk tagihan (Cart, Invoice Card, dll)
 ├── services/             # Logika Bisnis & Koneksi Database (Prisma)
 │    └── billing.service.ts
 ├── actions/              # Next.js Server Actions (Mutasi Data via Form)
 │    └── billing.action.ts
 └── schemas/              # Skema Zod untuk input pengguna
      └── billing.schema.ts
```

## Keuntungan Pola Ini
1. **Separation of Concerns:** `actions.ts` hanya mengatur validasi dan HTTP request. Logika perhitungan uang yang rumit aman tersembunyi di `services.ts`.
2. **Mencegah "Spaghetti Imports":** Anda tidak perlu lagi mengimpor file dari 10 tempat berbeda. Semua kebutuhan fitur Tagihan ada di dalam folder `features/billing/`.
3. **Mencegah Prisma Leakage:** Di `actions.ts`, kita memvalidasi input *sebelum* dikirim ke Service. Di `services.ts`, kita me-return objek bersih, bukan objek mentah Prisma yang membocorkan password atau data sensitif lain.
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
- `auth.ts` — NextAuth configuration
- `api-utils.ts` — HTTP parsing helpers
- `logger.ts` — Logger global
- `redis.ts` — Redis client
- `queue/` — BullMQ job queue
- `utils.ts` — Generic utilities
- `rate-limit.ts` — Rate limiting
- `tenant-guard.ts` — Auth guards

**JANGAN menambahkan logika bisnis baru ke `src/lib/`!**
