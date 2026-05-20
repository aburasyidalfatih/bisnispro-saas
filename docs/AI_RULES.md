# Aturan Utama AI Agent (SchoolPro SaaS)

Anda adalah AI Assistant yang ditugaskan untuk membantu pengembangan aplikasi SchoolPro. **SEBELUM** mengeksekusi perintah apapun, Anda WAJIB membaca dan mematuhi aturan-aturan di bawah ini.

## 🛠️ Tech Stack Proyek
- **Framework Utama**: Next.js (Gunakan pola App Router, BUKAN Pages Router)
- **Bahasa Pemrograman**: TypeScript (Selalu gunakan typing yang ketat)
- **Database ORM**: Prisma
- **Database Engine**: PostgreSQL
- **Styling**: Tailwind CSS (Gunakan utility classes, hindari custom CSS eksternal jika memungkinkan)
- **Authentication**: NextAuth.js / Auth.js (v5 beta)

---

## 🤖 Perilaku Wajib AI Agent

### 1. DILARANG MENEBAK (NO HALLUCINATION)
Jika instruksi user terlalu luas, tidak spesifik, atau Anda tidak tahu persis file mana yang harus diubah: **BERHENTI DAN TANYAKAN KLARIFIKASI**. 
Jangan pernah mencoba menebak atau merombak arsitektur tanpa persetujuan eksplisit.
*Contoh respon yang benar: "Permintaan Anda terlalu luas. Apakah Anda ingin saya fokus pada komponen UI-nya dulu atau langsung membuat skema database-nya?"*

### 2. MICRO-TASKING (Pecah Tugas)
Jangan menulis ratusan baris kode sekaligus dalam satu waktu. Jika user meminta fitur besar (misal: "Buat fitur pembayaran"), buatkan **Rencana Implementasi (Implementation Plan)** terlebih dahulu dan kerjakan selangkah demi selangkah (contoh: Skema DB dulu -> API Route -> UI).

### 3. FOKUS PADA ERROR LOG
Jika user melaporkan error, minta user untuk memberikan salinan (copy-paste) dari log error asli yang ada di terminal atau konsol browser. Jangan mencoba mencari solusi hanya berdasarkan deskripsi awam.

### 4. BACA SEBELUM MENGEDIT
Sebelum melakukan modifikasi file, gunakan alat pembaca file (`view_file` atau `cat`) untuk memahami konteks yang sudah ada. Jangan menghapus logika bisnis yang sudah dibuat user tanpa izin.

### 5. KEAMANAN DATA (SECURITY FIRST)
Jangan pernah mengekspos kredensial, API key, password database, atau isi dari file `.env` di dalam riwayat chat, log, atau commit message.

### 6. PENGGUNAAN LIBRARY
Gunakan hanya ekosistem library yang sudah terpasang di `package.json`. Dilarang menginstal library pihak ketiga berukuran besar (seperti Redux, jQuery, Material-UI) kecuali user secara spesifik memintanya.

---

## 🚀 Deployment & Infrastruktur (WAJIB DIBACA)
Proyek ini sekarang SEPENUHNYA menggunakan arsitektur **Docker Multi-stage Build** dan Nginx Reverse Proxy. AI Wajib mematuhi aturan arsitektur ini:
1. **Dilarang Menyarankan PM2:** Sistem tidak lagi menggunakan PM2 atau eksekusi `node server.js` secara manual di host. Semua berjalan di dalam container.
2. **Cara Menjalankan Lokal:** Gunakan `docker compose up -d` untuk menjalankan database dan Nginx, namun untuk development aplikasi tetap gunakan `npm run dev` di host agar Hot Reloading berfungsi.
3. **Konfigurasi Lingkungan:** Selalu arahkan koneksi antar service menggunakan internal Docker network (contoh: `DATABASE_URL` menggunakan host `db` di `docker-compose.yml`, bukan `localhost`).
4. **CI/CD Pipeline:** Deployment dilakukan secara otomatis melalui GitHub Actions yang akan melakukan SSH ke VPS dan mengeksekusi `docker compose build app` lalu `docker compose up -d`. Jangan menyarankan script deployment manual.
