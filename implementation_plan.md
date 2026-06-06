# Migrasi Komprehensif ke Shadcn UI (Tombol & Form)

Tujuan dari optimasi ini adalah untuk memastikan 100% konsistensi komponen antarmuka pengguna (UI) di seluruh aplikasi SchoolPro SaaS, baik di *dashboard* internal maupun di *Landing Page* publik. Saat ini, tabel dan *empty state* sudah 100% menggunakan Shadcn UI, namun masih ada banyak elemen formulir dan tombol yang menggunakan elemen HTML standar (native).

## Latar Belakang & Statistik Saat Ini
Berdasarkan hasil pemindaian di folder `src/`, ditemukan elemen HTML native berikut yang perlu di-migrasi:
- **`~140`** tag `<button>`
- **`~60`** tag `<input>`
- **`~37`** tag `<select>`
- **`~11`** tag `<textarea>`

## Open Questions

> [!IMPORTANT]
> **Keputusan Cakupan Migrasi**
> Apakah migrasi ini juga perlu menyertakan halaman publik/situs sekolah (`src/app/site/...`)? Beberapa halaman publik (*landing page*) memiliki gaya tombol atau form yang spesifik (custom desain landing page). Apakah sebaiknya kita fokus menyelesaikan 100% untuk modul **Dashboard (Admin, GTK, Siswa, Super Admin, Affiliate)** terlebih dahulu, atau langsung kita sikat habis semuanya termasuk halaman publik? Saran saya: kita selesaikan seluruh Dashboard terlebih dahulu untuk meminimalisasi risiko terganggunya UI Landing Page publik. Bagaimana menurut Anda?

> [!WARNING]
> **Migrasi tag `<select>` ke Shadcn `<Select>`**
> Tag `<select>` HTML bawaan sangat mudah digunakan, sementara `<Select>` Shadcn lebih kompleks (membutuhkan `SelectTrigger`, `SelectValue`, `SelectContent`, `SelectItem`). Migrasi otomatis untuk `<select>` berisiko memecahkan *state binding* di React/React Hook Form jika tidak hati-hati. Apakah Anda setuju jika untuk tag `<select>` kita lakukan migrasi semi-otomatis/manual secara bertahap (per fitur)?

## Proposed Changes

Proses migrasi ini akan dibagi menjadi beberapa tahap agar sistem aplikasi tetap aman dari *error* fatal saat *build*.

### Tahap 1: Migrasi Komponen `<button>`
Mengganti tag HTML `<button>` menjadi `<Button>` bawaan Shadcn UI.
- Semua atribut seperti `onClick`, `disabled`, `type="submit"` akan dipindahkan ke `<Button>`.
- *Class Tailwind* yang ada akan dipetakan ke *props* `variant` dan `size` Shadcn sebisa mungkin (misalnya mengubah warna merah menjadi `variant="destructive"`), atau disisipkan ke dalam `className`.
- Fokus utama pada direktori: `src/app/(dashboard)`, `src/app/(super-admin)`, `src/app/(affiliate)`, dan `src/components/shared/`.

### Tahap 2: Migrasi Komponen `<input>` dan `<textarea>`
Mengganti elemen form standar menjadi `<Input>` dan `<Textarea>` dari Shadcn UI.
- Memastikan *binding* seperti `onChange`, `value`, atau register dari `react-hook-form` tidak terputus.
- Konsistensi gaya *border*, *focus ring*, dan radius sudut.

### Tahap 3: Standarisasi `<select>` (Jika disetujui)
Mengubah `<select>` standar yang jelek secara visual menjadi `<Select>` *Dropdown* Shadcn yang premium, memiliki animasi transisi, dan *scroll-area* yang bersih.

### Tahap 4: Pemeriksaan Menyeluruh (Lint & Build)
- Menjalankan `eslint` dan memperbaiki *warning* import (seperti pastikan `import { Button } from "@/components/ui/button"` selalu ada).
- Menjalankan `npx next build` lokal untuk memastikan tidak ada *Compile Error*.

## Verification Plan

1. **Automated Codemod Run**: Kita akan menggunakan skrip Node.js untuk mendeteksi *pattern* dan melakukan sebagian besar *refactor* (mirip saat kita mengoptimalkan tabel).
2. **Kompilasi Lokal (Build Check)**: `npm run build` wajib sukses tanpa henti (100% Passed) sebelum kita *Push*.
3. **Manual Check by User**: Anda bisa memeriksa halaman-halaman yang sering dipakai (misal: halaman Form Pendaftaran, Halaman Tagihan, dan Halaman Edit Siswa) untuk melihat *feel* UX dari komponen Shadcn yang baru.
