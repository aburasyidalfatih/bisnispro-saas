# Dokumen Laporan Audit Database & Skema Enterprise: SchoolPro SaaS

> [!NOTE]
> Laporan ini berfokus pada anatomi `schema.prisma`, normalisasi data, biaya *query*, dan kesiapan arsitektur *database* untuk menampung data dari ribuan sekolah tanpa membebani server secara eksponensial.

## 1. Executive Summary (Ringkasan Eksekutif Database)

- **Database Scalability Score:** **6.0 / 10** (Status: *MVP to Enterprise Transition*)
- **Penilaian:** Skema database SchoolPro sangat komprehensif dan sudah menerapkan pola relasional yang matang untuk fitur-fitur EdTech. Namun, untuk skala masif, struktur saat ini menyimpan potensi *Table Bloat* (pembengkakan tabel) dan *Missing Composite Indexes* yang dapat memperlambat kueri seiring bertambahnya data.

### Data Time-Bombs (Bom Waktu Data)
> [!CAUTION]
> Titik kritis yang akan mematikan performa database dalam 6-12 bulan pertama:
> 1. **Absennya *Composite Index* Global:** Anda memiliki banyak indeks tunggal (seperti `@@index([tenantId])` dan `@@index([createdAt])`), tetapi kueri aplikasi hampir selalu memanggil keduanya secara bersamaan (misal: "Cari absensi tenant X pada hari Y"). Tanpa *Composite Index*, database harus memindai (*scan*) baris secara manual yang sangat memakan CPU.
> 2. **Tabel Absensi Tanpa Batas (Table Bloat):** Tabel `AttendanceRecord` tidak memiliki relasi "Tahun Ajaran/Semester". Jika 1.000 sekolah memasukkan 500 absen setiap hari, tabel ini akan menampung **15 Juta Baris Data per bulan**. Tanpa strategi *Partitioning* atau *Archiving*, kueri kalkulasi harian akan sangat melambat.
> 3. **Penggunaan JSONb yang Tidak Dapat Di-Index:** Tabel `PendaftarPpdb` menyimpan `dataFormulir` dan `dataOrangtua` sebagai `Json`. Jika sekolah ingin memfilter data (contoh: "Cari pendaftar dengan pendapatan orang tua > 5 juta"), PostgreSQL harus membedah struktur JSON di memori, yang jauh lebih lambat daripada tabel relasional.

---

## 2. Schema Anatomy & Scaling Audit (Tabel Temuan Database)

| Kategori | Temuan di Schema | Tingkat Risiko | Dampak Biaya / Performa |
| :--- | :--- | :---: | :--- |
| **Composite Constraints & Indexing** | Banyak kueri spesifik seperti status transaksi (Invoice) difilter bersamaan dengan tanggal (dueDate) dan tenant. Namun hanya ada *Single Index*. | **High** | Membengkaknya *Compute Time* (CPU) pada PostgreSQL karena *Index Scan* yang tidak optimal. |
| **Table Partitioning & Archiving** | Data *Time-Series* hiperaktif seperti `AttendanceRecord` dan `AuditLog` bercampur aduk sepanjang tahun dalam satu tabel raksasa tanpa metadata periode yang jelas. | **Critical** | Membengkaknya RAM server *Database*. Kalkulasi *dashboard* akan melambat dari hitungan milidetik menjadi detik. |
| **JSONb & Anti-Pattern Analysis** | Penggunaan `Json` pada formulir dinamis PPDB. Walaupun *flexible*, kolom tipe JSON sulit dipasang agregasi dan lambat untuk kueri perbandingan (*filtering* mendalam). | **Medium** | Biaya pencarian data PPDB (Filter Lanjutan) akan menjadi kueri termahal (*Most Expensive Query*) di server Anda. |
| **Soft Delete Mechanics** | Sudah ada `deletedAt` di `Invoice`. Namun, data inti lain seperti `Student` dan `User` sering kali langsung dihapus permanen. | **Medium** | Risiko kehilangan data akibat kesalahan admin (*Human Error*) tidak bisa dikembalikan, berdampak pada komplain klien. |
| **Orphan Data & Cascade Deletion** | Mayoritas sudah menggunakan `onDelete: Cascade`. Sangat bagus. | **Low** | Sangat efisien, tidak akan meninggalkan data sampah saat Tenant dihapus. |

---

## 3. Deep Dive & Cost Optimization Recommendations

### A. Bahaya Ketiadaan Indeks Komposit (Composite Index)
Saat aplikasi Anda menjalankan kueri:
`SELECT * FROM invoices WHERE tenantId = 'X' AND status = 'UNPAID' ORDER BY dueDate ASC`
Meskipun Anda memiliki `@@index([tenantId])`, `@@index([status])`, dan `@@index([dueDate])` secara terpisah, PostgreSQL tidak bisa menggabungkan ketiganya secara efisien. Kueri ini akan sangat berat jika jutaan tagihan mulai tercatat.

**Rekomendasi Refactor (Prisma):**
```prisma
model Invoice {
  // ... fields
  tenantId  String
  status    String
  dueDate   DateTime

  // Hapus indeks satuan yang tidak perlu, ganti dengan Composite:
  @@index([tenantId, status, dueDate]) 
  // Ini memungkinkan pencarian super cepat secara bersamaan!
}
```

### B. Mencegah Ledakan Data (Table Bloat) pada Tabel Absensi
**Rekomendasi Refactor:**
Pisahkan rekam jejak harian dari agregasi periode. Berikan relasi `PeriodeAkademik` pada tabel hiperaktif agar Anda bisa dengan mudah "mengarsipkan" atau mengecualikan data tahun lalu dari pencarian *real-time*.

```prisma
model AttendanceRecord {
  // ...
  periodeId String? // Hubungkan ke Tahun Ajaran (Semester Ganjil 2026)
  
  @@index([tenantId, date, status]) // Composite index pencarian harian
  @@index([periodeId])
}
```

---

## 4. Database Refactoring Roadmap (Peta Jalan Migrasi Skema)

Langkah-langkah aman untuk mengubah skema tanpa mengganggu data *Production* saat ini:

- [ ] **Fase 1: Composite Indexing (Minggu Ini)**
  - Audit ulang tabel `Invoice`, `AttendanceRecord`, dan `PendaftarPpdb` untuk mengubah indeks tunggal menjadi **Composite Index** berdasarkan pola filter yang sering diketik *User*.
  - Menjalankan `npx prisma db push` (tidak mengubah bentuk data, hanya struktur internal database).
- [ ] **Fase 2: Soft Deletes & Archiving Foundation (Minggu Depan)**
  - Menambahkan kolom `deletedAt DateTime?` pada model `Student`, `Staff`, dan `User` untuk fitur "Tong Sampah" (*Trash Bin/Soft Delete*).
  - Menambahkan relasi `Periode/Tahun Ajaran` di semua tabel transaksional.
- [ ] **Fase 3: JSONb Extraction (Bulan Depan)**
  - Mulai membuat skema tabel `PpdbFormField` dan `PpdbFormValue` jika sekolah mulai menuntut fitur pencarian siswa cerdas berdasar isian JSON mereka.

---

## 5. Conclusion (Kesimpulan Akhir)

> [!IMPORTANT]
> **Kesimpulan Database: Sangat Solid, Tinggal "Di-Tuning" (Disetel).**

Skema Anda saat ini bukanlah sebuah "Prototype" berantakan. Bentuk relasinya sudah sangat masuk akal, terstruktur, dan normalisasinya bagus. Penggunaan `onDelete: Cascade` juga sangat mengamankan ruang penyimpanan Anda.

Penyakit utamanya hanyalah **Penyakit Skala (Scaling Disease)** di mana kueri tidak disiapkan secara "Komposit" untuk menghadapi jutaan pencarian. Jika **Fase 1 (Composite Indexing)** di roadmap ini dieksekusi, Anda berhasil menyelamatkan ribuan dolar biaya penyewaan server PostgreSQL dalam setahun pertama.
