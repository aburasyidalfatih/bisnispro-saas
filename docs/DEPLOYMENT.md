# Panduan Deployment SchoolPro (Docker + GHCR Architecture)

Dokumen ini menjelaskan alur deployment terbaru yang telah dioptimasi menggunakan **GitHub Actions (Self-Hosted Runner di PC Lokal)** dan **GitHub Container Registry (GHCR)**. Arsitektur ini menjamin VPS Anda aman dari *Out of Memory* sekaligus menghapus biaya *billing* GitHub Actions.

## 1. Arsitektur & Lingkungan
| Lingkungan | Domain / URL | Cara Deploy | Variabel Lingkungan Utama |
| :--- | :--- | :--- | :--- |
| **Local Dev** | `localhost:3000` | `npm run dev` | `NEXT_PUBLIC_ROOT_DOMAIN="localhost"` |
| **Development VPS** | `schoolpro.my.id` | **Otomatis** (Push ke `develop`) | `NEXT_PUBLIC_ROOT_DOMAIN="schoolpro.my.id"` |
| **Production VPS** | `schoolpro.id` | **Otomatis** (Merge ke `main`) | `NEXT_PUBLIC_ROOT_DOMAIN="schoolpro.id"` |

> [!IMPORTANT]
> Sistem *routing multi-tenant* bergantung pada variabel `NEXT_PUBLIC_ROOT_DOMAIN` di file `.env` server Anda. Pastikan ini diatur dengan benar agar deteksi subdomain berfungsi.

## 2. Alur Kerja (Workflow) CI/CD Terbaru

Seluruh proses kompilasi kode (NPM Install & Next.js Build) kini dilakukan oleh **PC Lokal Anda (Self-Hosted Runner)**, bukan di VPS maupun Server GitHub.

### A. Deployment ke Lingkungan Development (`develop`)
Proses ini berjalan 100% otomatis:
1. Lakukan *commit* dan *push* ke branch `develop`.
2. PC Anda (Runner) akan otomatis mem-*build* Docker Image.
3. Image yang sudah jadi diunggah ke GHCR secara tertutup.
4. PC Anda akan masuk ke VPS secara siluman via *Native SSH* dan memerintahkan VPS untuk mengunduh (*pull*) image tersebut.
5. VPS akan me-restart container `app` (Tanpa menjalankan ulang WA Gateway).

### B. Deployment ke Lingkungan Production (`main`)
Deployment ke `main` kini juga **Otomatis** setelah branch digabungkan:
1. Pastikan fitur dari `develop` sudah stabil dan di-*merge* ke branch `main`.
2. Setelah *Merge*, PC Anda (Runner) akan menangkap antrean dan meracik Docker Image untuk *Production*.
3. Image diunggah ke GHCR dengan *tag* terbaru.
4. PC Anda memerintahkan VPS untuk me-*restart* seluruh layanan (`docker compose up -d app db redis wa-gateway`). 
5. *(Catatan: `wa-gateway` didesain untuk otomatis menyala eksklusif di Production agar terhubung ke server WhatsApp aktif).*

### C. Manual Build di VPS (Darurat / Troubleshooting)
Jika GitHub Actions sedang gangguan, Anda tetap bisa melakukan update manual:
1. Akses VPS via SSH.
2. Masuk ke folder: `cd /home/ubuntu/schoolpro-prod` (atau `-dev`).
3. Lakukan login GHCR: `docker login ghcr.io -u <username_github>` (masukkan Personal Access Token Anda).
4. Jalankan `docker compose pull app`.
5. Restart aplikasi: `docker compose up -d`.

## 3. Menjalankan di Lokal (Local Development)

### Mode Pengembangan Cepat (Hot Reload)
Gunakan mode ini untuk membuat fitur baru atau mengedit UI.
```bash
npm run dev
```

### Menguji Docker di Lokal
Jika ingin menjalankan environment persis seperti server:
```bash
docker compose up -d --build
```
*(Catatan: Anda tetap bisa mem-build lokal dengan perintah di atas. Override `image` di docker-compose.yml tidak akan menghalangi fungsi build lokal).*

## 4. Aturan Emas Arsitektur
1. **Runner Wajib Aktif:** Pastikan PowerShell di PC Anda menjalankan `.\run.cmd` sebelum melakukan `git push` atau `merge`. Jika aplikasi ini mati, tugas *deploy* dari GitHub akan berstatus `Queued` dan menggantung.
2. **Kinerja WA Gateway:** Modul WhatsApp (Baileys) telah dibekali dengan sistem *Lazy Connection* (Tidur Otomatis saat 1 jam menganggur) dan *History Pruning*. Ini memastikan RAM VPS Anda aman meski menangani ratusan *tenant*.
3. **Dynamic Alias:** Kita menggunakan teknik alias dinamis (`${APP_ALIAS}`) agar satu file `docker-compose.yml` bisa dipakai secara bersamaan oleh environment Dev dan Prod tanpa bentrok rute jaringan Nginx.
4. **Keamanan Script:** Baris perintah (*Bash*) untuk mengeksekusi VPS dikirim secara teliti menggunakan format penulisan Windows (*LF Line Endings*) agar Linux VPS tidak gagal memahaminya.

---
*Diperbarui: Mei 2026 - Optimized with Self-Hosted Runner, Native SSH & WA Gateway Enterprise Architecture*

Contoh perintah untuk berpindah direktori:

powershell
cd C:\actions-runner
Jalankan perintah berikut untuk menghubungkan runner ke server GitHub:

powershell
.\run.cmd