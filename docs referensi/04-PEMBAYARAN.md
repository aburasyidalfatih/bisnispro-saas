# 4. Pembayaran

## 4.1 Gambaran Umum

Modul pembayaran mendukung transaksi tunai dan online dengan integrasi ke 5 payment gateway. Mendukung pembayaran single, multiple, cicilan, PSB, tabungan, dan donasi.

---

## 4.2 Tabel Utama (`spa_payments`)

| Field | Tipe | Keterangan |
|-------|------|------------|
| payment_id | bigint PK | ID unik |
| unit_id | bigint FK | Unit sekolah |
| class_id | bigint FK | Kelas |
| student_id | bigint FK | Siswa |
| registrar_id | bigint FK | Pendaftar PSB (jika pembayaran PSB) |
| bill_id | bigint FK | Tagihan tunggal |
| bill_ids | text | ID tagihan multiple (JSON/comma-separated) |
| admin_id | bigint FK | Admin yang memproses |
| admin_name | varchar(64) | Nama admin |
| payer_name | varchar(64) | Nama pembayar |
| payer_status | enum(S,WS) | S=Siswa, WS=Wali Siswa |
| payment_code | varchar(32) | Kode pembayaran unik |
| payment_invoice | varchar(16) | Nomor invoice |
| payment_amount | float | Nominal pembayaran |
| payment_remaining | float | Sisa pembayaran |
| payment_fee | float | Biaya admin/gateway |
| payment_status | enum | MP=Menunggu, MK=Dikonfirmasi, LN=Lunas, DB=Dibatalkan, DK=Dikembalikan |
| payment_description | varchar(255) | Deskripsi |
| payment_method | enum(TN,NT) | TN=Tunai, NT=Non-Tunai |
| payment_channel | varchar(32) | Channel pembayaran (BCA VA, Gopay, dll) |
| payment_number | varchar(32) | Nomor VA/rekening tujuan |
| payment_attachment | varchar(64) | Bukti pembayaran |
| payment_note | varchar(128) | Catatan |
| payment_system | varchar(5) | Sistem gateway (MT=Midtrans, TP=Tripay, dll) |
| payment_token | varchar(64) | Token transaksi gateway |
| payment_link | varchar(255) | Link pembayaran |
| payment_link_id | varchar(32) | ID link pembayaran |
| payment_qr_url | varchar(255) | URL QR code pembayaran |
| payment_instruction | text | Instruksi pembayaran (JSON) |
| payment_at | datetime | Waktu pembayaran dibuat |
| payment_paid_at | datetime | Waktu pembayaran diterima |
| payment_confirmed_at | datetime | Waktu dikonfirmasi |
| payment_expired_at | datetime | Waktu expired |
| payment_checked_at | datetime | Waktu terakhir dicek |
| canceled_at | datetime | Waktu dibatalkan |
| canceled_note | varchar(128) | Alasan pembatalan |

---

## 4.3 Pembayaran Tunai (Cash)

- **Views**: `admin/payment-cash/` (payment-process, payment-transaction)
- **Controller**: `Admin/PaymentCash.php`

### Alur Proses
1. Admin pilih siswa dan tagihan
2. Input nominal pembayaran
3. Sistem otomatis update `amount_paid` dan `amount_remaining` di tagihan
4. Jika lunas, `bill_status` berubah menjadi 1
5. Catat ke `spa_payments` dengan `payment_method = 'TN'`
6. Catat ke `spa_cashflows` sebagai REVENUE
7. Generate kwitansi untuk dicetak

---

## 4.4 Pembayaran Online

- **Views**: `admin/payment-online/` (index, detail)
- **Controller**: `Admin/PaymentOnline.php`

### Payment Gateway Terintegrasi

| Gateway | Controller | Fitur |
|---------|-----------|-------|
| **Midtrans** | `API/PaymentHandler/Midtrans.php` | Snap payment, VA, e-wallet, QRIS |
| **Tripay** | `API/PaymentHandler/Tripay.php` | Multi-channel payment aggregator |
| **Flip Business** | `API/PaymentHandler/FlipBusiness.php` | Transfer bank otomatis |
| **Moota** | `API/PaymentHandler/Moota.php` | Cek mutasi bank otomatis |
| **Mutasibank.co.id** | `API/PaymentHandler/Mutasibankcoid.php` | Cek mutasi rekening |

### Alur Pembayaran Online
1. Member/admin pilih tagihan yang akan dibayar
2. Pilih metode pembayaran (VA, e-wallet, transfer, QRIS)
3. Sistem buat transaksi ke payment gateway
4. Dapatkan `payment_token`, `payment_link`, `payment_number`, `payment_qr_url`
5. Member lakukan pembayaran
6. Gateway kirim callback/webhook
7. Sistem update status pembayaran otomatis
8. Kirim notifikasi ke member (email/WhatsApp)

---

## 4.5 Tipe Pembayaran

### 4.5.1 Single Bill Payment
- **Handler**: `Payment/SingleBill.php`
- Bayar satu tagihan sekaligus (lunas)

### 4.5.2 Multiple Bill Payment
- **Handler**: `Payment/MultipleBill.php`
- Bayar beberapa tagihan sekaligus dalam satu transaksi
- Field `bill_ids` menyimpan daftar tagihan

### 4.5.3 Admission Bill Payment
- **Handler**: `Payment/AdmissionBill.php`
- Pembayaran biaya pendaftaran siswa baru
- Terhubung ke `spa_admission_bills` via `registrar_id`

### 4.5.4 Saving Bill Payment
- **Handler**: `Payment/SavingBill.php`
- Pembayaran/setoran tabungan siswa via online

### 4.5.5 Donation Bill Payment
- **Handler**: `Payment/DonationBill.php`
- Pembayaran donasi via online

---

## 4.6 Riwayat Pembayaran

- **Views**: `admin/payment-history/` (index, detail, refund, refund-detail, print-*)
- **Controller**: `Admin/PaymentHistory.php`
- **Tabel Log**: `spa_payments_logs`

### Fitur
- Daftar seluruh transaksi pembayaran
- Filter berdasarkan unit, kelas, status, metode, tanggal
- Detail transaksi lengkap
- Cetak kwitansi dalam berbagai format:
  - **Thermal print** (58mm/80mm): `print-payment-single.blade.php`, `print-payment-multiple.blade.php`, dll
  - **HTML print**: `print-html-payment-single.blade.php`, `print-html-payment-multiple.blade.php`, dll
  - Format khusus untuk: single, multiple, saving, admission, donation

### Refund (Pengembalian Dana)
- **Views**: `refund.blade.php`, `refund-detail.blade.php`
- Proses pengembalian dana pembayaran
- Status berubah menjadi `DK` (Dikembalikan)
- Catat alasan pembatalan (`canceled_note`)

---

## 4.7 Notifikasi Pembayaran

- **Notification Classes**:
  - `Notification/PaymentCash.php` — Notifikasi pembayaran tunai
  - `Notification/PaymentOnline.php` — Notifikasi pembayaran online

### Channel Notifikasi
- **Email** — via SMTP (Symfony Mailer)
- **WhatsApp** — via WA gateway terintegrasi

### Trigger Notifikasi
- Pembayaran tunai berhasil
- Pembayaran online berhasil (callback dari gateway)
- Tagihan baru dibuat (via billing otomatis)

---

## 4.8 Business Rules Pembayaran

### Aturan Umum
1. Setiap pembayaran harus terhubung ke minimal satu tagihan (`bill_id` atau `bill_ids`)
2. `payment_amount` tidak boleh melebihi `amount_remaining` tagihan
3. `payment_code` dan `payment_invoice` harus unik
4. Pembayaran yang sudah LN (Lunas) tidak bisa dibatalkan, hanya bisa di-refund
5. Pembayaran yang sudah DB (Dibatalkan) atau DK (Dikembalikan) bersifat final

### Pembayaran Tunai
1. Hanya bisa dilakukan oleh admin (role AK atau AU)
2. Status langsung LN (tidak melalui MP/MK)
3. `payment_method = 'TN'`
4. `payment_at` dan `payment_paid_at` diisi timestamp saat proses
5. Otomatis buat record di `spa_cashflows` (REVENUE)
6. Otomatis update `amount_paid` dan `amount_remaining` di tagihan
7. Jika `amount_remaining = 0` → `bill_status = 1`

### Pembayaran Online
1. Bisa dilakukan oleh member atau admin
2. `payment_method = 'NT'`
3. Status awal: MP (Menunggu Pembayaran)
4. `payment_expired_at` diset (misal +24 jam dari pembuatan)
5. Sistem kirim request ke payment gateway → dapatkan token/link/VA
6. Simpan `payment_token`, `payment_link`, `payment_number`, `payment_qr_url`, `payment_instruction`
7. Saat callback dari gateway:
   - Jika berhasil: status → LN, set `payment_paid_at`, buat cashflow, update tagihan
   - Jika gagal/expired: status → DB, set `canceled_at`
8. `payment_fee` dicatat terpisah (biaya gateway)
9. `payment_checked_at` diupdate setiap kali sistem cek status ke gateway

### Pembayaran Multiple
1. `bill_ids` berisi daftar `bill_id` yang dibayar (format: comma-separated atau JSON)
2. `payment_amount` = total dari semua tagihan yang dipilih
3. Saat pembayaran berhasil, update SEMUA tagihan yang terkait
4. Jika salah satu tagihan sudah lunas sebelumnya → skip, hanya proses yang belum lunas

### Pembayaran Cicilan
1. Tagihan dengan `payment_type = 'CL'`
2. Setiap cicilan membuat record pembayaran baru
3. Cicilan ke-N mengupdate `payment_amount_xN` dan `payment_code_xN` di tagihan
4. `amount_paid` di tagihan bertambah sesuai nominal cicilan
5. Tagihan baru lunas (`bill_status = 1`) saat `amount_remaining = 0`
6. Maksimal 9 kali cicilan

### Refund
1. Hanya dari status LN
2. Admin input alasan refund (`canceled_note`)
3. Status berubah ke DK
4. `canceled_at` diisi timestamp
5. Buat record cashflow baru (EXPEND) untuk mengurangi saldo
6. Update tagihan: `amount_paid` berkurang, `amount_remaining` bertambah, `bill_status = 0`

### Expired Payment
1. Cron job atau pengecekan berkala
2. Jika `payment_expired_at < now()` dan `payment_status = 'MP'`
3. Otomatis set `payment_status = 'DB'`
4. Set `canceled_at = now()`, `canceled_note = 'Expired'`
