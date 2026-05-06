# 6. Arus Kas & Mutasi Bank

## 6.1 Gambaran Umum

Modul arus kas mencatat seluruh pemasukan dan pengeluaran sekolah. Modul mutasi bank memantau dan mencocokkan transaksi rekening bank dengan pembayaran di sistem.

---

## 6.2 Arus Kas (Cashflow)

- **Views**: `admin/cashflow/` (index, detail, account)
- **Controller**: `Admin/Cashflow.php`
- **Model**: `Cashflow.php`
- **Tabel**: `spa_cashflows`, `spa_cashflows_accounts`

### Struktur Data Cashflow

| Field | Tipe | Keterangan |
|-------|------|------------|
| cashflow_id | bigint PK | ID unik |
| unit_id | bigint FK | Unit sekolah |
| account_id | bigint FK | Akun kas |
| payment_id | bigint FK | Referensi pembayaran |
| admin_id | bigint FK | Admin yang mencatat |
| admin_name | varchar(64) | Nama admin |
| description | varchar(255) | Deskripsi transaksi |
| amount_total | float | Nominal transaksi |
| amount_current | float | Saldo sebelum |
| amount_end | float | Saldo sesudah |
| category | enum(EXPEND,REVENUE) | Pengeluaran/Pemasukan |
| time | datetime | Waktu transaksi |

### Akun Kas Default (`spa_cashflows_accounts`)

| Kode | Nama | Deskripsi |
|------|------|-----------|
| 0001 | Transaksi Tagihan | Pembayaran tagihan siswa |
| 0002 | Transaksi Tabungan | Pembayaran tabungan |
| 0003 | Transaksi PPDB | Pembayaran PSB |
| 0004 | Transaksi Donasi | Pembayaran donasi |
| 0005 | Transaksi Lainnya | Transaksi lain-lain |

### Fitur
- Daftar seluruh transaksi arus kas
- Filter berdasarkan unit, akun kas, kategori, tanggal
- Detail transaksi dengan referensi ke pembayaran
- Kelola akun kas (tambah, edit, aktifkan/nonaktifkan)
- Otomatis tercatat saat ada pembayaran (tunai maupun online)
- Pencatatan manual untuk pengeluaran

---

## 6.3 Mutasi Bank

- **Views**: `admin/mutation/` (index, detail)
- **Controller**: `Admin/Mutation.php`
- **Tabel**: `spa_mutations`

### Struktur Data

| Field | Tipe | Keterangan |
|-------|------|------------|
| mutation_id | bigint PK | ID unik |
| payment_id | bigint FK | Referensi pembayaran (jika sudah dicocokkan) |
| payment_invoice | varchar(16) | Invoice pembayaran |
| cashflow_id | bigint FK | Referensi arus kas |
| admin_id | bigint FK | Admin yang mengkonfirmasi |
| admin_name | varchar(64) | Nama admin |
| mutation_code | varchar(64) | Kode mutasi |
| mutation_account_number | varchar(32) | Nomor rekening |
| mutation_amount | float | Nominal mutasi |
| mutation_balance | float | Saldo rekening |
| mutation_type | enum(CR,DB) | CR=Kredit (masuk), DB=Debit (keluar) |
| mutation_description | varchar(255) | Deskripsi dari bank |
| mutation_date | datetime | Tanggal mutasi |
| mutation_status | enum | PENDING, CONFIRMED, IGNORED |

### Fitur
- Daftar mutasi rekening bank
- Data mutasi diambil otomatis dari payment gateway (Moota, Mutasibank, Flip)
- **Konfirmasi mutasi**: cocokkan mutasi bank dengan pembayaran di sistem
- **Abaikan mutasi**: tandai mutasi yang tidak relevan
- Status tracking: PENDING → CONFIRMED / IGNORED
- Integrasi otomatis: saat mutasi dikonfirmasi, pembayaran terkait otomatis diupdate

---

## 6.4 Business Rules Arus Kas & Mutasi

### Arus Kas
1. Setiap pembayaran tunai yang berhasil → otomatis buat record REVENUE
2. Setiap refund → otomatis buat record EXPEND
3. Setiap penarikan tabungan → otomatis buat record EXPEND
4. Admin bisa buat record manual untuk pengeluaran operasional
5. `amount_current` = saldo sebelum transaksi (dari record terakhir)
6. `amount_end` = `amount_current` ± `amount_total`
7. Akun kas mengelompokkan transaksi: tagihan, tabungan, PPDB, donasi, lainnya
8. Laporan arus kas bisa difilter per akun kas, per unit, per periode

### Mutasi Bank
1. Data mutasi diambil otomatis dari API payment gateway (Moota, Mutasibank, Flip)
2. Mutasi masuk dengan status PENDING
3. Admin cocokkan mutasi dengan pembayaran:
   - Cari pembayaran dengan `payment_invoice` atau `payment_amount` yang cocok
   - Jika cocok → CONFIRMED, link `payment_id` dan `cashflow_id`
   - Pembayaran terkait otomatis update status → LN
4. Mutasi yang tidak relevan (transfer internal, biaya admin bank) → IGNORED
5. Mutasi tipe CR (kredit/masuk) biasanya dicocokkan dengan pembayaran
6. Mutasi tipe DB (debit/keluar) biasanya diabaikan atau dicatat sebagai pengeluaran
