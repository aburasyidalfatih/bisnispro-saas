# SchoolPro — Dokumentasi Fitur PPDB (Penerimaan Peserta Didik Baru)

## Ringkasan

Modul PPDB adalah sistem pendaftaran siswa baru berbasis online yang terintegrasi penuh dengan ekosistem SchoolPro. Modul ini menganut prinsip **Progressive Onboarding** — pendaftar dibimbing melalui 7 tahap funneling dari registrasi awal hingga resmi menjadi siswa aktif.

Fitur ini bersifat **multi-tenant**: setiap sekolah (tenant) memiliki gelombang, persyaratan, tarif, dan data pendaftar yang sepenuhnya terisolasi.

---

## Arsitektur Alur PPDB (7 Tahap)

```
┌─────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ 1. Registrasi│───▶│ 2. Pembayaran│───▶│ 3. Form      │───▶│ 4. Review    │
│    Awal      │    │    Formulir  │    │    Lengkap   │    │    Admin     │
└─────────────┘    └──────────────┘    └──────────────┘    └──────────────┘
                                                                  │
                   ┌──────────────┐    ┌──────────────┐    ┌──────┴───────┐
                   │ 7. Sinkron   │◀───│ 6. Daftar    │◀───│ 5. Keputusan │
                   │    ke Siswa  │    │    Ulang     │    │    Seleksi   │
                   └──────────────┘    └──────────────┘    └──────────────┘
```

| Tahap | Aktivitas User | Reaksi Sistem |
|-------|---------------|---------------|
| **1. Registrasi Awal** | Isi form singkat (nama + pilih gelombang) | Buat `PendaftarPpdb` + `TagihanPpdb` biaya formulir |
| **2. Pembayaran Formulir** | Upload bukti transfer | Admin verifikasi → tagihan jadi `LUNAS` → form lengkap terbuka |
| **3. Form Lengkap** | Isi data siswa, data orang tua, upload berkas | Data tersimpan di JSON (`dataFormulir`, `dataOrangtua`). Mendukung **draft** dan **kirim final** |
| **4. Review Admin** | Menunggu | Admin review berkas satu per satu (terima/tolak) |
| **5. Keputusan Seleksi** | Melihat pengumuman | Admin tetapkan `TERVERIFIKASI` → `DITERIMA` atau `DITOLAK` |
| **6. Daftar Ulang** | Bayar tagihan daftar ulang | Admin generate tagihan daftar ulang, pendaftar melunasi |
| **7. Sinkron ke Siswa** | Selesai | Admin klik sinkron → data disalin ke tabel `Siswa` dengan NIS baru |

---

## Model Database

### Model Utama PPDB

| Model | Tabel DB | Fungsi |
|-------|----------|--------|
| `PeriodePpdb` | `periode_ppdbs` | Gelombang pendaftaran per unit + tahun ajaran |
| `PendaftarPpdb` | `pendaftar_ppdbs` | Data calon siswa, status proses, formulir JSON |
| `PersyaratanBerkas` | `persyaratan_berkas` | Daftar dokumen wajib/opsional per gelombang |
| `BerkasPpdb` | `berkas_ppdbs` | File yang diupload pendaftar |
| `TagihanPpdb` | `tagihan_ppdbs` | Invoice PPDB (pendaftaran + daftar ulang) |
| `PembayaranPpdb` | `pembayaran_ppdbs` | Record pembayaran dan bukti transfer |

### Field Penting

**PeriodePpdb:**
- `nama`, `tanggalBuka`, `tanggalTutup`, `isActive`
- `unitId` — opsional, bisa per jenjang
- `pengaturan` (JSON) — berisi `biayaPendaftaran`, `kuota`, `biayaDaftarUlang`

**PendaftarPpdb:**
- `noPendaftaran` — format `PPDB-2026-0001`, unique per tenant
- `namaLengkap`, `userId` (relasi ke akun wali)
- `dataFormulir` (JSON) — NISN, jenis kelamin, tempat/tanggal lahir, alamat, telepon
- `dataOrangtua` (JSON) — nama ayah/ibu, pekerjaan, telepon, email, penghasilan
- `status` — `MENUNGGU` | `TERVERIFIKASI` | `DITERIMA` | `DITOLAK`

**TagihanPpdb:**
- `jenis` — `PENDAFTARAN` atau `DAFTAR_ULANG`
- `nominal`, `status` (`BELUM_LUNAS` / `LUNAS`)

**BerkasPpdb:**
- `fileUrl`, `status` (`MENUNGGU` / `DITERIMA` / `DITOLAK`), `catatan`

### Relasi Antar Model

```
Tenant ──┬── PeriodePpdb ──── PersyaratanBerkas
         │        │
         │        └── PendaftarPpdb ──┬── BerkasPpdb
         │              │             │
         │              │             └── TagihanPpdb ── PembayaranPpdb
         │              │
         │              └── User (akun wali/orang tua)
         │
         └── Siswa (target sinkronisasi)
```

---

## Workflow State (Derived)

Sistem PPDB memakai **derived workflow state** — status operasional dihitung dari kombinasi data yang ada, bukan enum database tambahan. Helper utama: `derivePpdbWorkflow()` di `src/features/ppdb/lib/ppdb-workflow.ts`.

### 12 State Workflow

| # | State | Arti | Siapa yang Bertindak |
|---|-------|------|---------------------|
| 1 | `REGISTRATION_CREATED` | Pendaftaran baru dibuat | Pendaftar → buka invoice |
| 2 | `PAYMENT_PENDING` | Belum ada bukti bayar | Pendaftar → upload bukti |
| 3 | `PAYMENT_REVIEW` | Bukti bayar masuk | Admin → verifikasi pembayaran |
| 4 | `FULL_FORM_UNLOCKED` | Pembayaran valid, form terbuka | Pendaftar → mulai isi form |
| 5 | `FULL_FORM_IN_PROGRESS` | Form sedang diisi (draft) | Pendaftar → lengkapi & kirim final |
| 6 | `SUBMITTED_FOR_REVIEW` | Form sudah final submit | Admin → review berkas & data |
| 7 | `VERIFIED_READY_FOR_DECISION` | Berkas lolos verifikasi | Admin → putuskan diterima/ditolak |
| 8 | `REJECTED` | Tidak diterima | Proses selesai |
| 9 | `ACCEPTED_AWAITING_REENROLLMENT_BILL` | Diterima, belum ada tagihan daftar ulang | Admin → buat tagihan |
| 10 | `REENROLLMENT_PAYMENT_PENDING` | Tagihan daftar ulang belum lunas | Pendaftar → bayar daftar ulang |
| 11 | `READY_TO_SYNC` | Semua kewajiban selesai | Admin → sinkron ke siswa |
| 12 | `SYNCED_TO_STUDENT` | Sudah jadi siswa aktif | Proses PPDB selesai |

### Readiness Flags

Setiap snapshot workflow juga menyertakan flags granular:

| Flag | Fungsi |
|------|--------|
| `isRegistrationFeePaid` | Biaya formulir sudah lunas |
| `hasStartedFullForm` | Sudah mulai isi form lengkap |
| `hasSubmittedFullForm` | Form sudah kirim final |
| `requiredDocumentsUploadedCount` | Jumlah berkas wajib terupload |
| `requiredDocumentsApprovedCount` | Jumlah berkas wajib yang disetujui admin |
| `requiredDocumentsTotal` | Total berkas wajib yang dipersyaratkan |
| `hasRejectedRequiredDocument` | Ada berkas wajib yang ditolak |
| `isEligibleForVerification` | Siap diverifikasi admin |
| `isEligibleForAcceptance` | Siap diterima |
| `hasReenrollmentBill` | Tagihan daftar ulang sudah dibuat |
| `isReenrollmentPaid` | Daftar ulang sudah lunas |
| `isSyncedToStudent` | Sudah disinkron ke tabel Siswa |

---

## Sisi Orang Tua / Wali

### Halaman & Alur

#### 1. Landing Page PPDB (`/ppdb`)
- Halaman publik, tidak perlu login
- Menampilkan hero section dengan nama sekolah
- Grid gelombang pendaftaran yang sedang aktif (nama, unit, tanggal buka/tutup)
- Panduan 5 langkah cara mendaftar
- CTA ke registrasi akun (`/app/register`) dan login (`/app/login`)

#### 2. Dashboard Beranda (`/app/beranda`)
- Server-rendered, memakai `derivePpdbWorkflow()` langsung
- Jika belum ada pendaftaran: empty state + CTA "Mulai Pendaftaran"
- Jika sudah ada pendaftaran, menampilkan per anak:
  - **Kartu pendaftaran** dengan nama, nomor daftar, gelombang, unit
  - **Banner pengumuman** jika sudah ada hasil seleksi (diterima/ditolak)
  - **Panel workflow** — tahap saat ini, deskripsi, langkah berikutnya
  - **Progress bar** — persentase penyelesaian (0-100%)
  - **Stepper 7 tahap** — visual dot/line dari Form Singkat sampai Resmi Siswa
  - **CTA kontekstual** — "Bayar Formulir", "Lengkapi Formulir", "Lanjutkan Draft", "Bayar Daftar Ulang", dll
  - **Tombol Edit Data** — selama belum jadi siswa dan belum ditolak
- Mendukung **multi-pendaftaran** (satu wali bisa mendaftarkan beberapa anak)

#### 3. Form Singkat (`/app/ppdb/form-singkat`)
- Stepper 3 langkah (Form Singkat → Pembayaran → Form Lengkap & Review)
- Input: nama lengkap calon siswa + pilih gelombang (radio card)
- Gelombang di-fetch dari API, auto-select pertama jika belum dipilih
- Submit via server action `submitFormSingkat()`:
  - Cek duplikasi (jika sudah ada pendaftaran aktif di gelombang yang sama, lanjutkan)
  - Cek kuota gelombang
  - Generate nomor pendaftaran `PPDB-YYYY-NNNN`
  - Buat record `PendaftarPpdb` + `TagihanPpdb` (biaya formulir)
  - Transaksi Serializable + retry pada conflict
- Setelah sukses → redirect ke beranda

#### 4. Invoice / Pembayaran (`/app/ppdb/invoice/[id]`)
- Stepper lifecycle (Form Singkat → Pembayaran → Form Lengkap → Review Admin)
- Panel workflow (tahap saat ini, langkah berikutnya, status berkas/form)
- Detail invoice: nomor pendaftaran, tanggal terbit, deskripsi tagihan, nominal
- Status invoice: BELUM DIBAYAR / MENUNGGU VERIFIKASI / SUDAH LUNAS
- **Jika belum bayar:**
  - Daftar rekening bank sekolah (dari data master `Rekening`)
  - Form upload bukti transfer (preview gambar, kirim ke `/api/upload` lalu konfirmasi)
- **Jika menunggu verifikasi:**
  - Banner kuning "Bukti transfer sedang diverifikasi admin"
  - Link lihat bukti yang sudah dikirim
- **Jika sudah lunas:**
  - CTA "Lanjut Isi Formulir Lengkap" / "Lanjutkan Draft" / "Lihat Formulir"

#### 5. Form Lengkap (`/app/ppdb/form-lengkap/[id]`)
- **Gate:** jika tagihan formulir belum lunas → tampilkan pesan + CTA bayar
- Stepper lifecycle 4 tahap (Registrasi → Pembayaran → Form Lengkap → Review Admin)
- Panel workflow + readiness summary (form lengkap: draft/final, berkas wajib: x/y)
- **3 tab:**
  - **Data Siswa** — NISN, jenis kelamin, tempat/tanggal lahir, alamat, telepon
  - **Data Orang Tua** — nama/pekerjaan/telepon ayah & ibu, email keluarga, penghasilan
  - **Upload Berkas** — daftar persyaratan dari gelombang, status upload, badge wajib/opsional
- Helper banner per tab (judul + deskripsi kontekstual)
- Navigasi tab: Sebelumnya / Berikutnya
- **Dua mode submit:**
  - **Simpan Draft** — data tersimpan tanpa validasi ketat, bisa dilanjutkan nanti
  - **Kirim Final** — validasi lengkap, setelah ini admin bisa mulai review
- Upload berkas: file → `/api/upload` → sync ke `/api/ppdb/berkas`
- Setelah kirim final → redirect ke beranda

#### 6. Cek Status Publik (`/ppdb/status`)
- Halaman publik tanpa login
- Input nomor pendaftaran
- Menampilkan: label workflow, deskripsi, langkah berikutnya
- Tidak mengekspos data sensitif

---

## Sisi Admin

### Halaman & Alur

#### 1. Manajemen Gelombang (`/app/ppdb/periode`)
- DataTable gelombang pendaftaran (nama, unit, tahun ajaran, tanggal buka/tutup, status aktif)
- Modal form untuk buat/edit gelombang
- Pengaturan per gelombang: biaya pendaftaran, kuota, biaya daftar ulang

#### 2. Manajemen Persyaratan Berkas (`/app/ppdb/persyaratan`)
- DataTable persyaratan per gelombang
- Tambah/edit persyaratan: nama dokumen, wajib/opsional, tipe file yang diterima

#### 3. Meja Pendaftar (`/app/ppdb/pendaftar`)
- **Statistik operasional** — 8 kartu: Total, Pembayaran, Form Lengkap, Review Admin, Siap Keputusan, Pasca Diterima, Sudah Sinkron, Ditolak
- **Toolbar filter:**
  - Pencarian nama/nomor pendaftaran
  - Filter gelombang
  - Filter tahap workflow (Pembayaran, Form Lengkap, Review, Siap Keputusan, Pasca Diterima, Ditolak, Sudah Jadi Siswa)
  - Filter status database (Menunggu, Terverifikasi, Diterima, Ditolak)
  - Tombol reset
- **Tabel pendaftar** — kolom: Pendaftar (nama + no daftar), Gelombang, Formulir (bayar + form), Berkas (x/y disetujui), Tahap (workflow badge + status badge), Tanggal Daftar, Aksi (Review)
- **Pagination** — 20 per halaman, server-side
- API list memakai strategi 2-pass: query ringan untuk workflow → filter → query detail hanya untuk halaman aktif

#### 4. Detail Pendaftar (`/app/ppdb/pendaftar/[id]`)
Layout 2 kolom: data di kiri, panel aksi di kanan (sticky).

**Kolom Kiri — Data Pendaftar:**
- Komponen `PendaftarDetailInfoSections`:
  - Data siswa (nama, NISN, jenis kelamin, TTL, alamat, telepon)
  - Data orang tua (ayah & ibu: nama, pekerjaan, telepon, email, penghasilan)
  - Berkas — per dokumen: nama, status (badge), catatan, link file, dropdown approve/reject + input catatan

**Kolom Kanan — Panel Aksi:**

1. **Card Workflow PPDB**
   - Tahap saat ini (label + deskripsi + langkah berikutnya) dengan warna kontekstual
   - Readiness summary: biaya formulir, form lengkap, berkas wajib, daftar ulang, sinkron siswa
   - Blocker saat ini (daftar alasan kenapa belum bisa maju)

2. **Card Keputusan Verifikasi**
   - Dropdown ubah status (Menunggu → Terverifikasi → Diterima / Ditolak)
   - Indikator visual status yang dipilih
   - Tombol "Simpan Keputusan"

3. **Card Verifikasi Pembayaran** (muncul jika ada pembayaran pending)
   - Detail tagihan + nominal
   - Link lihat bukti transfer
   - Tombol Setujui / Tolak

4. **Card Info Tagihan**
   - Daftar tagihan (Biaya Formulir + Daftar Ulang) dengan nominal dan status

5. **Card Pengumuman Terkirim** (muncul jika sudah kirim pengumuman)
   - Status (DITERIMA/DITOLAK), pesan, jadwal daftar ulang, tanggal kirim

**Tombol Header:**
- **Kirim Pengumuman** — modal: pilih hasil (DITERIMA/DITOLAK), pesan, jadwal daftar ulang
- **Buat Tagihan Daftar Ulang** — modal: input nominal (pre-fill dari pengaturan gelombang)
- **Sinkronkan ke Siswa** — modal: pilih kelas (opsional), konfirmasi sinkron

#### 5. Meja Tagihan PPDB (`/app/ppdb/tagihan`)
- Fokus pada pendaftar pasca-diterima
- Statistik: total diterima, belum ada tagihan, menunggu pembayaran, siap sinkron, sudah sinkron
- Filter gelombang + tahap pasca-diterima
- CTA cepat ke detail pendaftar untuk generate tagihan, review pembayaran, atau sinkronisasi

---

## API Endpoints

### Pendaftar

| Endpoint | Method | Fungsi | Akses |
|----------|--------|--------|-------|
| `/api/ppdb/pendaftar` | GET | List pendaftar + workflow + stats + pagination | Admin |
| `/api/ppdb/pendaftar/[id]` | GET | Detail satu pendaftar + workflow snapshot | Admin / Wali (pemilik) |
| `/api/ppdb/pendaftar/[id]` | PUT | Update form lengkap (draft/final) | Wali (pemilik) |
| `/api/ppdb/pendaftar/[id]/verifikasi` | POST | Review berkas + ubah status | Admin |
| `/api/ppdb/pendaftar/[id]/sinkron` | POST | Sinkron ke tabel Siswa | Admin |
| `/api/ppdb/pendaftar/[id]/pengumuman` | POST | Kirim pengumuman hasil seleksi | Admin |
| `/api/ppdb/pendaftar/[id]/tagihan-daftar-ulang` | POST | Generate tagihan daftar ulang | Admin |

### Gelombang & Persyaratan

| Endpoint | Method | Fungsi | Akses |
|----------|--------|--------|-------|
| `/api/ppdb/periode` | GET | List gelombang (filter active) | Admin / Publik |
| `/api/ppdb/periode` | POST | Buat gelombang baru | Admin |
| `/api/ppdb/persyaratan` | GET/POST | CRUD persyaratan berkas | Admin |

### Pembayaran & Berkas

| Endpoint | Method | Fungsi | Akses |
|----------|--------|--------|-------|
| `/api/ppdb/invoice/[id]` | GET | Data invoice pendaftar | Wali (pemilik) |
| `/api/ppdb/invoice/[id]/konfirmasi` | POST | Kirim bukti pembayaran | Wali (pemilik) |
| `/api/ppdb/pembayaran/[id]/verifikasi` | POST | Approve/reject pembayaran | Admin |
| `/api/ppdb/berkas` | POST | Upload/simpan berkas pendaftar | Wali (pemilik) |
| `/api/ppdb/cek-status` | GET | Cek status publik via nomor daftar | Publik |

### Server Actions

| Action | File | Fungsi |
|--------|------|--------|
| `submitFormSingkat()` | `ppdb-actions.ts` | Registrasi awal + generate nomor + buat tagihan |
| `confirmPaymentManual()` | `ppdb-actions.ts` | Konfirmasi bayar manual (legacy) |
| `simulatePayment()` | `ppdb-payment-actions.ts` | Simulasi pembayaran untuk demo/testing |

---

## Rule Transisi Status

Backend menerapkan guard ketat pada setiap transisi:

| Rule | Penjelasan |
|------|-----------|
| Form lengkap terkunci jika tagihan formulir belum `LUNAS` | UI menampilkan gate + CTA bayar |
| Tidak bisa `TERVERIFIKASI` jika form belum final submit | Backend cek `isEligibleForVerification` |
| Tidak bisa `TERVERIFIKASI` jika berkas wajib belum lengkap atau ada yang ditolak | Cek jumlah + status berkas wajib |
| Tidak bisa `DITERIMA` jika belum `TERVERIFIKASI` | Cek `isEligibleForAcceptance` |
| Tidak bisa `DITERIMA` jika ada berkas wajib belum diterima | Semua berkas wajib harus status `DITERIMA` |
| Status `DITERIMA` dan `DITOLAK` bersifat final | Tidak bisa diubah kembali oleh pendaftar |
| Sinkron ke Siswa hanya untuk status `DITERIMA` | Backend reject jika status lain |
| Sinkron ditolak jika tagihan daftar ulang belum lunas | Cek tagihan `DAFTAR_ULANG` |
| Sinkron ditolak jika kuota siswa aktif tenant penuh | Cek via `hasAvailableStudentSlot()` |
| Sinkron ditolak jika sudah pernah disinkron | Cek `Siswa.dataTambahan.sumberPpdb` |

---

## Keamanan & Multi-Tenant

### Tenant Isolation
- Semua query PPDB di-scope dengan `tenantId`
- Update child record (berkas, pembayaran) memverifikasi relasi penuh: `tenantId` + `pendaftarId`
- Cross-tenant query hanya di area super-admin

### Role-Based Access
- **Admin pages:** role `ADMIN`, `PPDB`, `SUPER_ADMIN`
- **Wali pages:** role `WALI` / `USER`, hanya bisa akses data milik sendiri (`userId`)
- **Public pages:** tanpa auth (landing PPDB, cek status)

### Data Integrity
- Transaksi `Serializable` untuk registrasi dan sinkronisasi
- Retry logic (max 3x) untuk race condition (`P2002` unique constraint, `P2034` transaction conflict)
- Nomor pendaftaran: prefix-aware generator `PPDB-YYYY-NNNN` + retry pada conflict
- NIS siswa: prefix-aware generator `YYYYNNNN` + retry pada conflict

---

## Integrasi dengan Modul Lain

### Siswa
- Sinkronisasi menyalin data dari `PendaftarPpdb` → `Siswa`
- Field yang dipetakan: nama, NISN, jenis kelamin, TTL, alamat, telepon, data wali
- Metadata sinkron disimpan di `Siswa.dataTambahan`: `{ sumberPpdb: "PPDB-2026-0001", syncedAt: "..." }`
- Role akun wali **tidak diubah** saat sinkronisasi
- NIS di-generate otomatis

### Kuota Siswa (Subscription)
- Sebelum sinkron, sistem cek kuota siswa aktif tenant via `hasAvailableStudentSlot()`
- Jika kuota penuh → sinkron ditolak dengan pesan error

### Rekening Bank
- Invoice wali menampilkan daftar rekening bank sekolah dari data master `Rekening`

### Audit Log
- Setiap aksi admin (verifikasi, sinkron, konfirmasi bayar) dicatat di `LogAktivitas`

---

## Feature Layer

```
src/features/ppdb/
├── actions/
│   ├── ppdb-actions.ts          # submitFormSingkat, confirmPaymentManual
│   └── ppdb-payment-actions.ts  # simulatePayment
├── lib/
│   ├── ppdb-workflow.ts         # derivePpdbWorkflow(), 12 state, readiness flags
│   └── ppdb-identifiers.ts     # generator nomor pendaftaran & NIS, retry logic
└── components/
    └── PendaftarDetailInfoSections.tsx  # komponen detail data pendaftar untuk admin
```

---

## Halaman & Route Map

### Publik (tanpa login)
| Route | File | Fungsi |
|-------|------|--------|
| `/ppdb` | `src/app/ppdb/page.tsx` | Landing page PPDB |
| `/ppdb/status` | — | Cek status pendaftaran |

### Wali / Orang Tua
| Route | File | Fungsi |
|-------|------|--------|
| `/app/beranda` | `src/app/app/(portal)/(wali)/beranda/page.tsx` | Dashboard wali + kartu PPDB |
| `/app/ppdb/form-singkat` | `src/app/app/(portal)/(wali)/ppdb/form-singkat/page.tsx` | Registrasi awal |
| `/app/ppdb/invoice/[id]` | `src/app/app/(portal)/(wali)/ppdb/invoice/[id]/page.tsx` | Invoice + upload bukti bayar |
| `/app/ppdb/form-lengkap/[id]` | `src/app/app/(portal)/(wali)/ppdb/form-lengkap/[id]/page.tsx` | Form lengkap 3 tab |

### Admin
| Route | File | Fungsi |
|-------|------|--------|
| `/app/ppdb/periode` | `src/app/app/(portal)/(admin)/ppdb/periode/page.tsx` | Manajemen gelombang |
| `/app/ppdb/persyaratan` | `src/app/app/(portal)/(admin)/ppdb/persyaratan/page.tsx` | Manajemen persyaratan berkas |
| `/app/ppdb/pendaftar` | `src/app/app/(portal)/(admin)/ppdb/pendaftar/page.tsx` | Meja pendaftar + statistik |
| `/app/ppdb/pendaftar/[id]` | `src/app/app/(portal)/(admin)/ppdb/pendaftar/[id]/page.tsx` | Detail + review + aksi admin |
| `/app/ppdb/tagihan` | `src/app/app/(portal)/(admin)/ppdb/tagihan/page.tsx` | Meja tagihan daftar ulang |

---

## Status Implementasi

### Sudah Selesai ✅
- Landing page PPDB publik
- Registrasi awal (form singkat) + generate nomor pendaftaran
- Invoice + upload bukti pembayaran
- Form lengkap 3 tab (data siswa, orang tua, berkas) dengan draft/final
- Meja pendaftar admin dengan workflow filter + statistik + pagination
- Detail pendaftar admin dengan panel workflow, readiness, blocker
- Review berkas admin (approve/reject per dokumen)
- Verifikasi pembayaran admin
- Kirim pengumuman hasil seleksi
- Generate tagihan daftar ulang
- Sinkronisasi ke tabel Siswa dengan NIS otomatis
- Dashboard beranda wali dengan kartu PPDB + stepper 7 tahap
- Derived workflow state (12 state + readiness flags)
- Backend hardening: tenant safety, transition rules, retry logic
- Generator nomor aman (prefix-aware + retry)
- Kuota siswa enforcement pada sinkronisasi
- Audit logging

### Belum Selesai / Roadmap 🔄
- Penyelarasan copy workflow di semua surface wali yang belum disentuh
- Evaluasi apakah milestone pasca-diterima perlu dipersist sebagai field eksplisit
- Counter/sequence khusus untuk tenant besar
- QA end-to-end pada flow admin review sampai sinkronisasi
- Notifikasi email/WhatsApp pada perubahan status
- Laporan/reporting PPDB
- Batch operations admin (terima/tolak massal)
- Keputusan produk: aksi inline di meja tagihan vs triase ke detail pendaftar
