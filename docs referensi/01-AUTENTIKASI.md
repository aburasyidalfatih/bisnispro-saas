# 1. Autentikasi & Manajemen Akun

## 1.1 Gambaran Umum

Sistem autentikasi mendukung 4 jenis login terpisah dengan session management dan role-based access control (RBAC).

---

## 1.2 Jenis Login

### 1.2.1 Login Admin
- **Halaman**: `auth/login-admin.blade.php`
- **Controller**: `Auth/LoginController.php`
- **Middleware**: `AuthenticateAdmin`, `AuthenticateSingleSession`
- **Tabel**: `spa_accounts` (where `is_admin = 1`)
- **Fitur**:
  - Login dengan username/email + password
  - Single session (satu akun hanya bisa login di satu perangkat)
  - Token-based login recovery (`login_token`, `login_token_expired`)
  - ReCaptcha protection
  - Pencatatan `last_login`

### 1.2.2 Login Member (Siswa/Wali Murid)
- **Halaman**: `auth/login-member.blade.php`
- **Middleware**: `AuthenticateMember`
- **Tabel**: `spa_accounts` (where `is_student = 1`)
- **Fitur**:
  - Login dengan username + password
  - Single session enforcement
  - Redirect ke portal member mobile-responsive

### 1.2.3 Login Merchant (E-Kantin)
- **Halaman**: `auth/login-merchant.blade.php`
- **Controller**: `Ekantin/AuthController.php`
- **Tabel**: `spa_accounts` (where `admin_role = 'MC'`)
- **Fitur**:
  - Login khusus pedagang kantin
  - Akses ke portal e-kantin

### 1.2.4 Login Registrar (PSB)
- **Halaman**: `admission/auth/`
- **Controller**: `Admission/AuthController.php`
- **Middleware**: `AuthenticateRegistrar`
- **Tabel**: `spa_admission_accounts`
- **Fitur**:
  - Login khusus calon siswa baru
  - Reset password via token (`reset_password_token`, `reset_password_token_expired`)
  - Tracking `has_request_reset_password`

---

## 1.3 Manajemen Akun Admin

- **Views**: `admin/admin-account/` (index, add, edit, detail, import)
- **Controller**: `Admin/Master/AdminAccount.php`
- **Operasi**:
  - CRUD akun admin
  - Assign role (AU, TU, AK, AM, AA, AT, AC)
  - Import akun admin via Excel
  - Export data akun admin
  - Aktivasi/nonaktifkan akun (`is_active`)
  - Upload foto profil

### Struktur Data Akun (`spa_accounts`)

| Field | Tipe | Keterangan |
|-------|------|------------|
| account_id | bigint PK | ID unik akun |
| unit_id | bigint FK | Unit sekolah (untuk member) |
| class_id | bigint FK | Kelas (untuk member) |
| student_id | bigint FK | Siswa terkait (untuk member) |
| nip | varchar(32) | Nomor Induk Pegawai (admin) |
| fullname | varchar(64) | Nama lengkap |
| email | varchar(64) | Email |
| username | varchar(64) | Username login |
| password | varchar(255) | Password (bcrypt hash) |
| password_raw | varchar(255) | Password mentah (untuk reset) |
| phone | varchar(16) | Nomor telepon |
| photo | varchar(64) | Path foto profil |
| is_active | tinyint(1) | Status aktif |
| is_student | tinyint(1) | Flag akun siswa/wali |
| is_admin | tinyint(1) | Flag akun admin |
| admin_role | enum | Role: AU, TU, AK, AM, AA, AT, AC, MC |
| login_session_token | varchar(255) | Token sesi aktif |
| login_token | varchar(255) | Token login recovery |
| login_token_expired | datetime | Expired token login |
| batch_number | char(16) | Nomor batch import |

---

## 1.4 Manajemen Akun Siswa/Wali

- **Views**: `admin/student-account/` (index, add, edit, detail, sync)
- **Controller**: `Admin/Master/StudentAccount.php`
- **Operasi**:
  - CRUD akun siswa/wali murid
  - Sinkronisasi otomatis dari data siswa (`sync`)
  - Export data akun siswa
  - Aktivasi/nonaktifkan akun

---

## 1.5 Profil & Password

- **Views**: `admin/account/profile.blade.php`, `admin/account/password.blade.php`
- **Fitur**:
  - Edit profil (nama, email, telepon, foto)
  - Ganti password
  - Tracking `last_change_password`

---

## 1.6 Middleware & Keamanan

| Middleware | Fungsi |
|-----------|--------|
| `AuthenticateAdmin` | Validasi sesi admin |
| `AuthenticateMember` | Validasi sesi member |
| `AuthenticateRegistrar` | Validasi sesi pendaftar PSB |
| `AuthenticateTenant` | Validasi tenant/unit |
| `AuthenticateSingleSession` | Cegah login ganda |
| `AllowForRoleAA/AC/AK` | Izinkan role tertentu |
| `DisallowForRoleAA/AC/AK/AM/AT/TU` | Blokir role tertentu |
| `LicenseCheck` | Validasi lisensi aplikasi |
| `MaintenanceCheck` | Cek mode maintenance |
| `ValidateApp` | Validasi aplikasi |
| `ValidateKey` | Validasi key |
| `ValidateLicenseKey` | Validasi license key |
| `VerifyAppProvider` | Verifikasi provider |
| `ReCaptcha` (Rule) | Validasi Google ReCaptcha |

---

## 1.7 Halaman Error Akun

- `account-disabled.blade.php` — Akun dinonaktifkan
- `account-inused.blade.php` — Akun sedang digunakan di perangkat lain
- `maintenance.blade.php` — Sistem dalam maintenance
- `license.blade.php` — Lisensi tidak valid

---

## 1.8 Business Rules Autentikasi

### Alur Login
1. User input username/email + password
2. Validasi ReCaptcha (jika diaktifkan)
3. Cek akun ada di database
4. Cek `is_active = 1` → jika tidak, tampilkan halaman "Akun Dinonaktifkan"
5. Cek password (bcrypt verify)
6. Cek single session: jika `login_session_token` sudah ada dan berbeda → tampilkan "Akun Sedang Digunakan"
7. Generate `login_session_token` baru, simpan ke database dan session
8. Update `last_login` dengan timestamp sekarang
9. Redirect ke dashboard sesuai role

### Single Session Enforcement
- Setiap login menghasilkan `login_session_token` unik
- Setiap request, middleware cek token di session === token di database
- Jika tidak cocok → force logout, redirect ke halaman "Akun Sedang Digunakan"
- Login baru menimpa token lama → sesi lama otomatis invalid

### Login Token Recovery
- User request login token → generate `login_token` + set `login_token_expired` (misal +1 jam)
- Set `has_request_login_token = 1`
- Kirim token via email/WhatsApp
- User input token → validasi token dan expired → izinkan login
- Setelah digunakan, reset token

### Password Policy
- Minimum 6 karakter
- Disimpan dengan bcrypt hash (`$2y$10$...`)
- Field `password_raw` menyimpan password mentah (untuk fitur reset oleh admin)
- `last_change_password` dicatat setiap ganti password

### Role-Based Access Control
- Setiap route/halaman dilindungi middleware role
- `AllowForRoleXX` → hanya role XX yang bisa akses
- `DisallowForRoleXX` → semua role kecuali XX bisa akses
- Super Admin (AU) bisa akses semua halaman
- Role bisa dikombinasikan (misal: AK + AU bisa akses keuangan)

### Akun PSB (Registrar)
- Terpisah dari akun utama (tabel `spa_admission_accounts`)
- Mendukung reset password via token
- `reset_password_token` + `reset_password_token_expired`
- Max 1 request reset aktif (`has_request_reset_password`)
- Setelah reset berhasil, token dihapus
