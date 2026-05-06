# 17. Business Rules & Aturan Bisnis

## 17.1 Gambaran Umum

Dokumen ini mendefinisikan aturan bisnis inti yang harus diimplementasikan di setiap modul. Aturan ini direkonstruksi dari struktur database, relasi tabel, dan pola data yang teridentifikasi.

---

## 17.2 Kode & Nomor Unik

### Pola Generate Kode

| Entitas | Format Kode | Contoh | Field |
|---------|------------|--------|-------|
| Tagihan | Auto-generated, 32 char max | `BILL-2026-001-0001` | `bill_code` |
| Pembayaran | Auto-generated, 32 char max | `PAY-20260215-0001` | `payment_code` |
| Invoice | 16 char max | `INV20260001` | `payment_invoice` |
| Pendaftar PSB | Auto-generated, 32 char max | `REG-2026-0001` | `registrar_code` |
| Donasi | Auto-generated, 32 char max | `DON-20260215-0001` | `donation_code` |
| Mutasi | Auto-generated, 64 char max | `MUT-20260215-0001` | `mutation_code` |
| Penarikan E-Kantin | Auto-generated, 24 char max | `WD-20260215-0001` | `withdrawal_code` |
| Backup | Auto-generated, 16 char max | `BK20260215001` | `backup_code` |
| Referensi Tabungan | Auto-generated, 32 char max | `SAV-20260215-0001` | `reference` |
| Nomor Rekening Tabungan | 12 digit | `100000000001` | `account_number` |
| Batch Import | 16 char | `IMP20260215001` | `batch_number` |

### Aturan
- Semua kode harus unik per tabel
- Kode mengandung tanggal untuk traceability
- Nomor urut auto-increment per hari/periode

---

## 17.3 Status Flow

### 17.3.1 Status Pembayaran (`spa_payments.payment_status`)

```
┌──────┐    Bayar     ┌──────┐   Konfirmasi   ┌──────┐
│  MP  │ ──────────── │  MK  │ ─────────────── │  LN  │
│Pending│             │Confirmed│               │ Paid │
└──┬───┘              └──┬───┘                 └──────┘
   │                     │
   │  Batal              │  Batal
   ▼                     ▼
┌──────┐              ┌──────┐
│  DB  │              │  DB  │
│Cancel│              │Cancel│
└──────┘              └──────┘

Dari LN (Lunas):
┌──────┐   Refund    ┌──────┐
│  LN  │ ──────────  │  DK  │
│ Paid │             │Refund│
└──────┘             └──────┘
```

| Status | Kode | Keterangan | Transisi Berikutnya |
|--------|------|------------|-------------------|
| Menunggu Pembayaran | MP | Transaksi dibuat, belum dibayar | → MK, LN, DB |
| Dikonfirmasi | MK | Pembayaran diterima, menunggu verifikasi | → LN, DB |
| Lunas | LN | Pembayaran selesai dan terverifikasi | → DK |
| Dibatalkan | DB | Transaksi dibatalkan | (final) |
| Dikembalikan | DK | Dana dikembalikan (refund) | (final) |

**Aturan:**
- Pembayaran tunai (TN): langsung MP → LN
- Pembayaran online (NT): MP → callback gateway → LN atau DB
- Refund hanya dari status LN
- Pembatalan harus mencatat `canceled_at` dan `canceled_note`
- Pembayaran expired: jika `payment_expired_at` < now dan status masih MP → otomatis DB

### 17.3.2 Status Tagihan (`spa_bills.bill_status`)

| Status | Nilai | Keterangan |
|--------|-------|------------|
| Belum Lunas | 0 | Masih ada sisa tagihan |
| Lunas | 1 | Seluruh tagihan terbayar |

**Aturan:**
- `bill_status` = 1 ketika `amount_remaining` = 0
- `amount_remaining` = `amount_total` - `amount_discount` - `amount_paid`
- Setiap pembayaran mengurangi `amount_remaining` dan menambah `amount_paid`
- Jika cicilan, setiap cicilan ke-N mengupdate `payment_amount_xN`

### 17.3.3 Status Mutasi Bank (`spa_mutations.mutation_status`)

```
┌─────────┐   Konfirmasi   ┌───────────┐
│ PENDING │ ──────────────  │ CONFIRMED │
└────┬────┘                 └───────────┘
     │
     │  Abaikan
     ▼
┌─────────┐
│ IGNORED │
└─────────┘
```

**Aturan:**
- Mutasi masuk dari payment gateway dengan status PENDING
- Admin cocokkan dengan pembayaran → CONFIRMED
- Mutasi tidak relevan → IGNORED
- Saat CONFIRMED: update pembayaran terkait menjadi LN, catat ke cashflow

### 17.3.4 Status Penarikan E-Kantin (`spa_ekantin_withdrawals.withdrawal_status`)

| Status | Kode | Keterangan |
|--------|------|------------|
| Diproses | DP | Permintaan penarikan diajukan |
| Sukses | SC | Dana sudah ditransfer/diserahkan |
| Dibatalkan | DB | Penarikan dibatalkan |

### 17.3.5 Status Donasi (`spa_donation_logs.donation_status`)

| Status | Kode | Keterangan |
|--------|------|------------|
| Menunggu | MP | Donasi dibuat, belum dibayar |
| Lunas | LN | Donasi diterima |
| Dibatalkan | DB | Donasi dibatalkan |

### 17.3.6 Status Siswa (`spa_students.student_status`)

| Status | Kode | Keterangan |
|--------|------|------------|
| Aktif | A | Siswa aktif |
| Lulus | L | Siswa sudah lulus |
| Keluar | K | Siswa keluar/pindah |

### 17.3.7 Status Pendaftar PSB (`spa_admission_registrars`)

Tracking via multiple flags:
- `registration_step`: step pendaftaran (1, 2, 3, ...)
- `is_verified`: sudah diverifikasi admin
- `is_synced`: sudah disinkronkan ke data siswa aktif
- `is_deleted`: soft deleted

---

## 17.4 Kalkulasi Keuangan

### 17.4.1 Tagihan

```
amount_total = Σ (bill_amount_N - bill_discount_N) untuk N = 1..6
amount_discount = Σ bill_discount_N untuk N = 1..6
amount_remaining = amount_total - amount_paid
```

**Diskon:**
- Tipe F (Fixed): `bill_discount_N = discount_amount`
- Tipe P (Persentase): `bill_discount_N = bill_amount_N × (discount_amount / 100)`

### 17.4.2 Cicilan

```
Jika payment_type = 'CL' (Cicilan):
  Total cicilan = payment_amount_x1 + x2 + ... + x9
  Setiap pembayaran cicilan ke-N:
    - Update payment_amount_xN dengan nominal yang dibayar
    - Update payment_code_xN dengan kode pembayaran
    - amount_paid += nominal cicilan
    - amount_remaining -= nominal cicilan
    - Jika amount_remaining = 0 → bill_status = 1

Jika payment_type = 'BL' (Bayar Lunas):
  - Bayar seluruh amount_remaining sekaligus
  - bill_status = 1
```

### 17.4.3 Tabungan

```
Setor (CR):
  amount_end = amount_current + amount_total
  
Tarik (DB):
  Validasi: amount_current >= amount_total
  amount_end = amount_current - amount_total
```

### 17.4.4 Arus Kas

```
Pemasukan (REVENUE):
  amount_end = amount_current + amount_total

Pengeluaran (EXPEND):
  amount_end = amount_current - amount_total
```

### 17.4.5 E-Kantin Transaksi

```
Pembelian (SL - Sale):
  Sisi siswa (DB): amount_end = amount_current - amount_total
  Sisi merchant (CR): saldo merchant bertambah

Penarikan (WD - Withdrawal):
  Saldo merchant berkurang sebesar withdrawal_amount
```

---

## 17.5 Validasi Data

### 17.5.1 Akun

| Field | Validasi |
|-------|----------|
| username | Unik per tabel, required |
| email | Format email valid, unik |
| password | Min 6 karakter, bcrypt hash |
| phone | Numerik, max 16 digit |
| photo | Format: jpg, jpeg, png. Max size: 2MB |

### 17.5.2 Siswa

| Field | Validasi |
|-------|----------|
| student_name | Required, max 64 char |
| student_number | Unik, max 32 char |
| student_gender | Required, enum: L/P |
| student_nik | 16 digit |
| student_nkk | 16 digit |
| student_dob | Format date, tidak boleh di masa depan |
| class_id | Required, harus kelas aktif |

### 17.5.3 Tagihan

| Field | Validasi |
|-------|----------|
| bill_code | Unik, auto-generated |
| bill_category_1 | Required (minimal 1 komponen) |
| bill_name_1 | Required |
| bill_amount_1 | Required, numerik, >= 0 |
| amount_total | Harus > 0 |
| student_id | Required, siswa harus aktif |

### 17.5.4 Pembayaran

| Field | Validasi |
|-------|----------|
| payment_amount | Required, > 0, <= amount_remaining tagihan |
| payment_method | Required, enum: TN/NT |
| payment_code | Unik, auto-generated |
| student_id atau registrar_id | Salah satu harus ada |

### 17.5.5 E-Kantin

| Field | Validasi |
|-------|----------|
| PIN | 6 digit, max 3 percobaan |
| amount_total | > 0, <= saldo tabungan siswa |
| Sesi transaksi | Token valid, belum expired, belum digunakan |

---

## 17.6 Aturan Bisnis Per Modul

### 17.6.1 Pembayaran Tunai
1. Hanya admin dengan role AK (Admin Keuangan) atau AU (Super Admin) yang bisa memproses
2. Pembayaran langsung tercatat sebagai LUNAS
3. Otomatis catat ke arus kas sebagai REVENUE
4. Kirim notifikasi ke wali murid (jika diaktifkan)
5. Generate kwitansi

### 17.6.2 Pembayaran Online
1. Member pilih tagihan → pilih channel pembayaran
2. Sistem buat transaksi ke payment gateway
3. Dapatkan payment link/VA number/QR code
4. Member bayar via channel yang dipilih
5. Gateway kirim callback → update status
6. Jika berhasil: status → LN, catat cashflow, kirim notifikasi
7. Jika expired: status → DB
8. Fee gateway dicatat di `payment_fee`

### 17.6.3 Billing Otomatis
1. Cron job trigger sesuai jadwal (harian/mingguan/bulanan)
2. Generate tagihan untuk siswa yang belum punya tagihan periode tersebut
3. Ambil nominal dari kategori tagihan
4. Terapkan diskon jika ada di `spa_bills_discounts`
5. Kirim notifikasi ke wali murid
6. Catat log eksekusi

### 17.6.4 PSB - Sinkronisasi ke Siswa
1. Pendaftar harus `is_verified = 1`
2. Admin pilih kelas tujuan
3. Sistem copy data dari `spa_admission_students` → `spa_students`
4. Copy data orang tua dari `spa_admission_parents` → `spa_students_parents`
5. Buat akun login di `spa_accounts` (is_student = 1)
6. Update `is_synced = 1`, `synced_by`, `synced_at` di registrar
7. Set `master_student_id`, `master_class_id`, `master_year_id` di admission_students

### 17.6.5 E-Kantin - Alur Transaksi
1. Merchant login → buka halaman scan QR
2. Siswa tunjukkan QR tabungan
3. Merchant scan → input nominal
4. Sistem buat sesi transaksi (token + expired)
5. Siswa input PIN tabungan
6. Validasi: PIN benar, saldo cukup, sesi valid
7. Potong saldo siswa, tambah saldo merchant
8. Catat transaksi di `spa_ekantin_transactions`
9. Update saldo di `spa_savings` (debit)
10. Jika PIN salah 3x → sesi expired, harus buat ulang

### 17.6.6 Tabungan - Setoran Online
1. Member pilih menu tabungan → setor
2. Input nominal setoran
3. Buat pembayaran online (tipe SavingBill)
4. Setelah pembayaran berhasil (callback):
   - Catat transaksi tabungan (CR)
   - Update saldo
   - Catat ke arus kas

### 17.6.7 Donasi Publik
1. Pengunjung buka portal donasi
2. Pilih kampanye → input nama, telepon, nominal
3. Buat pembayaran online (tipe DonationBill)
4. Setelah pembayaran berhasil:
   - Catat di `spa_donation_logs` (status LN)
   - Catat ke arus kas
   - Update progress kampanye

### 17.6.8 Promosi/Kenaikan Kelas
1. Admin pilih kelas asal dan kelas tujuan
2. Pilih siswa yang akan dipromosikan
3. Sistem update `class_id` siswa ke kelas baru
4. Catat riwayat di `spa_students_histories`
5. Update `year_id` jika tahun ajaran berubah

---

## 17.7 Soft Delete Pattern

Tabel yang mendukung soft delete:

| Tabel | Flag | Timestamp |
|-------|------|-----------|
| spa_units | is_deleted | deleted_at |
| spa_classyears | is_deleted | deleted_at |
| spa_classrooms | is_deleted | deleted_at |
| spa_students | is_deleted | deleted_at |
| spa_admission_periods | is_deleted | deleted_at |
| spa_admission_registrars | is_deleted | deleted_at |
| spa_donation_agencies | is_deleted | deleted_at |
| spa_donation_campaigns | is_deleted | deleted_at |
| spa_ekantin_merchants | is_deleted | deleted_at |
| spa_contents | is_deleted | deleted_at |

**Aturan:**
- Data yang di-soft-delete tidak muncul di list default
- Ada halaman "Deleted" untuk melihat data terhapus
- Data bisa di-restore
- Data yang memiliki relasi child tidak bisa di-hard-delete (FK constraint)

---

## 17.8 Multi-Tenant by Unit

Hampir semua tabel operasional memiliki `unit_id`:
- Data difilter berdasarkan unit yang dipilih
- Admin bisa mengakses data lintas unit (tergantung role)
- Satu instalasi = satu sekolah/yayasan dengan multiple unit (SD, SMP, SMA)
- Laporan bisa per unit atau gabungan

---

## 17.9 Audit Trail

Setiap aksi pengguna dicatat di `spa_logs`:
- HTTP method (GET, POST, PUT, DELETE)
- URL yang diakses
- IP address
- Username & nama lengkap
- Modul yang diakses
- Deskripsi aksi
- Parameter request

**Aksi yang dicatat:**
- Login/logout
- CRUD data master
- Proses pembayaran
- Verifikasi PSB
- Perubahan pengaturan
- Export/import data
