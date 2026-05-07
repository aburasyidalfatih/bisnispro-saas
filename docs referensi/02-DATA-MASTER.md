# 2. Data Master

## 2.1 Gambaran Umum

Modul data master mengelola entitas dasar yang menjadi fondasi seluruh operasi aplikasi: unit sekolah, tahun ajaran, kelas, siswa, kategori tagihan, dan rekening bank.

---

## 2.2 Unit Sekolah

- **Views**: `admin/unit/` (index, import, deleted)
- **Controller**: `Admin/Master/Unit.php`
- **Tabel**: `spa_units`

### Struktur Data

| Field | Tipe | Keterangan |
|-------|------|------------|
| unit_id | bigint PK | ID unik |
| unit_code | varchar(32) | Kode unit (misal: SD, SMP) |
| unit_name | varchar(64) | Nama unit |
| unit_number | tinyint(2) | Nomor urut |
| description | varchar(128) | Deskripsi |
| is_active | tinyint(1) | Status aktif |
| is_deleted | tinyint(1) | Soft delete flag |
| is_admission | tinyint(1) | Digunakan untuk PSB |
| batch_number | char(16) | Nomor batch import |

### Fitur
- CRUD unit sekolah
- Import data via Excel
- Soft delete & restore
- Satu instalasi mendukung multi-unit (multi-tenant by unit)
- Flag `is_admission` untuk menandai unit yang membuka PSB

### Relasi
- Menjadi parent dari: kelas, tagihan, pembayaran, tabungan, absensi, rekening bank, billing, kategori tagihan, konten, arus kas

---

## 2.3 Tahun Ajaran

- **Views**: `admin/classyear/` (index, deleted)
- **Controller**: `Admin/Master/Classyear.php`
- **Tabel**: `spa_classyears`

### Struktur Data

| Field | Tipe | Keterangan |
|-------|------|------------|
| year_id | bigint PK | ID unik |
| year_code | varchar(9) | Kode tahun (misal: 2025/2026) |
| year_name | varchar(32) | Nama tahun ajaran |
| description | varchar(128) | Deskripsi |
| is_active | tinyint(1) | Status aktif |
| is_deleted | tinyint(1) | Soft delete flag |

### Fitur
- CRUD tahun ajaran
- Soft delete & restore
- Hanya satu tahun ajaran aktif pada satu waktu

### Relasi
- Parent dari: kelas (`spa_classrooms`)
- Referensi dari: siswa (`spa_students`)

---

## 2.4 Kelas

- **Views**: `admin/classroom/` (index, import, deleted)
- **Controller**: `Admin/Master/Classroom.php`
- **Tabel**: `spa_classrooms`

### Struktur Data

| Field | Tipe | Keterangan |
|-------|------|------------|
| class_id | bigint PK | ID unik |
| unit_id | bigint FK | Unit sekolah |
| year_id | bigint FK | Tahun ajaran |
| class_code | varchar(32) | Kode kelas |
| class_name | varchar(32) | Nama kelas (misal: X-IPA-1) |
| class_major | varchar(64) | Jurusan |
| class_year | varchar(9) | Tahun ajaran (denormalisasi) |
| is_active | tinyint(1) | Status aktif |
| is_deleted | tinyint(1) | Soft delete flag |
| is_admission | tinyint(1) | Digunakan untuk PSB |
| batch_number | char(16) | Nomor batch import |

### Fitur
- CRUD kelas
- Import data via Excel
- Soft delete & restore
- Filter berdasarkan unit dan tahun ajaran
- Flag `is_admission` untuk kelas tujuan PSB

### Relasi
- Terhubung ke unit (`spa_units`) dan tahun ajaran (`spa_classyears`)
- Parent dari: siswa, tagihan, pembayaran, absensi, pendaftar PSB

---

## 2.5 Data Siswa

- **Views**: `admin/student/` (index, add, edit, detail, import, deleted, promotion)
- **Controller**: `Admin/Master/Student.php`
- **Tabel**: `spa_students`, `spa_students_parents`, `spa_students_histories`

### Struktur Data Siswa (`spa_students`)

| Field | Tipe | Keterangan |
|-------|------|------------|
| student_id | bigint PK | ID unik |
| year_id | bigint FK | Tahun ajaran masuk |
| class_id | bigint FK | Kelas saat ini |
| student_name | varchar(64) | Nama lengkap |
| student_number | varchar(32) | Nomor induk siswa |
| student_gender | enum(L,P) | Jenis kelamin |
| student_pob | varchar(32) | Tempat lahir |
| student_dob | date | Tanggal lahir |
| student_religion | varchar(32) | Agama |
| student_civil_status | char(3) | Status kewarganegaraan |
| student_nik | char(16) | NIK |
| student_nkk | char(16) | No. Kartu Keluarga |
| student_akta | varchar(32) | No. Akta Kelahiran |
| student_child_to | char(2) | Anak ke- |
| student_child_from | char(2) | Dari bersaudara |
| student_height | char(3) | Tinggi badan (cm) |
| student_weight | char(3) | Berat badan (kg) |
| student_blood | varchar(16) | Golongan darah |
| student_disease | varchar(32) | Riwayat penyakit |
| student_child_status | enum | Yatim/Piatu/Yatim Piatu |
| student_residence_status | varchar(32) | Status tempat tinggal |
| student_residence_distance | char(2) | Jarak ke sekolah (km) |
| student_language | varchar(16) | Bahasa sehari-hari |
| student_hobby | varchar(64) | Hobi |
| student_wish | varchar(64) | Cita-cita |
| student_nisn | varchar(16) | NISN |
| student_ijazah | varchar(32) | No. Ijazah |
| student_school_name | varchar(64) | Asal sekolah |
| student_school_level | varchar(8) | Jenjang asal |
| student_school_number | varchar(32) | NPSN asal |
| student_province s/d student_address | varchar | Alamat lengkap |
| student_photo | varchar(128) | Path foto |
| student_phone | varchar(16) | Telepon |
| student_email | varchar(64) | Email |
| student_status | enum(A,L,K) | A=Aktif, L=Lulus, K=Keluar |
| student_year_in | char(4) | Tahun masuk |
| student_year_out | char(4) | Tahun keluar |
| is_deleted | tinyint(1) | Soft delete |

### Struktur Data Orang Tua (`spa_students_parents`)
- Data ayah: nama, tempat/tanggal lahir, agama, NIK, pekerjaan, penghasilan, pendidikan, kondisi (hidup/meninggal), alamat, telepon, email
- Data ibu: field yang sama dengan ayah
- Data wali: field yang sama + status hubungan wali

### Riwayat Siswa (`spa_students_histories`)
- Mencatat perpindahan kelas (class_id lama → baru)
- Admin yang melakukan perubahan
- Waktu perubahan

### Fitur
- CRUD siswa dengan biodata lengkap
- Import data siswa via Excel
- Upload foto siswa (dengan crop via Croppie)
- Promosi/kenaikan kelas massal
- Soft delete & restore
- Filter berdasarkan unit, kelas, tahun ajaran, status
- Export data siswa ke Excel
- Detail siswa mencakup: biodata, orang tua, tagihan, pembayaran, tabungan

---

## 2.6 Kategori Tagihan

- **Views**: `admin/bill-category/` (index, import)
- **Controller**: `Admin/Master/BillCategory.php`
- **Tabel**: `spa_categories`

### Struktur Data

| Field | Tipe | Keterangan |
|-------|------|------------|
| category_id | bigint PK | ID unik |
| unit_id | bigint FK | Unit sekolah |
| category_code | varchar(16) | Kode kategori (misal: SPP) |
| category_name | varchar(64) | Nama kategori |
| category_amount | float | Nominal default |
| description | varchar(128) | Deskripsi |
| is_active | tinyint(1) | Status aktif |

### Fitur
- CRUD kategori tagihan
- Import via Excel
- Nominal default per kategori
- Digunakan sebagai template saat membuat tagihan

---

## 2.8 Business Rules Data Master

### Unit Sekolah
- Kode unit harus unik
- Unit yang memiliki data siswa/kelas/tagihan tidak bisa di-hard-delete
- `is_admission = 1` menandai unit yang membuka PSB
- Semua data operasional difilter berdasarkan `unit_id`

### Tahun Ajaran
- Hanya boleh ada **satu tahun ajaran aktif** (`is_active = 1`) pada satu waktu
- Saat mengaktifkan tahun ajaran baru, tahun ajaran lama otomatis dinonaktifkan
- Tahun ajaran yang memiliki kelas aktif tidak bisa dihapus

### Kelas
- Kode kelas harus unik per unit per tahun ajaran
- Kelas terhubung ke unit DAN tahun ajaran
- Kelas yang memiliki siswa aktif tidak bisa dihapus
- `is_admission = 1` menandai kelas sebagai tujuan PSB

### Siswa
- `student_number` (NIS) harus unik
- `student_status`: A (Aktif) → L (Lulus) atau K (Keluar)
- Siswa yang lulus/keluar: set `student_year_out`, status berubah
- Siswa yang memiliki tagihan belum lunas tidak bisa diubah statusnya ke L/K
- Promosi kelas: update `class_id`, catat di `spa_students_histories`
- Import siswa: validasi NIS unik, kelas valid, data wajib lengkap

### Kategori Tagihan
- `category_code` harus unik per unit
- `category_amount` adalah nominal default (bisa dioverride saat buat tagihan)
- Kategori yang sudah digunakan di tagihan tidak bisa dihapus

### Rekening Bank
- `bank_number` harus unik
- `is_connect = 1` menandai rekening terhubung ke payment gateway
- Rekening yang digunakan untuk pembayaran online harus `is_active = 1` dan `is_connect = 1`

---

## 2.7 Rekening Bank

- **Views**: `admin/bank-account/` (index, add, edit)
- **Controller**: `Admin/Master/BankAccount.php`
- **Tabel**: `spa_banks`

### Struktur Data

| Field | Tipe | Keterangan |
|-------|------|------------|
| bank_id | bigint PK | ID unik |
| unit_id | bigint FK | Unit sekolah |
| bank_code | varchar(6) | Kode bank |
| bank_name | varchar(32) | Nama bank |
| bank_office | varchar(64) | Cabang |
| bank_owner | varchar(64) | Nama pemilik rekening |
| bank_number | varchar(16) | Nomor rekening |
| bank_logo | varchar(128) | Path logo bank |
| used_for | char(3) | Digunakan untuk modul apa |
| is_active | tinyint(1) | Status aktif |
| is_connect | tinyint(1) | Terhubung ke payment gateway |

### Fitur
- CRUD rekening bank
- Upload logo bank
- Tandai rekening yang terhubung ke payment gateway
- Tampilkan di halaman pembayaran member
