# School Payment App v2.0 — Dokumentasi Fitur

## Informasi Umum

| Item | Detail |
|------|--------|
| Nama Aplikasi | School Payment App™ |
| Versi | 2.0 (Build 2602072300) |
| Rilis | Februari 2026 |
| Framework | Laravel 9 (PHP 8.0+) |
| Database | MySQL (InnoDB, prefix `spa_`) |
| UI Template | Tabler (Bootstrap 5) |
| Enkripsi Source | ionCube Loader |
| Lisensi DJKI | No. Registrasi 000516752 |
| Pengembang | Septiana Nugraha (@septianangr) |
| Website | https://www.schoolpay.co.id |

---

## Arsitektur Aplikasi

```
┌─────────────────────────────────────────────────────┐
│                   PORTAL PUBLIK                     │
│         (Berita, Donasi, Pendaftaran PSB)           │
├──────────┬──────────┬──────────┬────────────────────┤
│  ADMIN   │  MEMBER  │ E-KANTIN │   PSB REGISTRAR    │
│  PANEL   │  PORTAL  │ MERCHANT │     PORTAL         │
├──────────┴──────────┴──────────┴────────────────────┤
│              LARAVEL 9 BACKEND                      │
│  Controllers │ Models │ Middleware │ Payment Handler │
├─────────────────────────────────────────────────────┤
│              MySQL DATABASE (33+ tabel)             │
├─────────────────────────────────────────────────────┤
│           INTEGRASI PAYMENT GATEWAY                 │
│   Midtrans │ Tripay │ Flip │ Moota │ Mutasibank    │
└─────────────────────────────────────────────────────┘
```

---

## Daftar Modul & Dokumen

| No | Modul | File Dokumen |
|----|-------|-------------|
| 1 | Autentikasi & Manajemen Akun | [01-AUTENTIKASI.md](01-AUTENTIKASI.md) |
| 2 | Data Master | [02-DATA-MASTER.md](02-DATA-MASTER.md) |
| 3 | Manajemen Tagihan | [03-TAGIHAN.md](03-TAGIHAN.md) |
| 4 | Pembayaran | [04-PEMBAYARAN.md](04-PEMBAYARAN.md) |
| 5 | Tabungan Siswa | [05-TABUNGAN.md](05-TABUNGAN.md) |
| 6 | Arus Kas & Mutasi | [06-ARUS-KAS.md](06-ARUS-KAS.md) |
| 7 | Penerimaan Siswa Baru (PSB) | [07-PSB-ADMISSION.md](07-PSB-ADMISSION.md) |
| 8 | E-Kantin | [08-EKANTIN.md](08-EKANTIN.md) |
| 9 | Donasi | [09-DONASI.md](09-DONASI.md) |
| 10 | Absensi | [10-ABSENSI.md](10-ABSENSI.md) |
| 11 | Portal Member | [11-PORTAL-MEMBER.md](11-PORTAL-MEMBER.md) |
| 12 | Portal Publik & Konten | [12-PORTAL-PUBLIK.md](12-PORTAL-PUBLIK.md) |
| 13 | Laporan & Export | [13-LAPORAN.md](13-LAPORAN.md) |
| 14 | Tools & Utilitas | [14-TOOLS.md](14-TOOLS.md) |
| 15 | Pengaturan Sistem | [15-PENGATURAN.md](15-PENGATURAN.md) |
| 16 | Struktur Database | [16-DATABASE.md](16-DATABASE.md) |

---

## Role Pengguna

| Kode | Nama Role | Akses Utama |
|------|-----------|-------------|
| AU | Super Admin | Seluruh fitur tanpa batasan |
| TU | Tata Usaha | Operasional umum sekolah |
| AK | Admin Keuangan | Pembayaran, tagihan, laporan keuangan |
| AM | Admin Master | Data master (siswa, kelas, unit) |
| AA | Admin Admission | Penerimaan siswa baru (PSB) |
| AT | Admin Tool | Tools, pengumuman, backup, maintenance |
| AC | Admin Cashflow | Arus kas, mutasi rekening |
| MC | Merchant | Pedagang e-kantin |
| — | Member (Siswa/Wali) | Portal member, bayar tagihan, lihat info |
| — | Registrar (PSB) | Portal pendaftaran siswa baru |

---

## Tech Stack

| Komponen | Teknologi |
|----------|-----------|
| Backend | Laravel 9, PHP 8.0+ |
| Database | MySQL (InnoDB) |
| Frontend | Tabler Bootstrap 5, jQuery |
| DataTables | Yajra Laravel DataTables |
| Charts | ApexCharts |
| PDF Export | barryvdh/laravel-dompdf |
| Excel Export/Import | Maatwebsite Excel 3.x |
| Image Processing | Intervention Image |
| Payment Gateway | Midtrans PHP SDK |
| HTTP Client | Guzzle 7.x |
| Rich Text Editor | TinyMCE |
| Date Picker | Litepicker |
| Select Dropdown | Tom Select |
| QR Code | html5-qrcode, qr-code-styling |
| Camera Capture | jQuery Camshoot |
| Image Cropping | Croppie |
| Icons | Font Awesome |
| Font | Inter (Variable) |
| Print | Print.js |
| Bahasa | Indonesia, English |

| 17 | Business Rules & Aturan Bisnis | [17-BUSINESS-RULES.md](17-BUSINESS-RULES.md) |

---

## Catatan Rebuild

Dokumentasi ini disusun sebagai acuan untuk membangun ulang aplikasi School Payment App dengan stack baru. Setiap dokumen fitur mencakup:

1. **Daftar fitur** — apa saja yang harus dibangun
2. **Struktur data** — tabel, field, tipe data, relasi
3. **Business rules** — aturan bisnis, validasi, alur proses, status flow
4. **Kalkulasi** — rumus perhitungan keuangan (tagihan, cicilan, diskon, saldo)

### Yang Perlu Ditentukan Saat Rebuild
- Arsitektur aplikasi (monolith vs microservice)
- Skema autentikasi (JWT, session, OAuth)
- State management
- API design (REST vs GraphQL)
- Payment gateway yang akan diintegrasikan
- Hosting & deployment strategy
- CI/CD pipeline
