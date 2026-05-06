# 14. Tools & Utilitas Admin

## 14.1 Gambaran Umum

Modul tools menyediakan utilitas untuk operasional sistem: pengumuman, billing generator, backup database, maintenance mode, antrian job, monitoring server, dan system log.

---

## 14.2 Pengumuman

- **Views**: `admin/tool/announcement-*` (index, add, edit, detail, preview, deleted)
- **Controller**: `Admin/Tool.php`

### Fitur
- CRUD pengumuman internal
- Rich text editor (TinyMCE)
- Preview sebelum publish
- Soft delete & restore
- Tampil di dashboard member

---

## 14.3 Banner Informasi

- **Views**: `admin/tool/banner-information.blade.php`

### Fitur
- Kelola banner visual di portal member
- Upload gambar
- Set link tujuan
- Aktifkan/nonaktifkan

---

## 14.4 Billing Generator

- **Views**: `admin/tool/billing-*` (index, add, edit, detail)

### Fitur
- Konfigurasi billing otomatis
- Set jadwal: harian, mingguan, bulanan
- Set channel notifikasi (email, WhatsApp)
- Template pesan notifikasi
- Eksekusi manual
- Log eksekusi billing

---

## 14.5 Backup Database

- **Views**: `admin/tool/backup.blade.php`
- **Controller API**: `API/AutoBackup.php`
- **Tabel**: `spa_backups`

### Struktur Data

| Field | Tipe | Keterangan |
|-------|------|------------|
| backup_id | bigint PK | ID unik |
| backup_code | varchar(16) | Kode backup |
| backup_name | varchar(64) | Nama file backup |
| backup_time | datetime | Waktu backup |
| backup_size | varchar(16) | Ukuran file |
| backup_type | enum(AT,MN) | AT=Otomatis, MN=Manual |
| backup_by | varchar(64) | Admin yang menjalankan |

### Fitur
- Backup database manual oleh admin
- Backup otomatis via API/cron job
- Daftar riwayat backup
- Download file backup
- Informasi ukuran file

---

## 14.6 Mode Maintenance

- **Views**: `admin/tool/maintenance.blade.php`
- **Middleware**: `MaintenanceCheck`

### Fitur
- Aktifkan/nonaktifkan mode maintenance
- Saat aktif, member & publik melihat halaman maintenance
- Admin tetap bisa mengakses sistem
- Halaman maintenance: `admin/errors/maintenance.blade.php`, `member/.../errors/maintenance.blade.php`

---

## 14.7 Antrian Job (Queue)

- **Views**: `admin/tool/queue.blade.php`, `queue-detail.blade.php`
- **Controller API**: `API/SystemQueue.php`
- **Tabel**: `spa_queues`

### Struktur Data

| Field | Tipe | Keterangan |
|-------|------|------------|
| queue_id | bigint PK | ID unik |
| queue_type | varchar(32) | Tipe job (email, whatsapp, dll) |
| queue_name | varchar(64) | Nama job |
| queue_data | text | Data job (JSON) |
| queue_response_data | text | Response data (JSON) |
| is_active | tinyint(1) | Status aktif |
| is_processed | tinyint(1) | Sudah diproses |
| processed_by | varchar(64) | Diproses oleh |
| processed_at | datetime | Waktu diproses |

### Fitur
- Daftar antrian job (email, notifikasi WA, billing)
- Detail job: data, response, status
- Proses ulang job yang gagal
- Hapus job dari antrian

---

## 14.8 Info Server

- **Views**: `admin/tool/server.blade.php`

### Fitur
- Informasi PHP version & extensions
- Informasi server (OS, web server)
- Informasi database
- Informasi disk space
- Informasi Laravel version

---

## 14.9 System Log

- **Views**: `admin/tool/system-log.blade.php`
- **Tabel**: `spa_logs`

### Struktur Data

| Field | Tipe | Keterangan |
|-------|------|------------|
| account_id | bigint FK | Akun yang melakukan aksi |
| method | varchar(16) | HTTP method (GET, POST, PUT, DELETE) |
| url | tinytext | URL yang diakses |
| referer | tinytext | Halaman sebelumnya |
| ip | varchar(32) | IP address |
| username | varchar(64) | Username |
| fullname | varchar(64) | Nama lengkap |
| module | varchar(32) | Modul yang diakses |
| action | varchar(255) | Aksi yang dilakukan |
| parameter | text | Parameter request |

### Fitur
- Daftar seluruh aktivitas pengguna
- Filter berdasarkan user, modul, tanggal
- Detail log: IP, method, URL, parameter
- Audit trail untuk keamanan

---

## 14.10 Portal News Management

- **Views**: `admin/tool/portal-news-*` (index, add, edit, detail, preview, deleted)

### Fitur
- CRUD berita untuk portal publik
- Rich text editor (TinyMCE)
- Upload thumbnail
- Preview sebelum publish
- URL slug untuk SEO
- Soft delete & restore
