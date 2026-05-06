# 3. Manajemen Tagihan

## 3.1 Gambaran Umum

Modul tagihan adalah inti dari sistem keuangan sekolah. Mendukung pembuatan tagihan multi-komponen, diskon per siswa, cicilan fleksibel, dan billing otomatis.

---

## 3.2 Tagihan (Bills)

- **Views**: `admin/bill/` (index, list, add, edit, detail, manage, import, discount, discount-add, discount-detail)
- **Controller**: `Admin/Master/Bill.php`
- **Tabel**: `spa_bills`

### Struktur Data

| Field | Tipe | Keterangan |
|-------|------|------------|
| bill_id | bigint PK | ID unik |
| unit_id | bigint FK | Unit sekolah |
| class_id | bigint FK | Kelas |
| student_id | bigint FK | Siswa |
| bill_code | varchar(32) | Kode tagihan unik |
| bill_number | varchar(4) | Nomor urut |
| bill_month | varchar(2) | Bulan tagihan |
| bill_year | varchar(4) | Tahun tagihan |
| bill_period | varchar(10) | Periode (misal: 2025/2026) |
| bill_due | varchar(2) | Tanggal jatuh tempo |
| bill_note | varchar(255) | Catatan |
| bill_category_1 s/d _6 | varchar(16) | Kode kategori komponen 1-6 |
| bill_name_1 s/d _6 | varchar(64) | Nama komponen 1-6 |
| bill_amount_1 s/d _6 | float | Nominal komponen 1-6 |
| bill_discount_1 s/d _6 | float | Diskon komponen 1-6 |
| bill_status | tinyint(1) | 0=Belum Lunas, 1=Lunas |
| amount_discount | float | Total diskon |
| amount_total | float | Total tagihan |
| amount_paid | float | Total terbayar |
| amount_remaining | float | Sisa tagihan |
| payment_invoice | varchar(16) | Nomor invoice |
| payment_code | varchar(32) | Kode pembayaran |
| payment_type | enum(BL,CL) | BL=Bayar Lunas, CL=Cicilan |
| payment_amount_x1 s/d _x9 | float | Nominal cicilan ke-1 s/d ke-9 |
| payment_code_x1 s/d _x9 | varchar(32) | Kode pembayaran cicilan 1-9 |
| batch_number | varchar(16) | Nomor batch import |
| synced_at | datetime | Waktu sinkronisasi |

### Fitur Detail

#### Pembuatan Tagihan
- Buat tagihan per siswa atau per kelas (massal)
- Hingga **6 komponen tagihan** dalam satu record (misal: SPP + Uang Gedung + Kegiatan + Seragam + Buku + Lainnya)
- Setiap komponen memiliki kategori, nama, nominal, dan diskon sendiri
- Import tagihan massal via Excel

#### Sistem Cicilan
- Mendukung **2 tipe pembayaran**: BL (Bayar Lunas) dan CL (Cicilan)
- Cicilan hingga **9 kali** dengan nominal dan kode pembayaran terpisah per cicilan
- Tracking `amount_paid` dan `amount_remaining` secara real-time

#### Manajemen Tagihan
- List tagihan per kelas/unit
- Detail tagihan per siswa
- Edit tagihan (nominal, komponen, catatan)
- Manage tagihan massal

---

## 3.3 Diskon Tagihan

- **Views**: `admin/bill/discount.blade.php`, `discount-add.blade.php`, `discount-detail.blade.php`
- **Tabel**: `spa_bills_discounts`

### Struktur Data

| Field | Tipe | Keterangan |
|-------|------|------------|
| discount_id | bigint PK | ID unik |
| student_id | bigint FK | Siswa penerima diskon |
| category_id | bigint FK | Kategori tagihan |
| category_code | varchar(16) | Kode kategori |
| discount_amount | float | Nilai diskon |
| discount_type | enum(F,P) | F=Fixed (nominal), P=Persentase |
| discount_total | float | Total diskon terhitung |
| discount_note | varchar(64) | Catatan diskon |
| is_active | tinyint(1) | Status aktif |

### Fitur
- Atur diskon per siswa per kategori tagihan
- Dua tipe diskon: **Fixed** (potongan nominal tetap) atau **Persentase** (% dari nominal)
- Diskon otomatis diterapkan saat generate tagihan
- Aktivasi/nonaktifkan diskon

---

## 3.4 Billing Otomatis

- **Views**: `admin/tool/billing.blade.php`, `billing-add.blade.php`, `billing-edit.blade.php`, `billing-detail.blade.php`
- **Controller**: `Admin/Tool.php`, `API/AutoBilling.php`
- **Tabel**: `spa_billings`, `spa_billings_logs`

### Struktur Data Billing

| Field | Tipe | Keterangan |
|-------|------|------------|
| billing_id | bigint PK | ID unik |
| unit_id | bigint FK | Unit sekolah |
| billing_name | varchar(64) | Nama billing |
| billing_schedule | varchar(16) | Jadwal (harian/mingguan/bulanan) |
| billing_date | datetime | Tanggal eksekusi |
| billing_day | char(2) | Hari eksekusi |
| billing_channel | varchar(32) | Channel notifikasi |
| billing_message | text | Template pesan notifikasi |
| description | varchar(255) | Deskripsi |
| is_active | tinyint(1) | Status aktif |

### Struktur Data Log Billing

| Field | Tipe | Keterangan |
|-------|------|------------|
| billing_id | bigint FK | Referensi billing |
| billing_period | varchar(7) | Periode (misal: 01/2026) |
| billing_type | enum(MN,AT) | MN=Manual, AT=Otomatis |
| billing_result | varchar(255) | Hasil eksekusi |
| is_success | tinyint(1) | Berhasil/gagal |
| admin_name | varchar(64) | Admin yang menjalankan |

### Fitur
- Konfigurasi billing otomatis per unit
- Jadwal: harian, mingguan, atau bulanan
- Generate tagihan otomatis via API/cron job
- Kirim notifikasi otomatis ke wali murid (email/WhatsApp)
- Log setiap eksekusi billing
- Eksekusi manual oleh admin

---

## 3.5 Business Rules Tagihan

### Pembuatan Tagihan
1. Minimal 1 komponen tagihan (bill_category_1 + bill_name_1 + bill_amount_1)
2. Maksimal 6 komponen per tagihan
3. Setiap komponen bisa memiliki diskon sendiri
4. `amount_total` dihitung otomatis: Σ(bill_amount_N - bill_discount_N)
5. `amount_remaining` = `amount_total` pada saat pembuatan (belum ada pembayaran)
6. `bill_code` di-generate otomatis dan harus unik
7. Siswa harus berstatus aktif (student_status = 'A')

### Diskon Otomatis
1. Saat generate tagihan, cek `spa_bills_discounts` untuk siswa + kategori tersebut
2. Jika ada diskon aktif (`is_active = 1`):
   - Tipe F: `bill_discount_N = discount_amount`
   - Tipe P: `bill_discount_N = bill_amount_N × discount_amount / 100`
3. `discount_total` di tabel diskon diupdate dengan total diskon yang sudah diterapkan
4. Satu siswa bisa punya diskon berbeda per kategori tagihan

### Tagihan Massal
1. Admin pilih unit + kelas + periode
2. Sistem generate tagihan untuk SEMUA siswa aktif di kelas tersebut
3. Skip siswa yang sudah punya tagihan untuk periode yang sama
4. Terapkan diskon per siswa jika ada
5. Catat `batch_number` untuk tracking

### Edit Tagihan
1. Tagihan yang sudah ada pembayaran (amount_paid > 0) → hanya bisa edit catatan
2. Tagihan yang belum ada pembayaran → bisa edit komponen dan nominal
3. Setelah edit, recalculate `amount_total`, `amount_discount`, `amount_remaining`

### Hapus Tagihan
1. Tagihan yang sudah ada pembayaran TIDAK bisa dihapus
2. Tagihan tanpa pembayaran bisa dihapus (hard delete)
