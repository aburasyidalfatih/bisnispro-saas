# 10. Absensi (Attendance)

## 10.1 Gambaran Umum

Modul absensi mengelola kehadiran siswa dan admin/guru. Mendukung absensi per mata pelajaran, foto check-in/out, dan lampiran surat izin.

---

## 10.2 Tabel Terkait

| Tabel | Fungsi |
|-------|--------|
| `spa_attendances` | Data absensi individual |
| `spa_attendances_groups` | Grup/sesi absensi per pertemuan |
| `spa_attendances_subjects` | Mata pelajaran |

---

## 10.3 Absensi Siswa

- **Views**: `admin/attendance/student/` (index, add, edit, detail, manage, manage-detail)
- **Controller**: `Admin/Attendance.php`

### Struktur Data Absensi (`spa_attendances`)

| Field | Tipe | Keterangan |
|-------|------|------------|
| attendance_id | bigint PK | ID unik |
| unit_id | bigint FK | Unit sekolah |
| class_id | bigint FK | Kelas |
| student_id | bigint FK | Siswa |
| account_id | bigint FK | Akun admin/guru (untuk absensi admin) |
| group_id | bigint FK | Grup/sesi absensi |
| attendance_date | date | Tanggal |
| attendance_type | varchar(16) | Tipe (harian, per mapel) |
| attendance_status | char(1) | H=Hadir, S=Sakit, I=Izin, A=Alpha |
| attendance_checkin | time | Waktu check-in |
| attendance_checkout | time | Waktu check-out |
| attendance_photo_in | varchar(128) | Foto check-in |
| attendance_photo_out | varchar(128) | Foto check-out |
| attendance_note | varchar(255) | Catatan |
| attendance_attachment | varchar(255) | Lampiran (surat izin, dll) |
| attendance_level | enum(A,S) | A=Admin, S=Student |
| admin_name | varchar(64) | Admin yang menginput |
| batch_number | varchar(16) | Nomor batch |

### Fitur
- Input absensi per kelas per tanggal
- Edit absensi individual
- Status: Hadir, Sakit, Izin, Alpha
- Foto check-in dan check-out (via kamera/upload)
- Upload lampiran surat izin
- Manage absensi massal per kelas
- Detail rekap absensi per siswa
- Export data absensi ke Excel

---

## 10.4 Grup Absensi (`spa_attendances_groups`)

| Field | Tipe | Keterangan |
|-------|------|------------|
| group_id | bigint PK | ID unik |
| unit_id | bigint FK | Unit sekolah |
| class_id | bigint FK | Kelas |
| account_id | bigint FK | Guru/admin pengajar |
| subject_id | bigint FK | Mata pelajaran |
| group_date | date | Tanggal |
| group_type | varchar(16) | Tipe sesi |
| group_meet | varchar(16) | Pertemuan ke- |
| group_checkin | time | Waktu mulai |
| group_checkout | time | Waktu selesai |
| description | varchar(255) | Deskripsi |

### Fitur
- Buat sesi absensi per kelas per mata pelajaran
- Tracking pertemuan ke berapa
- Waktu mulai dan selesai sesi

---

## 10.5 Mata Pelajaran (`spa_attendances_subjects`)

| Field | Tipe | Keterangan |
|-------|------|------------|
| subject_id | bigint PK | ID unik |
| unit_id | bigint FK | Unit sekolah |
| subject_name | varchar(64) | Nama mata pelajaran |
| description | varchar(255) | Deskripsi |
| is_active | tinyint(1) | Status aktif |

---

## 10.6 Absensi Admin/Guru

- **Views**: `admin/attendance/admin/` (index, add, detail, history, manage, manage-detail, record)

### Fitur
- Input absensi admin/guru
- Riwayat kehadiran
- Record absensi (check-in/check-out)
- Manage absensi massal
- Detail per admin/guru

---

## 10.7 Pengaturan Absensi

- **Views**: `admin/attendance/setting-general.blade.php`, `setting-subject.blade.php`

| Pengaturan | Fungsi |
|-----------|--------|
| General | Konfigurasi umum absensi (jam masuk, toleransi, dll) |
| Subject | Kelola daftar mata pelajaran |

---

## 10.8 Absensi di Portal Member

- **Views**: `member/themes/mobile-responsive/attendance/` (index, detail, record)
- **Controller**: `Member/Attendance.php`

### Fitur
- Lihat rekap kehadiran siswa
- Detail absensi per tanggal
- Record absensi (jika diizinkan)

---

## 10.9 Business Rules Absensi

### Input Absensi Siswa
1. Admin/guru pilih kelas + tanggal + mata pelajaran (opsional)
2. Sistem buat grup absensi (`spa_attendances_groups`)
3. Tampilkan daftar siswa aktif di kelas tersebut
4. Input status per siswa: H (Hadir), S (Sakit), I (Izin), A (Alpha)
5. Opsional: foto check-in, catatan, lampiran surat izin
6. Satu siswa hanya boleh punya 1 record absensi per grup/sesi

### Absensi Per Mata Pelajaran
1. Buat grup absensi dengan `subject_id`
2. Catat pertemuan ke berapa (`group_meet`)
3. Waktu mulai dan selesai sesi
4. Absensi terhubung ke grup via `group_id`

### Absensi Admin/Guru
1. `attendance_level = 'A'` (Admin)
2. Menggunakan `account_id` bukan `student_id`
3. Mendukung check-in dan check-out dengan foto
4. Riwayat kehadiran per admin/guru

### Rekap Absensi
- Per siswa: total hadir, sakit, izin, alpha per bulan/semester
- Per kelas: persentase kehadiran per tanggal
- Export ke Excel untuk pelaporan

### Validasi
- Tanggal absensi tidak boleh di masa depan
- Kelas harus aktif
- Siswa harus aktif dan terdaftar di kelas tersebut
- Mata pelajaran harus aktif (jika digunakan)
