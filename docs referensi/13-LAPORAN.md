# 13. Laporan & Export Data

## 13.1 Gambaran Umum

Modul laporan menyediakan berbagai jenis laporan keuangan dan operasional yang bisa dicetak ke PDF atau diexport ke Excel.

---

## 13.2 Laporan Keuangan

- **Views**: `admin/report/` (index, print-bill, print-bill-amount, print-payment, print-cashflow, print-saving-balance, print-saving-transaction)
- **Controller**: `Admin/Report.php`

### Jenis Laporan

| Laporan | View | Keterangan |
|---------|------|------------|
| Laporan Tagihan | `print-bill.blade.php` | Rekap tagihan per kelas/unit, status lunas/belum |
| Laporan Nominal Tagihan | `print-bill-amount.blade.php` | Detail nominal tagihan per kategori |
| Laporan Pembayaran | `print-payment.blade.php` | Rekap transaksi pembayaran per periode |
| Laporan Arus Kas | `print-cashflow.blade.php` | Laporan pemasukan & pengeluaran |
| Laporan Saldo Tabungan | `print-saving-balance.blade.php` | Rekap saldo tabungan seluruh siswa |
| Laporan Transaksi Tabungan | `print-saving-transaction.blade.php` | Detail transaksi tabungan per periode |

### Fitur Umum Laporan
- Filter berdasarkan unit, kelas, periode, tanggal
- Cetak langsung ke printer (Print.js)
- Style cetak khusus (`report-print-style.blade.php`)
- Rekap total di bagian bawah (`recap-amount.blade.php`)

---

## 13.3 Export ke Excel

Menggunakan library **Maatwebsite Excel 3.x** untuk generate file Excel.

### Export Classes

| Module | Export Class | Data |
|--------|-------------|------|
| **Master** | `Exports/Master/Student.php` | Data siswa |
| | `Exports/Master/AdminAccount.php` | Data akun admin |
| | `Exports/Master/StudentAccount.php` | Data akun siswa |
| | `Exports/Master/Classroom.php` | Data kelas |
| | `Exports/Master/Unit.php` | Data unit |
| | `Exports/Master/Bill.php` | Data tagihan |
| | `Exports/Master/BillCategory.php` | Data kategori tagihan |
| **Rekap** | `Exports/Recap/PaymentTransaction.php` | Rekap transaksi pembayaran |
| | `Exports/Recap/SavingTransaction.php` | Rekap transaksi tabungan |
| | `Exports/Recap/Cashflow.php` | Rekap arus kas |
| **Laporan** | `Exports/Report/Bill.php` | Laporan tagihan |
| | `Exports/Report/Payment.php` | Laporan pembayaran |
| | `Exports/Report/Cashflow.php` | Laporan arus kas |
| | `Exports/Report/StudentSaving.php` | Laporan tabungan siswa |
| **Absensi** | `Exports/Attendance/Student.php` | Data absensi siswa |
| | `Exports/Attendance/Admin.php` | Data absensi admin |
| **Donasi** | `Exports/Donation/Transaction.php` | Transaksi donasi |
| **E-Kantin** | `Exports/Ekantin/Transaction.php` | Transaksi e-kantin |
| **PSB** | `Exports/Admission/Registrar.php` | Data pendaftar PSB |

---

## 13.4 Import dari Excel

Menggunakan library **Maatwebsite Excel 3.x** untuk membaca file Excel.

### Import Classes

| Import Class | Data | Tabel Tujuan |
|-------------|------|-------------|
| `Imports/Master/Student.php` | Data siswa | `spa_students` |
| `Imports/Master/AdminAccount.php` | Akun admin | `spa_accounts` |
| `Imports/Master/Classroom.php` | Data kelas | `spa_classrooms` |
| `Imports/Master/Unit.php` | Data unit | `spa_units` |
| `Imports/Master/Bill.php` | Data tagihan | `spa_bills` |
| `Imports/Master/BillCategory.php` | Kategori tagihan | `spa_categories` |

### Mekanisme Import
1. Admin upload file Excel
2. Sistem parsing data ke tabel sementara (`spa_imports`)
3. Admin preview & validasi data
4. Konfirmasi import ke tabel tujuan
5. Data import memiliki `batch_number` untuk tracking
6. Token import memiliki waktu expired

---

## 13.5 Cetak Kwitansi Pembayaran

### Format Thermal (Struk Kasir)
- `print-payment-single.blade.php` — Kwitansi tagihan tunggal
- `print-payment-multiple.blade.php` — Kwitansi tagihan multiple
- `print-payment-saving.blade.php` — Kwitansi tabungan
- `print-payment-admission.blade.php` — Kwitansi PSB
- `print-payment-donation.blade.php` — Kwitansi donasi
- `print-payment-singles.blade.php` — Kwitansi batch

### Format HTML (A4/Letter)
- `print-html-payment-single.blade.php`
- `print-html-payment-multiple.blade.php`
- `print-html-payment-saving.blade.php`
- `print-html-payment-admission.blade.php`
- `print-html-payment-donation.blade.php`
- `print-html-payment-singles.blade.php`

### Style Cetak
- `payment.css` — Style untuk cetak thermal (font 9.5px, layout compact)
- `payment-print-style.blade.php` — Style inline untuk kwitansi
- `print-qr.css` — Style untuk cetak QR code

---

## 13.6 Export PDF

Menggunakan **barryvdh/laravel-dompdf** untuk generate PDF dari view Blade.
- Laporan keuangan
- Formulir pendaftaran PSB
- Kwitansi pembayaran format A4
