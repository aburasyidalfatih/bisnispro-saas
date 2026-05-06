# 12. Portal Publik & Manajemen Konten

## 12.1 Gambaran Umum

Portal publik adalah halaman yang bisa diakses tanpa login. Menampilkan berita sekolah dan halaman donasi publik. Konten dikelola melalui CMS di admin panel.

---

## 12.2 Portal Publik

- **Views**: `portal/` (news-index, news-detail, donation-index, donation-detail, donation-payment)
- **Controller**: `Portal/MainController.php`
- **Layout**: `layouts/portal.blade.php`

### Halaman Berita
- **Daftar Berita** (`news-index.blade.php`): list artikel dengan thumbnail, judul, ringkasan
- **Detail Berita** (`news-detail.blade.php`): konten lengkap artikel
- URL menggunakan slug untuk SEO-friendly

### Halaman Donasi Publik
- **Daftar Kampanye** (`donation-index.blade.php`): kampanye donasi aktif
- **Detail Kampanye** (`donation-detail.blade.php`): deskripsi, target, progress
- **Pembayaran Donasi** (`donation-payment.blade.php`): form donasi & pembayaran online

---

## 12.3 Manajemen Berita

- **Views**: `admin/tool/portal-news-*` (index, add, edit, detail, preview, deleted)
- **Controller**: `Admin/Tool.php`
- **Tabel**: `spa_news`

### Struktur Data

| Field | Tipe | Keterangan |
|-------|------|------------|
| id | bigint PK | ID unik |
| admin_id | bigint FK | Admin penulis |
| title | varchar(64) | Judul berita |
| content | longtext | Konten HTML (via TinyMCE) |
| content_plain | varchar(150) | Ringkasan teks |
| thumbnail | varchar(100) | Path thumbnail |
| status | varchar(8) | Status (draft/published) |
| slug | varchar(128) | URL slug |
| view_count | int(6) | Jumlah view |
| published_at | datetime | Tanggal publikasi |
| deleted_at | datetime | Soft delete |

### Fitur
- CRUD artikel berita
- Rich text editor (TinyMCE) untuk konten
- Upload thumbnail
- Preview sebelum publish
- Status: draft / published
- Tracking view count
- Soft delete & restore
- URL slug otomatis

---

## 12.4 Manajemen Konten (CMS)

- **Tabel**: `spa_contents`

### Struktur Data

| Field | Tipe | Keterangan |
|-------|------|------------|
| content_id | bigint PK | ID unik |
| unit_id | bigint FK | Unit sekolah |
| admin_id | bigint FK | Admin pembuat |
| content_title | varchar(255) | Judul |
| content_body | longtext | Konten HTML |
| content_plain | longtext | Konten plain text |
| content_type | enum | PN=Portal News, AN=Announcement, BN=Banner, AM=Admission |
| content_category | varchar(32) | Kategori |
| content_thumb | varchar(64) | Thumbnail |
| content_status | varchar(16) | Status |
| content_slug | varchar(255) | URL slug |
| content_link | varchar(255) | Link eksternal |
| content_viewed | smallint(6) | View count |
| is_active | tinyint(1) | Status aktif |
| is_deleted | tinyint(1) | Soft delete |
| published_at | datetime | Tanggal publikasi |

### Tipe Konten

| Kode | Tipe | Digunakan Di |
|------|------|-------------|
| PN | Portal News | Portal publik |
| AN | Announcement | Pengumuman internal (admin & member) |
| BN | Banner | Banner informasi di portal member |
| AM | Admission | Pengumuman PSB |

---

## 12.5 Pengumuman Internal

- **Views**: `admin/tool/announcement-*` (index, add, edit, detail, preview, deleted)

### Fitur
- CRUD pengumuman untuk siswa/wali murid
- Rich text editor
- Preview sebelum publish
- Tampil di dashboard member
- Soft delete & restore

---

## 12.6 Banner Informasi

- **Views**: `admin/tool/banner-information.blade.php`

### Fitur
- Kelola banner visual di portal member
- Upload gambar banner
- Link ke halaman tertentu
- Aktifkan/nonaktifkan banner

---

## 12.7 Pengumuman PSB

- **Views**: `admin/admission/announcement-*` (index, add, edit, detail, preview, deleted)

### Fitur
- CRUD pengumuman khusus PSB
- Tampil di portal pendaftaran
- Rich text editor
- Preview & publish
