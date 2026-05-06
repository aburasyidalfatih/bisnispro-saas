# 5. Tabungan Siswa

## 5.1 Gambaran Umum

Modul tabungan memungkinkan sekolah mengelola tabungan siswa secara digital, termasuk setoran, penarikan, cetak buku tabungan, dan integrasi dengan e-kantin.

---

## 5.2 Tabel Terkait

### Akun Tabungan (`spa_savings_accounts`)

| Field | Tipe | Keterangan |
|-------|------|------------|
| account_id | bigint PK | ID unik |
| student_id | bigint FK | Siswa pemilik |
| account_number | char(12) | Nomor rekening tabungan |
| account_pin | varchar(64) | PIN (hashed) untuk transaksi e-kantin |
| account_qrid | varchar(128) | QR ID untuk scan |
| is_active | tinyint(1) | Status aktif |

### Transaksi Tabungan (`spa_savings`)

| Field | Tipe | Keterangan |
|-------|------|------------|
| saving_id | bigint PK | ID unik |
| unit_id | bigint FK | Unit sekolah |
| student_id | bigint FK | Siswa |
| payment_id | bigint FK | Referensi pembayaran online (jika via online) |
| admin_id | bigint FK | Admin yang memproses |
| admin_name | varchar(64) | Nama admin |
| reference | varchar(32) | Kode referensi transaksi |
| depositor | varchar(64) | Nama penyetor |
| description | varchar(100) | Deskripsi transaksi |
| amount_total | float | Nominal transaksi |
| amount_current | float | Saldo sebelum transaksi |
| amount_end | float | Saldo setelah transaksi |
| category | enum(CR,DB) | CR=Kredit (setor), DB=Debit (tarik) |
| note | varchar(128) | Catatan |

### Log Tabungan (`spa_savings_logs`)

| Field | Tipe | Keterangan |
|-------|------|------------|
| time | datetime | Waktu transaksi |
| status | varchar(8) | Status |
| student_id | bigint | Siswa |
| student_name | varchar(64) | Nama siswa |
| saving_id | bigint | Referensi transaksi |
| amount | varchar(16) | Nominal |
| category | char(2) | CR/DB |
| reference | varchar(32) | Kode referensi |

---

## 5.3 Fitur Detail

- **Views**: `admin/student-saving/` (index, detail, transaction, transaction-add, transaction-detail, transaction-print, print, print-html, print-qr)
- **Controller**: `Admin/StudentSaving.php`
- **Model**: `Saving.php`
- **Middleware**: `SavingFeatureCheck` (fitur bisa diaktifkan/nonaktifkan)

### Daftar Tabungan
- List seluruh siswa dengan saldo tabungan
- Filter berdasarkan unit dan kelas
- Tampilkan saldo terkini per siswa

### Setoran (Kredit)
- Input setoran manual oleh admin
- Catat nama penyetor, nominal, deskripsi
- Otomatis update saldo (`amount_current` → `amount_end`)
- Generate kode referensi unik
- Setoran via pembayaran online (via `SavingBill.php`)

### Penarikan (Debit)
- Input penarikan oleh admin
- Validasi saldo mencukupi
- Otomatis update saldo

### Cetak
- **Cetak buku tabungan**: `print.blade.php`, `print-html.blade.php`
- **Cetak bukti transaksi**: `transaction-print.blade.php`
- **Cetak QR Code**: `print-qr.blade.php` — QR untuk identifikasi akun tabungan siswa

### Integrasi E-Kantin
- Saldo tabungan digunakan untuk transaksi di e-kantin
- Transaksi e-kantin terhubung ke `spa_savings_accounts` via `account_id`
- Siswa scan QR + input PIN untuk bayar di kantin

---

## 5.4 Business Rules Tabungan

### Akun Tabungan
1. Setiap siswa hanya punya 1 akun tabungan
2. `account_number` 12 digit, auto-generated, unik
3. `account_pin` di-hash (tidak disimpan plain text)
4. `account_qrid` unik, digunakan untuk generate QR code
5. Akun bisa dinonaktifkan (`is_active = 0`) → tidak bisa transaksi

### Setoran (Kredit)
1. Nominal harus > 0
2. `amount_current` = saldo sebelum transaksi
3. `amount_end` = `amount_current` + `amount_total`
4. Generate `reference` unik
5. Catat `depositor` (nama penyetor, bisa beda dari siswa)
6. Otomatis catat ke `spa_cashflows` sebagai REVENUE (akun 0002 - Transaksi Tabungan)

### Penarikan (Debit)
1. Nominal harus > 0
2. Validasi: `amount_current` >= `amount_total` (saldo cukup)
3. `amount_end` = `amount_current` - `amount_total`
4. Hanya bisa dilakukan oleh admin
5. Otomatis catat ke `spa_cashflows` sebagai EXPEND

### Setoran Online
1. Member pilih menu tabungan → input nominal
2. Buat pembayaran online tipe SavingBill
3. Setelah callback berhasil:
   - Buat record tabungan (CR)
   - Update saldo
   - Catat cashflow
4. `payment_id` di record tabungan mereferensi pembayaran online

### Saldo Konsistensi
- `amount_end` dari transaksi terakhir = saldo terkini siswa
- Jika ada inkonsistensi, recalculate dari seluruh history transaksi
- Saldo tidak boleh negatif
