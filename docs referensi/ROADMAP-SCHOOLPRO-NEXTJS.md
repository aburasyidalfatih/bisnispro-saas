# Roadmap Pengembangan SchoolPro SaaS (V2 Next.js)

Dokumen ini adalah cetak biru (blueprint) strategis untuk mengubah arsitektur aplikasi lama (berbasis Laravel) menjadi ekosistem SaaS B2B modern menggunakan **Next.js, Prisma, dan arsitektur Multi-Tenant**. Roadmap ini disusun agar pengembangan di masa depan tetap fokus, sistematis, dan selaras dengan visi bisnis SchoolPro.

---

## 🏗️ 1. Visi Utama (Grand Vision)

Mengubah sistem administrasi sekolah biasa menjadi **Ekosistem Finansial & Akademik Melingkar (Closed-Loop Economy)**. 
- **B2B SaaS Sejati:** Setiap sekolah memiliki subdomain mandiri, tema sendiri, dan database terisolasi secara logika.
- **Dompet Digital (Wallet):** Uang orang tua tidak hanya dibayarkan untuk SPP, tetapi mengendap di dalam ekosistem sekolah (Tabungan) untuk diputar di kantin, donasi, dan autodebet tagihan.
- **Otomatisasi Komunikasi:** Integrasi WhatsApp Gateway hybrid (Internal/StarSender) yang menjadi "asisten virtual" proaktif bagi orang tua.

---

## 🚀 2. Epic & Tahapan Eksekusi (Roadmap)

### EPIC 0: Otomatisasi PPDB & Manajemen Kelas
*Jembatan transisi dari "Calon Siswa" menjadi "Siswa Aktif".*
- **Fitur Target:**
  - Pembuatan tabel `Classroom` (Manajemen Kelas & Rombel).
  - Alur **Sinkronisasi 1-Klik**: Saat pendaftar berstatus "Diterima" dan sudah melunasi Daftar Ulang, Admin dapat menyinkronkan data pendaftar.
  - Pembuatan Akun Siswa mandiri secara otomatis.
  - Relasi `StudentParent` (Many-to-Many): Menautkan akun Orang Tua yang mendaftar secara otomatis ke data Siswa yang baru dibuat, memungkinkan 1 akun Orang Tua memantau >1 anak.
  - Pengiriman WA notifikasi credentials via integrasi WhatsApp Gateway.


### EPIC 1: SchoolPay Wallet (Tabungan Siswa & E-Wallet)
*Transformasi modul tabungan tradisional menjadi dompet digital modern.*
- **Referensi:** `05-TABUNGAN.md`, `06-ARUS-KAS.md`
- **Fitur Target:**
  - Pembuatan entitas `WalletAccount` otomatis saat pendaftaran siswa diverifikasi.
  - Fitur Top-Up mandiri oleh orang tua via Tripay (Payment Gateway).
  - Mutasi Saldo (Deposit & Withdrawal) dengan pencatatan Arus Kas (Revenue/Expenditure) otomatis.
  - History transaksi (Rekening Koran) yang transparan di Parent Portal.
- **Kesiapan Backend:** Perlu membuat schema Prisma untuk `Wallet`, `WalletTransaction`, dan `Cashflow`.

### EPIC 2: Tagihan & Auto-Debet SPP (Modul Keuangan)
*Mengotomatiskan penagihan agar arus kas sekolah sehat dan anti-tunggakan.*
- **Referensi:** `03-TAGIHAN.md`, `04-PEMBAYARAN.md`
- **Fitur Target:**
  - **Sistem Cicilan:** Mengadopsi fitur `amount_remaining` dari dokumen referensi agar tagihan besar (Uang Pangkal) bisa dicicil bebas.
  - **Auto-Billing (Cron Job):** Sistem membuat tagihan SPP secara otomatis di tanggal 1 setiap bulannya.
  - **Auto-Debet (Fitur Killer):** Jika orang tua mengaktifkan toggle ini, SPP otomatis memotong saldo *SchoolPay Wallet* siswa tanpa perlu transfer manual lagi.
  - **Notifikasi WA:** Alert tagihan baru, H-3 jatuh tempo, dan resi lunas otomatis.

### EPIC 3: E-Kantin (Ekonomi Ekosistem)
*Uang fisik dihilangkan dari sekolah, diganti dengan sistem cashless.*
- **Referensi:** `08-EKANTIN.md`
- **Fitur Target:**
  - Pembuatan Role `Merchant` (Pedagang Kantin) dengan dasbor khusus.
  - Fitur *Scan QR Code* siswa untuk memotong saldo Tabungan.
  - Validasi keamanan dengan PIN 6 digit di HP siswa/merchant.
  - Pencairan dana (Withdrawal) merchant ke pihak sekolah secara periodik.

### EPIC 4: Absensi & Disiplin Pintar
*Memberikan peace-of-mind (ketenangan) kepada orang tua secara real-time.*
- **Referensi:** `10-ABSENSI.md`
- **Fitur Target:**
  - Absensi Harian untuk siswa.
  - Absensi Guru/Staf dengan sistem Check-In/Check-Out (opsi koordinat GPS / Foto Selfie).
  - **WhatsApp Alert Seketika:** Jika anak di-absen "Alpha", detik itu juga WA gateway menembak pesan ke HP orang tua.
  - Pengajuan "Surat Izin/Sakit" digital dari Parent Portal lengkap dengan lampiran foto surat dokter.

### EPIC 5: Crowdfunding & Donasi
*Memaksimalkan penggalangan dana sekolah secara transparan.*
- **Referensi:** `09-DONASI.md`
- **Fitur Target:**
  - **Portal Publik:** Halaman donasi terbuka yang bisa diakses tanpa login (mirip KitaBisa) dan terintegrasi dengan Tripay.
  - **Portal Internal:** Tampil di Dasbor Orang Tua. Orang tua bisa menyumbang hanya dengan 1-klik menggunakan pemotongan saldo *SchoolPay Wallet*.
  - Progress bar *real-time* (Target dana vs Dana terkumpul).

### EPIC 6: The Ultimate Parent Portal (Aplikasi Orang Tua)
*Menyatukan seluruh modul ke dalam satu antarmuka mobile-friendly layaknya aplikasi native.*
- **Referensi:** `11-PORTAL-MEMBER.md`
- **Fitur Target:**
  - UI berbasis komponen *MobileAppLayout* yang sudah dibuat di Next.js.
  - *Home Dashboard* terpusat: Menampilkan Saldo Wallet, Tagihan Urgent, Status Kehadiran Hari Ini, dan Kampanye Donasi.

---

## 🛠️ 3. Pedoman Pengembangan (Development Guidelines)

Setiap kali sesi baru dimulai, AI atau tim pengembang WAJIB memperhatikan aturan ini:
1. **Arsitektur Multi-Tenant:** Semua tabel operasional di Prisma **HARUS** memiliki relasi `tenantId`. Tidak ada data yang boleh bocor antar sekolah.
2. **Akses Kontrol (Kendali Fitur):** Selalu gunakan `useFreePlanAccess` (atau pengecekan Backend di `PlatformSetting`) saat meluncurkan modul baru. Jika itu fitur premium (seperti Auto-Debet atau WA Gateway), batasi hanya untuk pengguna paket PRO.
3. **Soft Delete:** Adopsi konsep `is_deleted` (atau `deletedAt`) dari aplikasi lama untuk data krusial seperti Siswa, Tagihan, dan Transaksi agar menghindari kehilangan data permanen akibat *human error*.
4. **Audit Trail:** Transaksi krusial (seperti perubahan nominal tagihan atau refund saldo) harus tercatat di sistem log.

---

*Dokumen ini akan menjadi panduan (context) bagi AI dalam melanjutkan sesi pengembangan di masa mendatang.*
