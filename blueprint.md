# Blueprint Aplikasi SchoolPro SaaS

Dokumen blueprint ini menyajikan analisis komprehensif mengenai arsitektur, teknologi, struktur database, serta fitur yang saat ini ada dalam sistem SchoolPro SaaS. Dokumen ini ditujukan untuk kebutuhan analisa pengembangan, perbaikan proses, dan penentuan strategi bisnis di masa mendatang.

## 1. Ringkasan Eksekutif (Executive Summary)

**SchoolPro** adalah sebuah platform SaaS (Software as a Service) *multi-tenant* yang dirancang khusus untuk digitalisasi manajemen dan administrasi sekolah. Platform ini mencakup banyak aspek, mulai dari pembuatan *website profile* sekolah, penerimaan siswa baru (PPDB), manajemen akademik, presensi, keuangan, hingga ujian berbasis komputer (CBT).

Aplikasi ini menggunakan pendekatan arsitektur modern (Next.js App Router) dan database relasional (PostgreSQL) yang dikelola melalui ORM Prisma, sehingga menawarkan skalabilitas, keamanan, dan *developer experience* yang tinggi.

---

## 2. Arsitektur Sistem (System Architecture)

Sistem dibangun di atas ekosistem JavaScript/TypeScript modern dengan tipe monolitik *server-rendered* dan *API-driven*.

*   **Frontend & Backend (Meta-framework):** Next.js 15 (App Router). Menggunakan *Server Components* dan *Server Actions* untuk performa tinggi, serta *Client Components* untuk interaktivitas UI.
*   **Database:** PostgreSQL sebagai *primary relational database*.
*   **ORM (Object-Relational Mapping):** Prisma ORM.
*   **Authentication & Authorization:** NextAuth.js (Auth.js) / Kustom otentikasi berbasis *session* dan *token*. Mendukung multi-role (Super Admin, Admin Tenant, Guru/Staf, Orang Tua, Siswa).
*   **Styling & UI Components:** 
    *   Tailwind CSS (Utility-first framework)
    *   Radix UI (Headless UI components)
    *   Framer Motion (Animasi UI)
    *   Lucide React (Ikon)
*   **Job Queue & Background Processing:** BullMQ & Redis (Diindikasikan oleh package Upstash/Redis, ioredis, dan bullmq di `package.json`) atau Inngest. Digunakan untuk cron jobs, *email drip campaigns*, dan notifikasi WhatsApp.
*   **Storage:** Amazon S3 API kompatibel (via `@aws-sdk/client-s3`) untuk manajemen file/dokumen/gambar.
*   **AI Integration:** `@ai-sdk/openai` untuk implementasi asisten AI di dalam aplikasi.

---

## 3. Struktur Modul & Routing (Module & Routing Structure)

Aplikasi memiliki pemisahan modul/route yang sangat jelas (berdasarkan direktori `src/app`):

1.  **`(landing)` & `(public)`**: 
    *   Halaman utama untuk pemasaran (marketing/landing page) platform SaaS.
    *   Halaman pendaftaran bagi sekolah (*tenant*) baru.
2.  **`(super-admin)`**:
    *   Dashboard khusus untuk *owner* aplikasi (Super Admin).
    *   Manajemen pendaftaran *tenant*, paket langganan (Plans), diskon, tagihan (*billing*), dan pengaturan platform.
3.  **`(dashboard)`**:
    *   Portal manajemen internal yang diakses berdasarkan peran (Role-based access). 
    *   Meliputi panel khusus untuk Admin Sekolah, Guru/GTK (`panel-gtk`), Siswa, dan Orang Tua (`ortu`).
4.  **`site/[slug]`**:
    *   *Public-facing website* untuk setiap sekolah (*tenant*).
    *   URL bersifat dinamis berdasarkan *slug* domain/subdomain tenant.
    *   Menampilkan profil sekolah, berita, agenda, pengumuman, dan portal PPDB.
5.  **`(cbt-exam)`**:
    *   Modul khusus Ujian Berbasis Komputer. Halaman ini dirancang agar ringan dan fokus untuk pengalaman ujian siswa tanpa gangguan.
6.  **`(affiliate)`**:
    *   Portal khusus bagi mitra afiliasi untuk memantau pendaftaran sekolah, komisi, dan metrik konversi.
7.  **`api`**:
    *   Endpoint API RESTful, *webhooks* pembayaran, cron jobs, dan interaksi *third-party* (seperti WhatsApp gateway, payment gateway).

---

## 4. Struktur Database (Entity-Relationship Domain)

Berdasarkan skema Prisma, data dimodelkan ke dalam beberapa domain utama:

### 4.1. Core Multi-tenancy & Identity
*   **Tenant:** Merepresentasikan institusi/sekolah. Menyimpan pengaturan tema, kuota siswa, konfigurasi fitur, *domain/slug*, dan layanan (*services*).
*   **User:** Menyimpan kredensial pengguna, profil (Siswa, Orang Tua, Staf, Super Admin). Mendukung 2FA (Two-Factor Authentication).
*   **TenantUser / Role:** Menghubungkan User ke Tenant spesifik beserta perannya.

### 4.2. SaaS & Billing (Monetisasi Platform)
*   **SubscriptionPlan & Subscription:** Paket langganan (contoh: Free, Basic, Pro) dan status langganan sekolah.
*   **Payment & Invoice:** Pencatatan transaksi pembayaran *tenant* ke pihak pengembang (Platform SaaS).
*   **DiscountCode:** Sistem kode promo/diskon berlangganan.
*   **AffiliateProfile & AffiliateCommission:** Sistem afiliasi untuk *marketing referral*.

### 4.3. Content Management System (CMS) Sekolah
Diakses publik di rute `site/[slug]`.
*   **Post & Category:** Artikel, berita sekolah, blog guru.
*   **Event, Achievement, Facility, Extracurricular, Program:** Manajemen halaman profil pendukung sekolah.
*   **Slider & Popup:** Komponen dinamis untuk UI website tenant.
*   **Document:** Bank materi, dokumen publikasi, atau SOP.
*   **Alumni & Staff:** Direktori tenaga pendidik, profil alumni, beserta testimoni.

### 4.4. Penerimaan Peserta Didik Baru (PPDB)
*   **PeriodePpdb & PersyaratanBerkas:** Pengaturan gelombang dan syarat dokumen.
*   **PendaftarPpdb & BerkasPpdb:** Data siswa baru, form dinamis, dan unggahan berkas verifikasi.
*   **TagihanPpdb:** Integrasi keuangan pendaftaran.

### 4.5. Akademik, Keuangan & Operasional (ERP Sekolah)
*   **Keuangan & Kantin:** `WalletAccount`, `CanteenMerchant`, `CanteenProduct`, `CanteenOrder`. Fitur *cashless* terpadu.
*   **Presensi / Attendance:** `AttendanceSession`, `AttendanceRecord`, `StaffAttendance`. Mendukung sistem *selfie* berbasis webrtc/kamera dan geolokasi.
*   **Akademik & CBT:** `Subject`, `Schedule`, `Grade`, `TeacherJournal`, `DisciplineRecord`, `CbtExam`, `CbtQuestionBank`.
*   **Donasi:** `DonationCampaign`, `Donation`.

### 4.6. Komunikasi & Marketing
*   **InternalMessage:** Perpesanan internal 1-on-1 antar staff/admin.
*   **DripCampaign & DripLog:** Sistem pemasaran otomatis / email marketing.
*   **Notification:** Sistem notifikasi in-app untuk pengguna.
*   **WaSession:** Konfigurasi WhatsApp gateway (bot) milik tenant.

---

## 5. Fitur Unggulan (Key Features)

Berdasarkan arsitektur dan model data, fitur yang mendefinisikan aplikasi ini:
1.  **Multi-Tenant CMS Website:** Setiap sekolah otomatis mendapat *landing page* profesional yang kontennya dikelola langsung oleh mereka.
2.  **Sistem Berlangganan Otomatis:** Otomatisasi penagihan sekolah melalui integrasi Payment Gateway (*Tripay* berdasarkan ref schema `tripayRef`).
3.  **CBT (Computer Based Test):** Bank soal, pelaksanaan ujian, serta kalkulasi nilai otomatis.
4.  **Aplikasi Keuangan Tertutup (Closed-loop Wallet):** Ekosistem keuangan untuk siswa, memungkinkan transaksi kantin tanpa uang tunai dan top-up saldo via gateway.
5.  **Presensi Kehadiran Berbasis Lokasi & Wajah:** Penerapan *WebRTC* untuk keamanan kehadiran Staff/Siswa.
6.  **WhatsApp Gateway & Email Automation:** Pengiriman notifikasi tagihan, *broadcast* pengumuman, dan kampanye email otomatis (*drip campaigns*).
7.  **Sistem Afiliasi (Affiliate):** Pemberdayaan agen eksternal untuk memasarkan platform SaaS dengan bagi hasil yang dikalkulasi secara otomatis oleh sistem.

---

## 6. Analisa Kelemahan Saat Ini & Rekomendasi Teknis

*   **Kompleksitas Monolitik:** Seiring pertumbuhan fitur (Kantin, CBT, PPDB, CMS), ukuran *monolith* menjadi sangat besar. **Saran:** Pada saat mencapai 500+ *tenant* aktif, pertimbangkan memisahkan modul-modul berat (seperti CBT yang memakan IO database tinggi) menjadi *Microservice* tersendiri.
*   **Storage S3:** File PPDB, Tugas, dan Materi bisa menyita ratusan Gigabyte. **Saran:** Terapkan aturan *auto-lifecycle* penghapusan file *temporary* pada AWS S3 atau integrasi kompresi media (menggunakan library `sharp` yang sudah ada) di sisi server sebelum *upload*.
*   **Data Partitioning (Tenancy):** Saat ini menggunakan model *Shared Database, Shared Schema* (kolom `tenantId` pada setiap entitas). Ini memudahkan query silang dan hemat biaya server, namun jika aplikasi berkembang pesat, isolasi performa antar tenant bisa terganggu. **Saran:** Pastikan semua *index* pada database diatur dengan kombinasi `tenantId` sebagai prioritas.

## 7. Strategi Bisnis Kedepan

1.  **White-label Mobile App:** Memanfaatkan REST API yang sudah ada untuk membuat versi *mobile app* (React Native / Flutter) tersendiri untuk setiap Sekolah, memberikan *value-added* yang tinggi untuk paket **Enterprise**.
2.  **Integrasi AI untuk Guru:** Menggunakan package `@ai-sdk/openai` yang sudah ada untuk membantu guru (1) membuat butir soal ujian secara otomatis berdasarkan KI/KD, (2) membuat silabus, dan (3) menganalisis laporan kedisiplinan siswa.
3.  **Monetisasi Kantin/Dompet Digital:** Pemberlakuan biaya layanan (*platform fee* kecil misal Rp500) per transaksi pada fitur *Wallet* / Pembayaran Kantin sebagai *revenue stream* tambahan selain biaya langganan bulanan.
4.  **B2B Partnerships (Payment Gateways/Bank):** Menyediakan integrasi rekonsiliasi pembayaran dengan perbankan BPD lokal, karena sekolah (terutama swasta/yayasan daerah) banyak bergantung pada bank lokal untuk transaksi SPP/PPDB.
