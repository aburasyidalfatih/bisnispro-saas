# 15. Pengaturan Sistem

## 15.1 Gambaran Umum

Modul pengaturan mengelola seluruh konfigurasi aplikasi melalui antarmuka admin. Pengaturan disimpan di tabel `spa_settings` dengan format key-value yang dikelompokkan.

---

## 15.2 Tabel Pengaturan (`spa_settings`)

| Field | Tipe | Keterangan |
|-------|------|------------|
| setting_id | bigint PK | ID unik |
| setting_name | varchar(100) | Nama pengaturan (label) |
| setting_key | varchar(64) | Key unik |
| setting_value | text | Nilai pengaturan |
| setting_group | varchar(32) | Grup pengaturan |
| required | tinyint(1) | Wajib diisi |
| input_type | varchar(32) | Tipe input (text, textarea, select, file, dll) |

---

## 15.3 Pengaturan Umum (General)

- **Views**: `admin/setting/general.blade.php`
- **Controller**: `Admin/Setting.php`

### Konfigurasi
- Nama sekolah / yayasan
- Alamat sekolah
- Nomor telepon
- Email sekolah
- Logo sekolah (upload)
- Favicon
- Zona waktu
- Format tanggal
- Mata uang

---

## 15.4 Pengaturan Tampilan (Display)

- **Views**: `admin/setting/display.blade.php`

### Konfigurasi
- Tema warna
- Layout dashboard
- Konfigurasi sidebar
- Pengaturan tampilan tabel

---

## 15.5 Pengaturan Pembayaran (Payment)

- **Views**: `admin/setting/payment.blade.php`

### Konfigurasi
- Aktifkan/nonaktifkan pembayaran online
- Pilih payment gateway aktif (Midtrans, Tripay, Flip, Moota, Mutasibank)
- API Key & Secret Key per gateway
- Mode: Sandbox / Production
- Biaya admin / fee
- Pengaturan expired pembayaran
- Channel pembayaran yang tersedia

---

## 15.6 Pengaturan Email

- **Views**: `admin/setting/email.blade.php`
- **Template**: `email/main.blade.php`

### Konfigurasi
- SMTP Host
- SMTP Port
- SMTP Username
- SMTP Password
- Encryption (TLS/SSL)
- Sender Name
- Sender Email
- Template email

---

## 15.7 Pengaturan WhatsApp

- **Views**: `admin/setting/whatsapp.blade.php`

### Konfigurasi
- Aktifkan/nonaktifkan notifikasi WA
- API URL gateway WhatsApp
- API Key / Token
- Nomor pengirim
- Template pesan

---

## 15.8 Pengaturan Notifikasi

- **Views**: `admin/setting/notification.blade.php`
- **Notification Classes**: `Notification/Billing.php`, `Notification/PaymentCash.php`, `Notification/PaymentOnline.php`, `Notification/Admission.php`

### Konfigurasi
- Channel notifikasi aktif (email, WhatsApp, atau keduanya)
- Template notifikasi per event:
  - Tagihan baru
  - Pembayaran tunai berhasil
  - Pembayaran online berhasil
  - Informasi PSB
- Variabel template (nama siswa, nominal, tanggal, dll)

---

## 15.9 Pengaturan Portal

- **Views**: `admin/setting/portal.blade.php`

### Konfigurasi
- Aktifkan/nonaktifkan portal publik
- Judul portal
- Deskripsi portal
- Logo portal
- Pengaturan halaman donasi publik

---

## 15.10 Pengaturan Backup

- **Views**: `admin/setting/backup.blade.php`

### Konfigurasi
- Aktifkan/nonaktifkan backup otomatis
- Jadwal backup (harian/mingguan)
- Retensi backup (berapa lama disimpan)

---

## 15.11 Pengaturan Sistem

- **Views**: `admin/setting/system.blade.php`
- **Tabel**: `spa_system`

### Struktur Data Sistem

| Field | Tipe | Keterangan |
|-------|------|------------|
| app_name | varchar(32) | Nama aplikasi |
| app_version | varchar(16) | Versi aplikasi |
| app_version_build | varchar(16) | Build number |
| license_key | char(34) | License key |
| license_detail | text | Detail lisensi |
| license_hash | text | Hash lisensi |

### Konfigurasi
- Informasi versi aplikasi
- Manajemen lisensi
- Konfigurasi teknis sistem

---

## 15.12 Menu Pengaturan

- **Views**: `admin/components/setting-menu.blade.php`

Navigasi pengaturan ditampilkan sebagai sidebar menu:
1. Umum (General)
2. Tampilan (Display)
3. Pembayaran (Payment)
4. Email
5. WhatsApp
6. Notifikasi
7. Portal
8. Backup
9. Sistem
