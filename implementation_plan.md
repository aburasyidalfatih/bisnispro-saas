# Rencana Pemindaian & Perbaikan Sisa UI Button

Berdasarkan analisis skrip yang baru saja saya jalankan, saya menemukan **63 titik potensial** di mana konversi global dari `<button>` HTML menjadi `<Button>` Shadcn berpotensi merusak desain visual (*layout/styling*).

## Temuan Potensi Masalah

1. **Tombol Struktural / Card (57 titik)**
   Contohnya pada halaman **Pesan Website Publik** (`website-messages.tsx`), tombol digunakan sebagai pembungkus akordion (`<Button className="flex w-full..."><div...><p...></Button>`). 
   *Masalah*: Shadcn menambahkan *background* biru solid dan *padding* bawaan (`px-4 py-2`) yang menghancurkan struktur asli *card/accordion*.

2. **Tombol Ikon Tunggal (5 titik)**
   Tombol yang hanya berisi ikon (contoh: `<Trash>`, `<Info>`) tanpa parameter `variant`.
   *Masalah*: Akan dirender sebagai kotak besar berwarna biru solid, bukan sekadar ikon yang rapi.

3. **Tombol Link Teks (1 titik)**
   Tombol dengan kelas `hover:underline`.
   *Masalah*: Akan dirender sebagai balok biru besar alih-alih teks tautan biasa.

## Rencana Aksi (Otomatisasi Skrip)

Saya akan membuat skrip *codemod* spesifik (Node.js) untuk memperbaiki 63 titik ini dengan aturan:

1. **Tombol Struktural**: Jika `<Button>` membungkus tag `<div`, `<p`, atau `span className="flex`, kita akan **merestorasinya kembali menjadi elemen HTML bawaan `<button>`**. Ini adalah *best practice* karena Shadcn `<Button>` memang tidak didesain untuk menjadi wadah struktur HTML kompleks.
2. **Tombol Ikon Tunggal**: Menyuntikkan properti `variant="ghost" size="icon"` agar menjadi ikon transparan yang cantik sesuai standar Shadcn.
3. **Tombol Teks**: Menyuntikkan properti `variant="link" className="p-0 h-auto"` agar kembali menjadi teks biasa.

> [!TIP]
> Restorasi tombol struktural kembali ke `<button>` murni akan mengembalikan UI persis 100% seperti desain *Tailwind* awal Anda, tanpa menghilangkan nuansa Shadcn pada tombol-tombol utama (*submit*, aksi, *form*).

Jika Anda setuju dengan pendekatan ini, silakan beri persetujuan, dan saya akan langsung mengeksekusi skrip globalnya!
