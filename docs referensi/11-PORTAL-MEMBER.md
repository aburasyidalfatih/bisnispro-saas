# 11. Portal Member (Siswa / Wali Murid)

## 11.1 Gambaran Umum

Portal member adalah antarmuka untuk siswa dan wali murid. Didesain mobile-responsive untuk akses via smartphone. Menyediakan informasi tagihan, pembayaran online, tabungan, absensi, donasi, dan pengumuman.

---

## 11.2 Arsitektur

- **Views**: `member/themes/mobile-responsive/`
- **Controllers**: `Member/` (MemberController, Bill, Payment, Saving, Attendance, Donation)
- **Layout**: `layouts/member.blade.php`
- **Middleware**: `AuthenticateMember`

---

## 11.3 Dashboard

- **Views**: `dashboard/` (index, announcement, announcement-detail, banner-information)

### Fitur
- Ringkasan tagihan aktif (jumlah & total nominal)
- Informasi pembayaran terakhir
- Banner informasi dari sekolah
- Daftar pengumuman terbaru
- Detail pengumuman

---

## 11.4 Tagihan

- **Views**: `bill/` (index, detail, payment, payments)
- **Controller**: `Member/Bill.php`

### Fitur
- Daftar seluruh tagihan (belum lunas & lunas)
- Detail tagihan: komponen, nominal, diskon, sisa
- **Bayar tagihan tunggal** (`payment.blade.php`)
- **Bayar tagihan multiple** (`payments.blade.php`) — pilih beberapa tagihan sekaligus
- Pilih metode pembayaran online
- Redirect ke payment gateway

---

## 11.5 Riwayat Pembayaran

- **Views**: `payment/` (index, detail, print, print-multiple, print-other)
- **Controller**: `Member/Payment.php`

### Fitur
- Daftar seluruh riwayat pembayaran
- Detail transaksi: nominal, metode, status, tanggal
- Cetak kwitansi:
  - `print.blade.php` — kwitansi pembayaran tunggal
  - `print-multiple.blade.php` — kwitansi pembayaran multiple
  - `print-other.blade.php` — kwitansi lainnya (tabungan, donasi)

---

## 11.6 Tabungan

- **Views**: `saving/` (index, print)
- **Controller**: `Member/Saving.php`

### Fitur
- Lihat saldo tabungan terkini
- Riwayat transaksi tabungan (setor/tarik)
- Cetak buku tabungan

---

## 11.7 Absensi

- **Views**: `attendance/` (index, detail, record)
- **Controller**: `Member/Attendance.php`

### Fitur
- Rekap kehadiran per bulan
- Detail absensi per tanggal
- Record absensi (jika fitur diaktifkan)

---

## 11.8 Donasi

- **Views**: `donation/` (index, detail, history, history-detail)
- **Controller**: `Member/Donation.php`

### Fitur
- Daftar kampanye donasi aktif
- Detail kampanye & form donasi
- Riwayat donasi siswa
- Detail transaksi donasi

---

## 11.9 Akun

- **Views**: `account/` (index, profile, biodata, password, notification)

### Fitur
- **Profil**: lihat & edit foto profil
- **Biodata**: lihat data siswa lengkap
- **Password**: ganti password
- **Notifikasi**: pengaturan notifikasi

---

## 11.10 Komponen UI

- **Views**: `components/` (header, footer, image-zoom, payment-bank)
- Header dengan navigasi mobile
- Footer dengan menu bottom navigation
- Image zoom untuk lihat foto/dokumen
- Komponen info rekening bank untuk pembayaran

---

## 11.11 Halaman Error

- `account-disabled.blade.php` — Akun dinonaktifkan
- `account-inused.blade.php` — Akun sedang login di perangkat lain
- `maintenance.blade.php` — Sistem maintenance
- `index.blade.php` — Error umum
