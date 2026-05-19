# Panduan Refactor Skala Enterprise (Feature-Sliced Design)

Dokumen ini adalah standar arsitektur resmi untuk SchoolPro SaaS.
Karena kita menghindari *Big Bang Refactor* (merombak seluruh aplikasi sekaligus yang berisiko tinggi mematahkan fitur), kita akan menggunakan pendekatan **Incremental Refactor (Boy Scout Rule)**.

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
 ├── actions.ts            # Next.js Server Actions (Mutasi Data via Form)
 └── validations.ts        # Skema Zod untuk input pengguna
```

## Keuntungan Pola Ini
1. **Separation of Concerns:** `actions.ts` hanya mengatur validasi dan HTTP request. Logika perhitungan uang yang rumit aman tersembunyi di `services.ts`.
2. **Mencegah "Spaghetti Imports":** Anda tidak perlu lagi mengimpor file dari 10 tempat berbeda. Semua kebutuhan fitur Tagihan ada di dalam folder `features/billing/`.
3. **Mencegah Prisma Leakage:** Di `actions.ts`, kita memvalidasi input *sebelum* dikirim ke Service. Di `services.ts`, kita me-return objek bersih, bukan objek mentah Prisma yang membocorkan password atau data sensitif lain.

## Cara Menggunakan API Routes vs Server Actions
- Gunakan **Server Actions (`actions.ts`)** untuk 95% interaksi dashboard (Submit Form, Hapus Data, Edit Profil).
- Gunakan **API Routes (`src/app/api/...`)** HANYA untuk:
  - *Webhooks* (seperti Callback dari Tripay/Midtrans).
  - *Public API* untuk pihak ketiga.
  - Endpoint yang diakses oleh layanan luar (Cron Jobs, Upstash QStash).
