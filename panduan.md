# 🏫 CETAK BIRU & PANDUAN UTAMA PENGEMBANGAN SCHOOLPRO SaaS

Selamat datang di Panduan Utama Pengembang **SchoolPro**. Dokumen ini dirancang sebagai panduan tunggal yang merangkum seluruh arsitektur, struktur data, alur transaksi, ekosistem fitur, serta standar coding di platform SchoolPro.

---

## 🗺️ DAFTAR ISI
1. [Arsitektur Utama & Multi-Tenancy](#-1-arsitektur-utama--multi-tenancy)
2. [Peta Struktur Folder & Direktori](#-2-peta-struktur-folder--direktori)
3. [Desain Database & Hubungan Relasional (Prisma)](#-3-desain-database--hubungan-relasional-prisma)
4. [Siklus Transaksi & Ekosistem Fitur Tingkat Lanjut](#-4-siklus-transaksi--ekosistem-fitur-tingkat-lanjut)
5. [Standard Operating Procedures (SOP) Developer](#-5-standard-operating-procedures-sop-developer)

---

## 🚀 1. ARSITEKTUR UTAMA & MULTI-TENANCY

SchoolPro dibangun dengan konsep **Single-Database Multi-Tenancy** menggunakan Next.js App Router. Setiap sekolah memiliki identitas terisolasi yang disebut **Tenant**.

### Alur Request Domain & Subdomain
Setiap lalu lintas (traffic) internet yang masuk ke platform disaring dan diarahkan melalui [middleware.ts](file:///c:/grafity%20project/schoolpro/src/middleware.ts):

1. **Main Domain (`schoolpro.id`)**: Merender landing page utama platform, pendaftaran sekolah baru, portal afiliasi, dan dashboard Super Admin.
2. **Subdomain (`sekolah.schoolpro.id`)**: Middleware menangkap kata `sekolah` sebagai `slug` tenant dan secara transparan melakukan rewrite internal ke `/site/sekolah/[path]`.
3. **Custom Domain (`sekolahanda.sch.id`)**: Middleware mencocokkan host domain di database (didukung cache Redis Upstash) untuk menemukan `slug` terkait, lalu melakukan rewrite ke `/site/[slug]/[path]`.

---

## 📂 2. PETA STRUKTUR FOLDER & DIREKTORI

Berikut adalah struktur direktori utama Next.js di dalam `src/`:

- **`src/app/`**: Lapisan routing aplikasi Next.js (App Router).
  - **`(super-admin)/super-admin/`**: Panel platform manager (approve sekolah, kelola paket langganan).
  - **`(tenant-admin)/admin/`**: Panel kontrol operasional sekolah (GTK, Siswa, Fasilitas, PPDB).
  - **`(tenant-gtk)/panel-gtk/`**: Dashboard khusus Guru & Staf (input nilai, presensi, jurnal harian).
  - **`(tenant-ortu)/ortu/`**: Dashboard Wali Murid untuk memantau nilai, tagihan SPP, presensi anak.
  - **`(tenant-siswa)/siswa/`**: Portal Siswa (materi belajar, jadwal, ujian online).
  - **`site/[slug]/`**: Halaman publik dinamis sekolah (fitur profil, prestasi, agenda, fasilitas).
- **`src/lib/`**: Logika bisnis dan konfigurasi inti.
  - **`db.ts`**: Instance database Prisma Client.
  - **`services/`**: Kumpulan modul fungsional terpusat:
    - **`notification.ts`**: Driver pengiriman email (SMTP) & WhatsApp (StarSender/Meta API).
    - **`billing-notifications.ts`**: Otomatisasi pesan tagihan, pengingat, komisi afiliasi.
    - **`payment.ts`**: Logika checkout dan webhook Tripay Gateway.
    - **`tenant-public.ts`**: Pengambilan data web sekolah ter-cache.

---

## 🗄️ 3. DESAIN DATABASE & HUBUNGAN RELASIONAL (PRISMA)

Skema database diatur secara relasional di [prisma/schema.prisma](file:///c:/grafity%20project/schoolpro/prisma/schema.prisma).

### Kunci Isolasi Multi-Tenant
Tabel inti **`Tenant`** adalah pusat dari semua data operasional. Semua tabel sekunder wajib memiliki kolom relasi `tenantId` untuk memisahkan data antarsekolah secara aman:

- **`Tenant` ── `Facility`**: Menyimpan daftar prasarana fisik sekolah tanpa batas (kueri langsung tanpa limit pada halaman `/fasilitas`).
- **`User` ── `TenantUser`**: Kredensial login bersifat global, namun hak akses diisolasi menggunakan tabel perantara `TenantUser` yang mendefinisikan role pengguna di sekolah tersebut (`owner`, `admin`, `guru`, `siswa`, `orangtua`).

---

## 🔄 4. SIKLUS TRANSAKSI & EKOSISTEM FITUR TINGKAT LANJUT

### A. Alur Transaksi & Notifikasi Otomatis
Setiap pembayaran langganan sekolah (misal: upgrade ke Plan PRO) diproses secara real-time:
1. Admin sekolah mengajukan upgrade ➡️ API membuat invoice di Tripay Gateway.
2. WhatsApp otomatis dikirim: **"Invoice Dibuat"** menggunakan template super admin yang dinamis.
3. Saat pembayaran sukses ➡️ Tripay Webhook memicu aktivasi paket di DB dan mengirim WhatsApp: **"Pembayaran Berhasil"** serta notifikasi komisi ke Mitra Afiliasi terkait.

### B. SchoolPay & Dompet Digital Kantin
Siswa memiliki kartu QR yang terhubung dengan **`WalletAccount`**. Orang tua dapat melakukan top-up saldo tabungan siswa. Transaksi belanja di kantin sekolah menggunakan metode potong saldo digital instan yang tercatat secara forensik di `WalletTransaction`.

### C. Presensi Cerdas Geofencing
Guru & Staf melakukan presensi kehadiran melalui aplikasi dengan validasi koordinat GPS (jarak maksimal radius geofencing dari sekolah) yang dikombinasikan dengan foto selfie verifikasi wajah.

---

## 🛡️ 5. STANDARD OPERATING PROCEDURES (SOP) DEVELOPER

Setiap kali Anda menulis kode di proyek ini, patuhi 4 aturan wajib berikut:

### Aturan 1: Desain & Estetika Premium
- Gunakan gradasi warna harmonis (misal: `from-indigo-600 to-violet-600`), efek blur transparan (`backdrop-blur-md bg-white/80`), dan efek transisi hover yang memukau.

### Aturan 2: Keamanan Query Database (Isolasi Data)
- **Jangan pernah melupakan `tenantId`** saat melakukan pencarian atau manipulasi data di database:
  ```typescript
  // 🟢 BENAR & AMAN
  const data = await db.student.findMany({
    where: { tenantId: activeTenantId }
  })
  ```

### Aturan 3: Validasi Zod & Sanitasi String
- Validasi semua data request dari browser menggunakan Zod schema.
- Selalu transformasikan string kosong `""` menjadi `null` sebelum disimpan ke kolom opsional database untuk menghindari pelanggaran constraint unik.

### Aturan 4: Manajemen Caching
- Gunakan `react cache()` untuk query data dinamis pada halaman publik.
- Selalu panggil fungsi invalidasi cache (misal: `invalidatePublicTenantCache(slug)`) ketika admin melakukan update data profil sekolah agar perubahan langsung tayang.

---

*SchoolPro — Platform Edukasi Multi-Tenant Terintegrasi Kelas Dunia.*
