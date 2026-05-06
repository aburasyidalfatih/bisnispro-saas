# 9. Donasi

## 9.1 Gambaran Umum

Modul donasi memungkinkan sekolah mengelola penggalangan dana digital melalui kampanye donasi. Mendukung donasi dari siswa (via portal member) maupun publik (via portal donasi).

---

## 9.2 Tabel Terkait

| Tabel | Fungsi |
|-------|--------|
| `spa_donation_agencies` | Lembaga penerima donasi |
| `spa_donation_campaigns` | Kampanye donasi |
| `spa_donation_logs` | Log transaksi donasi |

---

## 9.3 Lembaga Donasi (Agency)

- **Views**: `admin/donation/agency-index.blade.php`, `agency-detail.blade.php`, `agency-deleted.blade.php`
- **Tabel**: `spa_donation_agencies`

| Field | Tipe | Keterangan |
|-------|------|------------|
| agency_id | bigint PK | ID unik |
| agency_code | varchar(32) | Kode lembaga |
| agency_name | varchar(64) | Nama lembaga |
| agency_logo | varchar(128) | Path logo |
| description | varchar(255) | Deskripsi |
| is_active | tinyint(1) | Status aktif |
| is_deleted | tinyint(1) | Soft delete |

### Fitur
- CRUD lembaga donasi
- Upload logo lembaga
- Soft delete & restore

---

## 9.4 Kampanye Donasi

- **Views**: `admin/donation/campaign-*` (index, add, edit, detail, deleted)
- **Controller**: `Admin/Donation.php`
- **Tabel**: `spa_donation_campaigns`

| Field | Tipe | Keterangan |
|-------|------|------------|
| campaign_id | bigint PK | ID unik |
| agency_id | bigint FK | Lembaga penerima |
| admin_id | bigint FK | Admin pembuat |
| campaign_name | varchar(100) | Nama kampanye |
| campaign_target | float | Target donasi (nominal) |
| campaign_category | varchar(16) | Kategori (pendidikan, sosial, dll) |
| campaign_coverage | char(3) | Cakupan (internal/publik) |
| campaign_end | date | Tanggal berakhir |
| campaign_banner | varchar(255) | Path banner/gambar |
| description | varchar(255) | Deskripsi kampanye |
| slug | varchar(255) | URL slug untuk portal publik |
| view_count | int(5) | Jumlah view |
| is_active | tinyint(1) | Status aktif |
| is_deleted | tinyint(1) | Soft delete |

### Fitur
- CRUD kampanye donasi
- Upload banner kampanye
- Set target donasi & tanggal berakhir
- Kategori kampanye
- Cakupan: internal (hanya siswa) atau publik (terbuka)
- URL slug untuk akses publik
- Tracking jumlah view
- Soft delete & restore

---

## 9.5 Transaksi Donasi

- **Views**: `admin/donation/report-index.blade.php`, `report-detail.blade.php`
- **Tabel**: `spa_donation_logs`

| Field | Tipe | Keterangan |
|-------|------|------------|
| id | bigint PK | ID unik |
| student_id | bigint FK | Siswa donatur (jika internal) |
| admin_id | bigint FK | Admin yang mencatat |
| payment_id | bigint FK | Referensi pembayaran online |
| agency_id | bigint FK | Lembaga penerima |
| campaign_id | bigint FK | Kampanye terkait |
| donation_code | varchar(32) | Kode donasi unik |
| donation_name | varchar(64) | Nama donatur |
| donation_phone | varchar(16) | Telepon donatur |
| donation_type | enum(IN,OUT) | IN=Donasi masuk, OUT=Penyaluran |
| donation_amount | float | Nominal |
| donation_fund | varchar(16) | Sumber dana |
| donation_category | varchar(32) | Kategori |
| donation_note | varchar(255) | Catatan |
| donation_time | datetime | Waktu donasi |
| donation_status | enum(MP,LN,DB) | MP=Menunggu, LN=Lunas, DB=Dibatalkan |

### Fitur
- Daftar seluruh transaksi donasi
- Filter berdasarkan lembaga, kampanye, status, tanggal
- Detail transaksi
- Tracking donasi masuk (IN) dan penyaluran (OUT)
- Export data donasi ke Excel

---

## 9.6 Portal Donasi Publik

- **Views**: `portal/donation-index.blade.php`, `donation-detail.blade.php`, `donation-payment.blade.php`
- **Controller**: `Portal/MainController.php`

### Fitur
- Halaman daftar kampanye donasi aktif
- Detail kampanye: deskripsi, target, progress, banner
- Form donasi: nama, telepon, nominal
- Pembayaran online via payment gateway
- Tanpa perlu login (donasi publik)

---

## 9.7 Donasi via Portal Member

- **Views**: `member/themes/mobile-responsive/donation/` (index, detail, history, history-detail)
- **Controller**: `Member/Donation.php`

### Fitur
- Daftar kampanye donasi untuk siswa
- Donasi langsung dari portal member
- Riwayat donasi siswa
- Detail transaksi donasi

---

## 9.8 Pengaturan Donasi

- **Views**: `admin/donation/setting.blade.php`
- Konfigurasi fitur donasi (aktif/nonaktif, pengaturan umum)

---

## 9.9 Business Rules Donasi

### Kampanye
1. Kampanye harus terhubung ke lembaga (`agency_id`)
2. `campaign_target` adalah target nominal yang ingin dicapai
3. `campaign_end` adalah batas waktu kampanye
4. Kampanye yang sudah lewat `campaign_end` otomatis tidak tampil di portal (tapi tetap aktif di admin)
5. `campaign_coverage`: internal (hanya siswa via portal member) atau publik (terbuka via portal donasi)
6. `slug` auto-generated dari `campaign_name`, harus unik

### Donasi Masuk (IN)
1. Donatur input nama, telepon, nominal
2. Jika dari portal member: `student_id` terisi
3. Jika dari portal publik: `student_id` null, `donation_name` dan `donation_phone` wajib
4. Buat pembayaran online tipe DonationBill
5. Setelah pembayaran berhasil:
   - `donation_status` → LN
   - Catat ke `spa_cashflows` (REVENUE, akun 0004 - Transaksi Donasi)
   - Update progress kampanye (total terkumpul = Σ donation_amount where status = LN)

### Penyaluran (OUT)
1. Admin catat penyaluran dana donasi
2. `donation_type = 'OUT'`
3. Catat ke cashflow sebagai EXPEND
4. Tracking saldo donasi per kampanye: total masuk - total keluar

### Progress Kampanye
- Progress = (Σ donasi LN / campaign_target) × 100%
- Tampilkan di portal donasi sebagai progress bar
- Kampanye tetap bisa menerima donasi melebihi target
