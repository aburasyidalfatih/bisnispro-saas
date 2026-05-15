# Enterprise Financial Integrity & Payment Gateway Report: SchoolPro SaaS

> [!CAUTION]
> **Tujuan Dokumen:** Evaluasi tingkat keparahan logika finansial (*Fintech Assurance*) pada proses mutasi saldo dompet, pembayaran *Invoice*, dan sinkronisasi *Webhook Payment Gateway* (Tripay). Kegagalan menangani ini akan berujung pada kerugian finansial nyata (sekolah kehilangan uang, atau saldo "hantu").

## 1. Executive Financial Summary

- **Fintech Reliability Score:** **4.0 / 10**
- **Status:** **Rentan Terhadap Manipulasi Konkurensi & Kerusakan Presisi Uang**

**Top 3 Financial Catastrophes:**
1. **IEEE 754 Floating Point Error:** Skema database Anda saat ini menggunakan tipe data `Float` untuk `balance` (dompet), `amount` (tagihan), dan `Cashflow`. Tipe `Float` tidak pernah boleh digunakan untuk uang karena akan memunculkan nilai desimal tidak akurat (misal `100.1 + 0.2 = 100.30000000000001`).
2. **Webhook Idempotency Race Condition (Double-Spend):** Pada rute `payment.ts`, *Webhook* memeriksa status tagihan di memori (`if (payment.status === "paid") return`). Jika sistem menerima 2 *Webhook* Tripay pada milidetik yang sama, KEDUANYA akan lolos pengecekan ini dan memproses Top-Up Saldo Dompet secara ganda untuk satu kali pembayaran!
3. **Non-Atomic Balances Update:** Saldo pengguna ditambahkan dengan rumus di memori: `const newBalance = wallet.balance + amount` lalu di-`update` ke DB. Jika pengguna mengklik "Bayar" dua kali dengan cepat, aplikasi akan membaca saldo lama yang sama, dan menimpa saldo baru secara tidak konsisten.

---

## 2. Financial Logic & State Audit

| Kategori Evaluasi | Temuan di Kode / Skema | Risiko Moneter | Strategi Pencegahan |
| :--- | :--- | :---: | :--- |
| **Floating Point & Currency Precision** | Skema Prisma: `balance Float`, `amount Float` | 🔴 Kritis | Tipe data harus dimigrasi ke `Int` (simpan dalam Rupiah penuh/sen) atau `Decimal`. |
| **Race Conditions (Double Spend)** | TopUp dompet (`wallet-admin.ts`) dan Webhook Tripay menggunakan penambahan di level aplikasi (`wallet.balance + amount`). | 🔴 Kritis | Gunakan operasi *Atomic* Prisma: `balance: { increment: payment.amount }`. |
| **Webhook Idempotency** | Idempotensi dilakukan melalui proses *read-then-check*. Gagal menahan serangan konkuren berintensitas tinggi (*Concurrent Requests*). | 🟡 Sedang | Gunakan *Optimistic Concurrency Control* via `updateMany` dengan klausa `where: { status: "pending" }`. |
| **Audit Trail & Rollback** | Transaksi Webhook Tripay (`payment.ts`) tidak dibungkus dalam `$transaction`. Jika pembuatan *Log* riwayat gagal, saldo dompet tetap bertambah tanpa rekam jejak! | 🟡 Sedang | Seluruh mutasi uang (Update Wallet + Create Log) WAJIB berada di dalam blok `db.$transaction`. |

---

## 3. Deep Dive: Race Condition Scenario

### Skenario: Serangan *Double-Spend* pada Webhook
1. User A top-up Rp 100.000 via Tripay.
2. Tripay mengalami kendala jaringan dan melakukan *retry* *Webhook* 2 kali hampir bersamaan (Beda 10 milidetik).
3. Rute *Webhook* mengeksekusi `db.payment.findUnique` untuk Webhook 1 dan Webhook 2.
4. Karena keduanya membaca database di saat yang sama, status `payment` di database masih `"pending"`.
5. Kedua proses melewati blok asersi `if (payment.status === 'paid') skip()`.
6. Keduanya mengeksekusi blok mutasi `wallet.balance + 100000`.
7. **Hasil Akhir:** Saldo User A bertambah Rp 200.000 padahal ia hanya mentransfer Rp 100.000. Sistem merugi Rp 100.000.

**Refactor (Optimistic Idempotency Check):**
```typescript
// Lakukan UPDATE langsung sebagai LOCK
const updated = await db.payment.updateMany({
  where: { id: payment.id, status: "pending" }, // Hanya update jika masih pending
  data: { status: "paid" }
})

// Jika count 0, artinya webhook lain yang beda milidetik sudah meng-update ini duluan!
if (updated.count === 0) {
  logger.info("Webhook sudah diproses thread lain secara konkuren.");
  return null; 
}
```

---

## 4. Financial Remediation Roadmap

Langkah aman yang diusulkan untuk tim *Fintech*:

- **Fase 1: Concurrency Fixes & Atomic Updates (H+1)**
  - Menambal rute *Webhook Tripay* (`payment.ts`) dengan pola *Optimistic Concurrency Control* (`updateMany`).
  - Mengubah logika perhitungan di `wallet-admin.ts` dan `finance-service.ts` menjadi operasi *Atomic Increment/Decrement* serta membungkusnya dalam transaksi (`$transaction`).

- **Fase 2: Floating Point Eradication (H+2)**
  - Karena mengubah tipe `Float` ke `Int` di PostgreSQL produksi memerlukan modifikasi data yang hati-hati, segera eksekusi sinkronisasi *migration* untuk mengubah semua kolom `Float` ke `Decimal` / `Int`.

- **Fase 3: Strict Validations (H+3)**
  - Menggunakan tipe validasi Zod ketat (`z.number().int().positive()`) pada semua input yang berkaitan dengan nilai nominal tagihan (memastikan tidak ada input desimal atau negatif yang masuk).
