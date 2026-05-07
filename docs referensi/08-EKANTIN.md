# 8. E-Kantin (Digital Canteen)

## 8.1 Gambaran Umum

Modul e-kantin memungkinkan transaksi cashless di kantin sekolah. Siswa membayar menggunakan saldo tabungan via scan QR code. Pedagang (merchant) memiliki portal sendiri untuk mengelola transaksi dan penarikan dana.

---

## 8.2 Tabel Terkait

| Tabel | Fungsi |
|-------|--------|
| `spa_ekantin_merchants` | Data pedagang kantin |
| `spa_ekantin_transactions` | Transaksi jual-beli |
| `spa_ekantin_sessions` | Sesi transaksi (keamanan) |
| `spa_ekantin_withdrawals` | Penarikan dana merchant |

---

## 8.3 Manajemen Merchant

- **Views**: `admin/ekantin/` (merchant-index, merchant-detail, merchant-deleted)
- **Controller**: `Admin/Ekantin.php`
- **Middleware**: `EkantinFeatureCheck`

### Struktur Data (`spa_ekantin_merchants`)

| Field | Tipe | Keterangan |
|-------|------|------------|
| merchant_id | bigint PK | ID unik |
| account_id | bigint FK | Akun login merchant |
| merchant_code | varchar(32) | Kode merchant unik |
| merchant_qrid | varchar(128) | QR ID untuk pembayaran |
| merchant_name | varchar(64) | Nama toko/warung |
| merchant_owner | varchar(64) | Nama pemilik |
| merchant_type | varchar(32) | Tipe usaha (makanan, minuman, dll) |
| merchant_bank_account | varchar(16) | Nomor rekening bank |
| merchant_bank_name | varchar(32) | Nama bank |
| is_active | tinyint(1) | Status aktif |
| is_deleted | tinyint(1) | Soft delete |

### Fitur Admin
- CRUD merchant
- Assign akun login (role MC)
- Generate QR code merchant
- Soft delete & restore
- Lihat detail merchant: profil, transaksi, penarikan

---

## 8.4 Transaksi E-Kantin

- **Views**: `admin/ekantin/transaction-index.blade.php`, `transaction-detail.blade.php`
- **Tabel**: `spa_ekantin_transactions`

### Struktur Data

| Field | Tipe | Keterangan |
|-------|------|------------|
| transaction_id | bigint PK | ID unik |
| merchant_id | bigint FK | Merchant penerima |
| account_id | bigint FK | Akun tabungan siswa (`spa_savings_accounts`) |
| type | enum(SL,WD) | SL=Sale (penjualan), WD=Withdrawal (penarikan) |
| category | enum(CR,DB) | CR=Kredit, DB=Debit |
| amount_total | float | Nominal transaksi |
| amount_current | float | Saldo sebelum |
| amount_end | float | Saldo sesudah |
| description | varchar(255) | Deskripsi |
| reference | varchar(32) | Kode referensi |

### Alur Transaksi Pembelian
1. Siswa scan QR code merchant di portal e-kantin
2. Input nominal pembelian
3. Masukkan PIN tabungan
4. Sistem validasi saldo & PIN
5. Potong saldo tabungan siswa
6. Tambah saldo merchant
7. Catat transaksi di `spa_ekantin_transactions`
8. Generate bukti transaksi

---

## 8.5 Sesi Transaksi (`spa_ekantin_sessions`)

| Field | Tipe | Keterangan |
|-------|------|------------|
| account_id | bigint FK | Akun tabungan |
| token | varchar(64) | Token sesi unik |
| pin_attempt | tinyint(1) | Jumlah percobaan PIN |
| is_used | tinyint(1) | Sesi sudah digunakan |
| is_success | tinyint(1) | Transaksi berhasil |
| expired_at | datetime | Waktu expired sesi |

### Keamanan
- Setiap transaksi memerlukan sesi baru
- Token sesi memiliki waktu expired
- Tracking percobaan PIN (anti brute-force)
- Sesi hanya bisa digunakan sekali (`is_used`)

---

## 8.6 Penarikan Dana Merchant

- **Views**: `admin/ekantin/withdrawal-index.blade.php`, `withdrawal-detail.blade.php`
- **Tabel**: `spa_ekantin_withdrawals`

### Struktur Data

| Field | Tipe | Keterangan |
|-------|------|------------|
| withdrawal_id | bigint PK | ID unik |
| merchant_id | bigint FK | Merchant |
| admin_id | bigint FK | Admin yang memproses |
| admin_name | varchar(64) | Nama admin |
| withdrawal_code | varchar(24) | Kode penarikan |
| withdrawal_amount | float | Nominal penarikan |
| withdrawal_method | enum(TN,NT) | TN=Tunai, NT=Non-Tunai (transfer) |
| withdrawal_bank | varchar(128) | Info bank tujuan |
| withdrawal_status | enum(DP,SC,DB) | DP=Diproses, SC=Sukses, DB=Dibatalkan |
| withdrawal_note | varchar(64) | Catatan |
| withdrawal_attachment | varchar(64) | Bukti transfer |
| confirmed_at | datetime | Waktu konfirmasi |
| confirmed_note | varchar(64) | Catatan konfirmasi |
| canceled_at | datetime | Waktu pembatalan |
| canceled_note | varchar(64) | Alasan pembatalan |

### Alur Penarikan
1. Merchant ajukan penarikan dana
2. Admin review permintaan
3. Admin proses: transfer bank atau tunai
4. Upload bukti transfer (jika non-tunai)
5. Update status: DP → SC (sukses) atau DB (batal)

---

## 8.7 Portal Merchant

- **Views**: `ekantin/` (index, account, account-profile, payment-scan-qr, transaction, transaction-detail, transaction-print, withdrawal, withdrawal-detail)
- **Controller**: `Ekantin/MainController.php`
- **Layout**: `layouts/ekantin.blade.php`

### Fitur Portal Merchant
- **Dashboard**: ringkasan saldo & transaksi
- **Scan QR**: terima pembayaran dari siswa
- **Riwayat Transaksi**: daftar & detail transaksi, cetak struk
- **Penarikan Dana**: ajukan & pantau status penarikan
- **Profil**: edit profil & akun

---

## 8.8 Pengaturan E-Kantin

- **Views**: `admin/ekantin/setting-general.blade.php`, `setting-transaction.blade.php`

| Pengaturan | Fungsi |
|-----------|--------|
| General | Aktifkan/nonaktifkan fitur e-kantin, konfigurasi umum |
| Transaction | Pengaturan limit transaksi, biaya admin, dll |

---

## 8.9 Business Rules E-Kantin

### Transaksi Pembelian
1. Merchant harus `is_active = 1` dan `is_deleted = 0`
2. Akun tabungan siswa harus `is_active = 1`
3. Saldo tabungan harus >= nominal pembelian
4. PIN harus cocok (bcrypt verify)
5. Maksimal 3 percobaan PIN per sesi → jika gagal 3x, sesi expired
6. Token sesi harus valid: `is_used = 0`, `expired_at > now()`
7. Setelah transaksi berhasil: `is_used = 1`, `is_success = 1`
8. Saldo siswa berkurang, saldo merchant bertambah
9. Catat 2 record di `spa_ekantin_transactions`:
   - Sisi siswa: type=SL, category=DB
   - Sisi merchant: type=SL, category=CR

### Penarikan Dana Merchant
1. Merchant ajukan penarikan → status DP (Diproses)
2. Nominal penarikan tidak boleh melebihi saldo merchant
3. Admin review dan proses:
   - Jika tunai (TN): serahkan uang, update status → SC
   - Jika transfer (NT): transfer ke rekening merchant, upload bukti, update status → SC
4. Jika dibatalkan: status → DB, isi `canceled_note`
5. Saldo merchant berkurang setelah status SC

### Saldo Merchant
- Saldo = Σ transaksi masuk (CR) - Σ penarikan sukses (SC)
- Dihitung dari `spa_ekantin_transactions` dan `spa_ekantin_withdrawals`

### Keamanan Sesi
- Setiap transaksi memerlukan sesi baru (token unik)
- Sesi expired setelah waktu tertentu (misal 5 menit)
- Sesi hanya bisa digunakan sekali
- Tracking percobaan PIN untuk anti brute-force
