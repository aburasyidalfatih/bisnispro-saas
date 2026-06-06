# Walkthrough: Perbaikan Tambahan UI (Ikon & Toggle)

Berdasarkan pengecekan mendalam terhadap elemen-elemen UI kecil lainnya, masalah yang Anda laporkan (seperti tombol mata dan toggle/sakelar notifikasi) terjadi karena komponen struktur kustom tersebut tanpa sengaja terbungkus oleh *padding* dan *background* bawaan dari komponen `<Button>` Shadcn. 

## Apa yang Telah Diperbaiki?

1. **Ikon Mata (Password Reveal / Detail) di 11 File Berbeda:**
   - **Masalah:** Ikon mata `<Eye>` / `<EyeOff>` memiliki *background* solid berupa kotak biru toska/primer.
   - **Solusi:** Saya telah menyuntikkan `variant="ghost" size="icon"` ke semua tombol bermata tunggal ini secara global. Kini tampilannya kembali transparan dan hanya merespons saat di-*hover*.

2. **Toggle Switch Custom (Notifikasi & Presensi Selfie):**
   - **Masalah:** Sakelar *toggle* untuk channel In-App, Email, dan WhatsApp (serta presensi guru) bentuknya membesar menjadi kotak tebal berwarna toska akibat bentrok kelas Shadcn.
   - **Solusi:** Saya merestorasi elemen `<Button role="switch">` kembali menjadi elemen `<button>` HTML bawaan secara spesifik. Karena desain sakelar Anda menggunakan *Tailwind styling* internal yang sangat presisi, merestorasinya adalah solusi paling aman dan akurat 100% dengan desain semula.

3. **Tombol Teks Link (Tandai Semua):**
   - **Masalah:** Tombol "Tandai semua" pada *dropdown* notifikasi berubah menjadi tombol solid besar.
   - **Solusi:** Mengonversinya menjadi `variant="ghost"` serta menghapus *padding* kustom berlebih.

Seluruh 15 titik *error* kecil ini (tersebar di *Dashboard*, *Ortu*, *Siswa*, dan *Super Admin*) telah berhasil saya perbaiki tanpa mengubah logika bisnis, dan kode sudah ter-*push* sepenuhnya.
