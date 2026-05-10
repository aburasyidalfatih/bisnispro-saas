"Saya ingin kamu bertindak sebagai **Fintech Architect & Transaction Assurance Lead** untuk mengevaluasi sistem dompet digital, SPP, dan pembayaran (Payment Gateway) pada platform SaaS saya (SchoolPro). Karena ini menyangkut perputaran uang asli ribuan orang tua dan sekolah, tingkat toleransi kesalahan adalah 0%.

Lakukan audit logika finansial secara ketat terhadap semua mutasi saldo, tagihan, dan pembayaran. Buatkan **Dokumen Laporan Audit Integritas Finansial** yang membedah kelemahan kode dalam menangani uang.

Susun dokumen dengan struktur:

## 1. Executive Financial Summary
- **Fintech Reliability Score:** (Skor 1-10) menilai kesiapan sistem menangani transaksi serentak ratusan sekolah saat tanggal jatuh tempo tagihan.
- **Top 3 Financial Catastrophes:** Tiga celah fatal yang berpotensi menghilangkan uang pengguna atau menimbulkan "uang hantu".

## 2. Financial Logic & State Audit (Tabel Audit Keuangan)
Sajikan dalam **Tabel Audit** (Kategori, Temuan, Risiko Moneter, Pencegahan). Kategori wajib:
- **Race Conditions (Double Spend):** Jika tombol 'Top Up' atau 'Bayar' diklik berulang kali oleh *bot* atau *user* secara bersamaan (milidetik), apakah sistem memotong saldo 2x? Apakah database menggunakan *Atomic Updates* (`increment/decrement`) atau transaksi (*Prisma Interactive Transactions*)?
- **Floating Point & Currency Precision:** Apakah saldo uang disimpan dalam format `Float` (Berbahaya! Rawan *Precision Error*) atau `Int`/`Decimal`?
- **Webhook Idempotency:** Jika *Payment Gateway* mengirimkan sinyal *Webhook* "LUNAS" sebanyak 3 kali karena kegagalan *network*, apakah sistem Anda mencatat saldo masuk 3 kali, atau hanya 1 kali (*Idempotent*)?
- **Audit Trail & Rollback:** Jika mutasi pembayaran gagal di tengah jalan, apakah saldo yang sudah terpotong dikembalikan (*rollback*) secara otomatis?

## 3. Deep Dive: Race Condition Scenario
- Simulasikan skenario *"Double-Spend Attack"* yang umum terjadi di sistem dompet (*wallet*) yang tidak dioptimasi.

## 4. Financial Remediation Roadmap
- **Fase 1: Database Atomic Transactions (H+1 - H+3)**
- **Fase 2: Webhook Idempotency & Float Fixes (H+4 - H+7)**

Gunakan *GitHub Flavored Markdown* dan simpan sebagai `README_FINANCE_AUDIT.md`."
