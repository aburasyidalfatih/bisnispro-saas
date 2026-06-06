# Rencana Perbaikan Bentrok Warna (Color Clash) Shadcn Button

Berdasarkan analisis dari *screenshot* yang Anda kirimkan, saya menemukan akar masalah mengapa ada elemen yang warnanya berantakan (seperti teks abu-abu di atas *background* biru sehingga sulit dibaca).

## Analisis Masalah
Saat kita mengganti tag HTML `<button>` menjadi komponen `<Button>` bawaan Shadcn UI, komponen tersebut secara otomatis mengaktifkan gaya dasar `variant="default"` (yaitu *background* biru primer dan teks putih). 
Namun, di banyak halaman, tag `<button>` awalnya digunakan sebagai **elemen struktural** (seperti *Card* yang bisa diklik, tombol *Toggle*, atau daftar menu). Elemen-elemen ini memiliki *class* warna kustom dari Tailwind. Gabungan antara `variant="default"` Shadcn dan *class* kustom ini menyebabkan **bentrok warna**.

**Contoh Kasus:**
1. **Pilih Provider Storage**: Tombol "Lokal (VPS Disk)" yang tidak aktif mendapat *class* `text-muted-foreground` (abu-abu), tetapi tetap mewarisi *background* biru dari Shadcn. Hasilnya: teks abu-abu di atas biru (tidak terbaca).
2. **Toggle Fitur & Keamanan**: Teks "Login Sebagai User" menjadi putih di atas *background* terang karena tertabrak kelas `bg-primary/5` dan warna *default* Shadcn.
3. **List Email Edukasi**: Item menu yang tidak aktif mewarisi *background* biru, sedangkan teksnya di-set abu-abu, menghasilkan kotak biru gelap yang teksnya tidak terlihat.

## Open Questions

> [!IMPORTANT]
> **Pendekatan Solusi**
> Ada dua cara untuk memperbaiki ini:
> 1. **(Sangat Direkomendasikan) Injeksi `variant="outline"` / `variant="ghost"`:** Kita akan menambahkan atribut `variant="outline"` pada semua komponen `<Button>` yang berfungsi sebagai "Card/List item yang bisa diklik" dan memiliki kombinasi *class* kondisional kompleks. Ini akan menghilangkan *background* biru bawaan Shadcn sehingga warna kustom Anda kembali terlihat bersih dan sempurna.
> 2. **Kembalikan ke `<button>` HTML:** Untuk elemen yang murni struktural (seperti *Card* besar), kita kembalikan saja tag `<Button>` ke `<button>` HTML murni.
> 
> Saya merekomendasikan **Opsi 1** agar *accessibility* (aksesibilitas fokus) dan animasi bawaan Shadcn tetap terjaga. Apakah Anda setuju dengan pendekatan ini?

## Proposed Changes

### 1. `src/app/(super-admin)/super-admin/settings/_components/storage-tab.tsx`
- Menambahkan atribut `variant="outline"` pada kedua `<Button>` ("Lokal" dan "S3").
- Menghapus kelas `border-2` jika sudah dicakup oleh `outline`.

### 2. `src/app/(super-admin)/super-admin/settings/_components/general-tab.tsx`
- Menambahkan `variant="outline"` pada ketiga tombol sakelar (Login Sebagai User, Custom Domain, Block Indexing).

### 3. `src/app/(super-admin)/super-admin/educational-emails/page.tsx`
- Mengganti varian `<Button>` di menu "Urutan Pengiriman" menjadi `variant="ghost"`.

### 4. Sweeping Menyeluruh (Global)
- Saya akan memindai secara otomatis seluruh file di area *Dashboard* yang memiliki pola serupa: `<Button` yang membungkus elemen kompleks (`flex-col`, *icon* besar) dengan logika *className* `cn(...)`.
- Semua tombol dengan pola tersebut akan disuntikkan properti `variant="outline"` atau `variant="ghost"`.

## Verification Plan
Setelah eksekusi skrip perbaikan, saya akan menjalankan `npx next build` lagi untuk memastikan semuanya tetap hijau, lalu Anda bisa melakukan tes pratinjau visual sebelum *merge* lagi.
