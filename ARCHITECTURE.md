# 🏗️ SchoolPro SaaS — Architecture Blueprint

> Dokumen ini adalah peta arsitektur teknis resmi untuk seluruh fitur SchoolPro.
> Dijaga sinkron dengan kode. Setiap sesi development, mulailah dari sini.

---

## 📁 Struktur Folder Route (App Router)

```
src/app/
├── (landing)/                    ← Halaman publik (beranda, harga, dll)
├── (auth)/                       ← Login, Register, Lupa Password
├── (super-admin)/                ← Panel Super Admin SchoolPro
│   └── super-admin/
│       ├── applications/         ← Persetujuan massal tenant baru ✅
│       ├── tenants/              ← Manajemen semua sekolah
│       └── ...
│
├── (dashboard)/                  ← Multi-role Dashboard (layout.tsx)
│   │
│   ├── admin/                    ← PANEL ADMIN SEKOLAH
│   │   ├── page.tsx              ← Dasbor utama + statistik ✅
│   │   │
│   │   ├── website/              ← [DONE ✅] Manajemen Website Sekolah
│   │   │   ├── posts/            ← Artikel & berita
│   │   │   ├── events/           ← Acara & agenda
│   │   │   ├── gtk/              ← Data guru/staf untuk website
│   │   │   ├── facilities/       ← Fasilitas
│   │   │   ├── programs/         ← Program unggulan
│   │   │   ├── extracurriculars/ ← Ekstrakurikuler
│   │   │   ├── alumni/           ← Data alumni
│   │   │   ├── achievements/     ← Prestasi
│   │   │   ├── sliders/          ← Banner slider
│   │   │   ├── gallery/          ← Galeri foto
│   │   │   ├── documents/        ← Unduhan publik
│   │   │   └── popups/           ← Pop-up pengumuman
│   │   │
│   │   ├── ppdb/                 ← [PARTIAL ✅] PPDB & Pendaftaran
│   │   │   ├── page.tsx          ← Dasbor PPDB
│   │   │   ├── pendaftar/        ← Daftar & detail pendaftar
│   │   │   │   └── [id]/         ← Detail + tombol Sinkronisasi ✅
│   │   │   ├── periode/          ← Gelombang pendaftaran
│   │   │   ├── persyaratan/      ← Berkas yang diperlukan
│   │   │   └── tagihan/          ← Tagihan biaya pendaftaran
│   │   │
│   │   ├── students/             ← [SCAFFOLD 🔧] EPIC 0: Master Data Siswa
│   │   │   ├── page.tsx          ← Daftar semua siswa aktif
│   │   │   ├── [id]/             ← Detail profil siswa
│   │   │   ├── classrooms/       ← Manajemen kelas & rombel
│   │   │   │   └── [id]/         ← Detail kelas + daftar siswa
│   │   │   └── import/           ← Import massal via Excel
│   │   │
│   │   ├── finance/              ← [SCAFFOLD 🔧] EPIC 2: Keuangan & SPP
│   │   │   ├── page.tsx          ← Dasbor keuangan (rangkuman)  (PREMIUM)
│   │   │   ├── billing-type/     ← Template jenis tagihan
│   │   │   ├── invoice/          ← Tagihan siswa
│   │   │   │   ├── [id]/         ← Detail tagihan + cicilan
│   │   │   │   └── create/       ← Buat tagihan baru / massal
│   │   │   ├── cashflow/         ← Arus kas masuk/keluar
│   │   │   └── rekening/         ← Rekening bank sekolah
│   │   │
│   │   ├── canteen/              ← [SCAFFOLD 🔧] EPIC 3: E-Kantin (PREMIUM)
│   │   │   ├── page.tsx          ← Dasbor kantin (omzet, transaksi)
│   │   │   ├── merchants/        ← Daftar pedagang
│   │   │   │   └── [id]/         ← Detail pedagang
│   │   │   ├── transactions/     ← Riwayat transaksi
│   │   │   └── withdrawals/      ← Pengajuan penarikan dana
│   │   │
│   │   ├── attendance/           ← [SCAFFOLD 🔧] EPIC 4: Absensi (PREMIUM)
│   │   │   ├── page.tsx          ← Rekap kehadiran + analytics
│   │   │   ├── sessions/         ← Sesi absensi per hari/kelas
│   │   │   │   └── [id]/         ← Detail sesi + input kehadiran
│   │   │   ├── staff/            ← Check-in/out guru & staf
│   │   │   └── permits/          ← Persetujuan izin/sakit
│   │   │
│   │   ├── donation/             ← [SCAFFOLD 🔧] EPIC 5: Donasi (PREMIUM)
│   │   │   ├── page.tsx          ← Dasbor donasi (total terkumpul)
│   │   │   └── campaigns/        ← Kelola kampanye
│   │   │       ├── [id]/         ← Detail kampanye + donor list
│   │   │       └── create/       ← Buat kampanye baru
│   │   │
│   │   ├── users/                ← [DONE ✅] Manajemen pengguna
│   │   ├── settings/             ← [DONE ✅] Pengaturan sekolah
│   │   ├── billing/              ← [DONE ✅] Langganan & upgrade plan
│   │   ├── notifications/        ← [DONE ✅] Notifikasi
│   │   └── reports/              ← [SCAFFOLD 🔧] Laporan & export
│   │
│   ├── ortu/                     ← PORTAL ORANG TUA
│   │   ├── page.tsx              ← Home Dashboard (live data) ✅
│   │   ├── ppdb/                 ← [DONE ✅] Status pendaftaran PPDB
│   │   ├── tagihan/              ← [SCAFFOLD 🔧] Tagihan SPP (PREMIUM)
│   │   │   └── [id]/             ← Detail tagihan + bayar
│   │   ├── wallet/               ← [PARTIAL ✅] SchoolPay Wallet (PREMIUM)
│   │   │   ├── topup/            ← Top-Up via Tripay ✅
│   │   │   └── history/          ← Riwayat transaksi wallet
│   │   ├── absensi/              ← [SCAFFOLD 🔧] Kehadiran anak (PREMIUM)
│   │   ├── izin/                 ← [SCAFFOLD 🔧] Ajukan izin/sakit (PREMIUM)
│   │   └── donasi/               ← [SCAFFOLD 🔧] Donasi 1-klik (PREMIUM)
│   │
│   ├── panel-gtk/                ← PORTAL GURU & STAF
│   │   ├── page.tsx              ← Dasbor guru ✅
│   │   └── profil/               ← Profil & pengaturan akun ✅
│   │
│   └── panel-kantin/             ← PORTAL MERCHANT KANTIN (PREMIUM)
│       ├── page.tsx              ← Dasbor kasir
│       ├── products/             ← Kelola menu
│       │   └── [id]/             ← Edit produk
│       ├── scan/                 ← Halaman scan QR siswa
│       └── withdrawals/          ← Ajukan penarikan saldo
│
└── site/                         ← WEBSITE PUBLIK TENANT
    └── [slug]/                   ← Website per sekolah ✅
        ├── page.tsx              ← Beranda
        ├── berita/               ← Artikel (dengan pagination) ✅
        ├── agenda/               ← Jadwal acara
        ├── ppdb/                 ← Halaman PPDB publik
        └── donasi/               ← 🔧 Halaman donasi publik (EPIC 5)
```

---

## 🗄️ Database Schema Map (Prisma)

| Group | Models | Status |
|---|---|---|
| **Core Multi-Tenant** | `Tenant`, `TenantUser`, `TenantApplication` | ✅ Done |
| **Auth & User** | `User`, `Session`, `VerificationToken`, `Invitation` | ✅ Done |
| **Notif & Audit** | `Notification`, `NotificationSetting`, `AuditLog` | ✅ Done |
| **Payment (Platform)** | `Payment`, `SubscriptionPlan`, `Subscription` | ✅ Done |
| **Website CMS** | `Post`, `Category`, `Event`, `Document`, `Achievement`, `Staff`, `Alumni`, `Program`, `Facility`, `Extracurricular`, `Slider`, `Popup` | ✅ Done |
| **Email Drip** | `DripCampaign`, `DripLog` | ✅ Done |
| **Affiliate** | `AffiliateProfile`, `AffiliateCommission`, `AffiliateWithdrawal` | ✅ Done |
| **WhatsApp** | `WaSession`, `WaMessage` | ✅ Done |
| **EPIC 0 — PPDB** | `PeriodePpdb`, `PersyaratanBerkas`, `PendaftarPpdb`, `BerkasPpdb`, `TagihanPpdb`, `PembayaranPpdb` | ✅ Done |
| **EPIC 0 — Siswa** | `Student`, `StudentParent`, `Classroom` | ✅ Done |
| **EPIC 1 — Wallet** | `WalletAccount`, `WalletTransaction`, `Cashflow` | ✅ Done |
| **EPIC 2 — Billing** | `BillingType`, `Invoice`, `InvoicePayment`, `Installment` | ✅ Scaffolded |
| **EPIC 3 — E-Kantin** | `CanteenMerchant`, `CanteenProduct`, `CanteenOrder`, `CanteenOrderItem`, `CanteenWithdrawal` | ✅ Scaffolded |
| **EPIC 4 — Absensi** | `AttendanceSession`, `AttendanceRecord`, `StaffAttendance`, `AttendancePermit` | ✅ Scaffolded |
| **EPIC 5 — Donasi** | `DonationCampaign`, `Donation` | ✅ Scaffolded |
| **Lain-lain** | `Rekening`, `InternalMessage`, `FileUpload`, `ContactSubmission`, `PlatformSetting` | ✅ Done |

---

## 🔑 Aturan Wajib Development (dari ROADMAP)

1. **Setiap model WAJIB punya `tenantId`** — tidak ada data yang boleh bocor antar sekolah.
2. **Fitur Premium** — selalu cek `tenant?.plan !== "free"` di UI dan validasi di API.
3. **Soft Delete** — model krusial (Invoice, Student, Campaign) pakai `deletedAt DateTime?`.
4. **Audit Trail** — gunakan `AuditLog` untuk transaksi keuangan dan perubahan data sensitif.
5. **Tenant Guard** — semua API endpoint pakai `requireTenantAccess(tenantId)`.
6. **Security** — fitur Wallet/Kantin yang melibatkan uang WAJIB verifikasi PIN 6-digit di sisi server.

---

## 🚦 Status Fitur

| EPIC | Fitur | Schema | Routes | UI | API | Status |
|---|---|:---:|:---:|:---:|:---:|---|
| 0 | PPDB → Sinkronisasi Siswa | ✅ | ✅ | ✅ | ✅ | **Live** |
| 0 | Manajemen Kelas | ✅ | ✅ | ✅ | ✅ | **Live** |
| 0 | Data Master Siswa | ✅ | ✅ | ✅ | ✅ | **Live** |
| 1 | SchoolPay Wallet (DB) | ✅ | ✅ | ✅ | ✅ | **Live** |
| 1 | Top-Up via Tripay | ✅ | ✅ | ✅ | ✅ | **Live** |
| 1 | Riwayat Transaksi Wallet | ✅ | ✅ | ✅ | ✅ | **Live** |
| 2 | Jenis Tagihan (Template) | ✅ | ✅ | ✅ | ✅ | **Live** |
| 2 | Invoice / Tagihan Siswa | ✅ | ✅ | ✅ | ✅ | **Live** |
| 2 | Auto-Debet SPP (Cron) | ✅ | ✅ | — | ✅ | **Live** |
| 2 | Cicilan Tagihan | ✅ | ✅ | ✅ | ✅ | **Live** |
| 2 | Portal Bayar Ortu | ✅ | ✅ | ✅ | ✅ | **Live** |
| 3 | E-Kantin Merchant | ✅ | ✅ | ✅ | ✅ | **Live** |
| 3 | Scan QR Kasir | ✅ | ✅ | ✅ | ✅ | **Live** |
| 3 | Penarikan Dana | ✅ | ✅ | ✅ | ✅ | **Live** |
| 4 | Absensi Harian Siswa | ✅ | ✅ | ✅ | ✅ | **Live** |
| 4 | Absensi Guru + GPS | ✅ | ✅ | ✅ | ✅ | **Live** |
| 4 | Izin/Sakit Digital | ✅ | ✅ | ✅ | ✅ | **Live** |
| 5 | Kampanye Donasi | ✅ | ✅ | ✅ | ✅ | **Live** |
| 5 | Donasi Publik (tanpa login) | ✅ | ✅ | ✅ | ✅ | **Live** |
| 6 | Parent Portal Dasbor | ✅ | ✅ | ✅ | ✅ | **Live** |
| 6 | Rekap Absensi Ortu | ✅ | ✅ | ✅ | ✅ | **Live** |
| 6 | Pengajuan Izin Ortu | ✅ | ✅ | ✅ | ✅ | **Live** |
| 2 | Jenis Tagihan UI | ✅ | ✅ | ✅ | ✅ | **Live** |

> **Legend:** ✅ Done | 🔧 Scaffold/Placeholder | ❌ Not Started
