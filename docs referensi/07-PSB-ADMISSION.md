# 7. Penerimaan Siswa Baru (PSB / Admission)

## 7.1 Gambaran Umum

Modul PSB mengelola seluruh proses penerimaan siswa baru secara digital: pendaftaran online, verifikasi dokumen, pembayaran biaya pendaftaran, pengumuman, hingga sinkronisasi data ke siswa aktif.

---

## 7.2 Tabel Terkait

| Tabel | Fungsi |
|-------|--------|
| `spa_admission_periods` | Periode pendaftaran |
| `spa_admission_registrars` | Data pendaftar |
| `spa_admission_students` | Biodata calon siswa |
| `spa_admission_parents` | Data orang tua calon siswa |
| `spa_admission_documents` | Dokumen persyaratan |
| `spa_admission_bills` | Tagihan biaya PSB |
| `spa_admission_accounts` | Akun login pendaftar |
| `spa_admission_students_fields` | Field dinamis tambahan |

---

## 7.3 Periode Pendaftaran

- **Views**: `admin/admission/period-index.blade.php`, `period-deleted.blade.php`
- **Tabel**: `spa_admission_periods`

| Field | Tipe | Keterangan |
|-------|------|------------|
| period_id | bigint PK | ID unik |
| period_code | varchar(16) | Kode periode |
| period_name | varchar(32) | Nama periode |
| period_description | varchar(100) | Deskripsi |
| period_start | date | Tanggal mulai |
| period_end | date | Tanggal selesai |
| is_active | tinyint(1) | Status aktif |
| is_deleted | tinyint(1) | Soft delete |

### Fitur
- CRUD periode pendaftaran
- Atur tanggal buka/tutup pendaftaran
- Soft delete & restore

---

## 7.4 Data Pendaftar (Registrar)

- **Views**: `admin/admission/registrar-*` (index, add, edit, detail, verify, sync, document, print, deleted)
- **Controller**: `Admin/Admission.php`
- **Model**: `Admission/Registrar.php`
- **Tabel**: `spa_admission_registrars`

| Field | Tipe | Keterangan |
|-------|------|------------|
| registrar_id | bigint PK | ID unik |
| unit_id | bigint FK | Unit tujuan |
| period_id | bigint FK | Periode pendaftaran |
| class_id | bigint FK | Kelas tujuan |
| registrar_year | varchar(9) | Tahun pendaftaran |
| registrar_name | varchar(64) | Nama pendaftar |
| registrar_code | varchar(32) | Kode pendaftaran unik |
| registrar_path | varchar(64) | Jalur masuk |
| registrar_type | varchar(32) | Tipe pendaftaran |
| registrar_status | char(3) | Status pendaftaran |
| registrar_major | varchar(64) | Jurusan pilihan 1 |
| registrar_major_second | varchar(64) | Jurusan pilihan 2 |
| student_percentage | char(8) | Persentase kelengkapan biodata |
| parents_percentage | char(8) | Persentase kelengkapan data ortu |
| document_percentage | char(8) | Persentase kelengkapan dokumen |
| registration_step | tinyint(1) | Step pendaftaran saat ini |
| is_verified | tinyint(1) | Status verifikasi |
| verified_by | varchar(64) | Admin yang memverifikasi |
| verified_at | datetime | Waktu verifikasi |
| is_synced | tinyint(1) | Sudah disinkronkan ke data siswa |
| synced_by | varchar(64) | Admin yang menyinkronkan |
| synced_at | datetime | Waktu sinkronisasi |
| is_deleted | tinyint(1) | Soft delete |

### Fitur
- Daftar seluruh pendaftar dengan filter unit, periode, status
- Tambah pendaftar manual oleh admin
- Edit data pendaftar
- **Verifikasi pendaftar**: admin review dan approve/reject
- **Sinkronisasi ke siswa**: konversi pendaftar menjadi siswa aktif di data master
- Cetak formulir pendaftaran
- Export data pendaftar ke Excel
- Soft delete & restore
- Tracking persentase kelengkapan data (biodata, orang tua, dokumen)

---

## 7.5 Biodata Calon Siswa (`spa_admission_students`)

Data lengkap meliputi:
- Identitas: nama, gender, tempat/tanggal lahir, agama, NIK, NKK, akta
- Keluarga: anak ke-, jumlah saudara, status anak
- Fisik: tinggi, berat, golongan darah, riwayat penyakit
- Pendidikan: NISN, ijazah, asal sekolah, jenjang, NPSN
- Alamat: provinsi, kota, kecamatan, kelurahan, alamat lengkap
- Kontak: telepon, email, foto

---

## 7.6 Data Orang Tua (`spa_admission_parents`)

Tiga kategori data orang tua:
- **Ayah**: nama, TTL, agama, NIK, pekerjaan, penghasilan, pendidikan, kondisi (hidup/meninggal), alamat, telepon, email
- **Ibu**: field yang sama
- **Wali**: field yang sama + status hubungan wali

---

## 7.7 Dokumen Persyaratan (`spa_admission_documents`)

| Field | Tipe | Keterangan |
|-------|------|------------|
| document_id | bigint PK | ID unik |
| registrar_id | bigint FK | Pendaftar |
| document_key | varchar(128) | Key dokumen |
| document_name | varchar(64) | Nama dokumen |
| document_note | varchar(255) | Catatan |
| document_path | varchar(128) | Path file |
| document_format | varchar(6) | Format file (pdf, jpg, dll) |

---

## 7.8 Tagihan PSB (`spa_admission_bills`)

- Struktur mirip `spa_bills` dengan cicilan hingga 9x
- Terhubung ke pendaftar via `registrar_id`
- Terhubung ke pembayaran via `payment_id`
- Tipe pembayaran: BL (Lunas) atau CL (Cicilan)

---

## 7.9 Field Dinamis (`spa_admission_students_fields`)

- Memungkinkan admin menambah field custom pada form pendaftaran
- Terhubung ke `spa_settings` untuk definisi field
- Menyimpan value per siswa per field

---

## 7.10 Portal Pendaftaran (Frontend)

- **Views**: `admission/` (index, form-register, form-register-detail, announcement, contact, dll)
- **Controller**: `Admission/MainController.php`
- **Layout**: `layouts/admission.blade.php`

### Halaman Publik
- Landing page PSB
- Form pendaftaran online (multi-step)
- Detail pendaftaran & cetak
- Pengumuman PSB
- Halaman kontak

### Akun Pendaftar (`spa_admission_accounts`)
- Login/register khusus pendaftar
- Reset password via token
- Dashboard pendaftar: status, kelengkapan data, pembayaran

---

## 7.11 Pengaturan PSB

- **Views**: `admin/admission/setting-*` (general, form, field, cost, document, notification, contact)

| Pengaturan | Fungsi |
|-----------|--------|
| General | Konfigurasi umum PSB |
| Form | Pengaturan form pendaftaran |
| Field | Field dinamis tambahan |
| Cost | Biaya pendaftaran |
| Document | Dokumen persyaratan |
| Notification | Template notifikasi PSB |
| Contact | Informasi kontak |

---

## 7.12 Komponen PSB

- **Views**: `admin/admission/component-*` (education, income, job, major, path, type)

| Komponen | Fungsi |
|----------|--------|
| Education | Pilihan jenjang pendidikan |
| Income | Pilihan range penghasilan |
| Job | Pilihan pekerjaan |
| Major | Pilihan jurusan |
| Path | Jalur masuk (reguler, prestasi, dll) |
| Type | Tipe pendaftaran |

---

## 7.13 Business Rules PSB

### Alur Pendaftaran Online
1. Calon siswa buka portal PSB → pilih unit & periode
2. Isi form pendaftaran (multi-step):
   - Step 1: Biodata siswa
   - Step 2: Data orang tua
   - Step 3: Upload dokumen
3. Sistem generate `registrar_code` unik
4. Buat akun login di `spa_admission_accounts`
5. Tracking persentase kelengkapan per section:
   - `student_percentage`: kelengkapan biodata
   - `parents_percentage`: kelengkapan data ortu
   - `document_percentage`: kelengkapan dokumen
6. `registration_step` menandai step terakhir yang diselesaikan

### Verifikasi
1. Admin review data pendaftar
2. Cek kelengkapan biodata, data ortu, dokumen
3. Jika lengkap dan valid → `is_verified = 1`, catat `verified_by` dan `verified_at`
4. Jika tidak lengkap → minta pendaftar melengkapi via portal

### Pembayaran PSB
1. Admin buat tagihan PSB di `spa_admission_bills`
2. Tagihan bisa bayar lunas (BL) atau cicilan (CL, max 9x)
3. Pendaftar bayar via portal (online) atau admin proses tunai
4. Pembayaran PSB tercatat di `spa_payments` dengan `registrar_id`
5. Catat ke cashflow (akun 0003 - Transaksi PPDB)

### Sinkronisasi ke Siswa Aktif
1. Syarat: `is_verified = 1` dan tagihan PSB lunas
2. Admin pilih kelas tujuan
3. Sistem:
   - Copy `spa_admission_students` → `spa_students`
   - Copy `spa_admission_parents` → `spa_students_parents`
   - Buat akun di `spa_accounts` (is_student = 1)
   - Set `master_student_id`, `master_class_id`, `master_year_id`
4. Update registrar: `is_synced = 1`, `synced_by`, `synced_at`
5. Pendaftar yang sudah di-sync tidak bisa di-sync ulang

### Pengumuman PSB
1. Admin buat pengumuman per periode
2. Pengumuman tampil di portal PSB
3. Bisa berisi hasil seleksi, jadwal, informasi penting
4. Mendukung rich text (TinyMCE) dan lampiran

### Form Dinamis
1. Admin bisa menambah field custom via pengaturan PSB
2. Field disimpan di `spa_settings` dengan `setting_group` tertentu
3. Value per pendaftar disimpan di `spa_admission_students_fields`
4. Tipe input bisa: text, textarea, select, date, file
