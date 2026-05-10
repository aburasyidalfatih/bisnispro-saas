"Saya ingin kamu bertindak sebagai **Principal Database Architect & Data Engineer** untuk mengevaluasi skema database project SaaS saya (SchoolPro). Aplikasi ini dibangun dengan **PostgreSQL dan Prisma ORM**, berarsitektur *Multi-tenant*, dan ditargetkan untuk menampung data dari **ribuan sekolah (jutaan baris data absensi, transaksi keuangan, dan log sistem)**.

Lakukan audit arsitektural secara ekstrem terhadap struktur file `schema.prisma`. Buatkan **Dokumen Laporan Audit Database & Skema Enterprise** yang fokus pada *Query Cost*, Normalisasi, dan Prediksi *Table Bloat*.

Susun dokumen tersebut dengan struktur sebagai berikut:

## 1. Executive Summary (Ringkasan Eksekutif Database)
- **Database Scalability Score:** Penilaian objektif (Skor 1-10) untuk kesiapan skema menampung 10 juta baris data tanpa *downtime*.
- **Data Time-Bombs (Bom Waktu Data):** 3-5 titik kritis dalam skema yang akan menyebabkan query menjadi sangat lambat (membengkaknya *Storage/Compute Cost*) dalam 6-12 bulan pertama jika ratusan sekolah aktif menggunakannya.

## 2. Schema Anatomy & Scaling Audit (Tabel Temuan Database)
Sajikan temuan dalam bentuk **Tabel Audit** (Kategori, Temuan di Schema, Tingkat Risiko, Dampak Biaya/Performa). Kategori wajib:
- **Table Partitioning & Archiving Readiness:** Evaluasi tabel transaksional bervolume tinggi (seperti `AttendanceRecord`, `InvoicePayment`, `AuditLog`). Apakah skema mendukung strategi pemotongan/pemisahan data (*Partitioning*) per Tahun Ajaran?
- **JSONb & Anti-Pattern Analysis:** Adakah kolom `Json` (seperti di formulir PPDB) yang seharusnya dinormalisasi menjadi tabel relasional? Apakah penggunaan `Json` tersebut akan mematikan efisiensi indeks pencarian?
- **Index & Composite Constraints:** Audit keutuhan `@@index` dan `@@unique`. Apakah ada *Composite Index* yang hilang pada kueri yang selalu memanggil `(tenantId, createdAt)` atau `(tenantId, status)` secara bersamaan?
- **Orphan Data & Cascade Deletion:** Uji logika `onDelete`. Jika *Tenant* dihapus, apakah data anak perusahaan, tagihan, dan rekam jejak terhapus bersih (*Cascade*), atau malah tertinggal (*SetNull/Restrict*) memakan ruang *hardisk* server?
- **Soft Delete Mechanics:** Apakah fitur *Soft Delete* (`deletedAt`) sudah diimplementasikan secara konsisten pada entitas vital (Invoice, Data Siswa) untuk mencegah kerugian finansial akibat penghapusan tidak sengaja?

## 3. Deep Dive & Cost Optimization Recommendations
- Untuk setiap kelemahan skema, berikan penjelasan teknis mengenai seberapa mahal kueri tersebut akan membebani RAM/CPU PostgreSQL.
- Sertakan **Blok Kode (Refactor `schema.prisma` Before vs After)** yang menerapkan indeks komposit, relasi efisien, dan strategi normalisasi.

## 4. Database Refactoring Roadmap (Peta Jalan Migrasi Skema)
Langkah-langkah aman untuk mengubah skema tanpa merusak data *Production* yang sudah berjalan:
- **Fase 1: Composite Indexing & Soft Deletes (Tanpa Downtime)**
- **Fase 2: Normalization & JSONb Extraction (Migrasi Skrip Data)**
- **Fase 3: Long-term Archiving Strategies (Pemisahan Database Historis)**

## 5. Conclusion (Kesimpulan Akhir)
- Kesimpulan: Apakah skema saat ini sudah mencerminkan *Database Enterprise* atau masih berupa skema *Prototype/MVP* yang membengkak seiring waktu?

Tampilkan dokumen ini menggunakan format Markdown standar GitHub (*GitHub Flavored Markdown*) yang elegan dan gunakan *Alerts* agar rapi saat saya salin ke `README_DB_AUDIT.md`."
