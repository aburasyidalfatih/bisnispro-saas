# Enterprise Security Pentest Report: SchoolPro SaaS

> [!CAUTION]
> **Tujuan Dokumen:** Evaluasi kelemahan keamanan kritis (Vulnerability Assessment & Penetration Testing) pada kerangka kerja SchoolPro. Kegagalan menambal celah ini dapat menyebabkan kebocoran data sekolah lain, manipulasi tagihan, atau pengambilalihan akun Super Admin.

## 1. Executive Security Summary

- **SaaS Security Score:** **6.0 / 10**
- **Status:** **Rentan Terhadap Eskalasi Hak Akses (IDOR) & Serangan Eksternal**

**Top 3 Critical Vulnerabilities:**
1. **Broken Access Control (IDOR) pada Operasi Update/Delete:** Beberapa API rute (seperti `api/students/[id]`) menggunakan `db.student.update({ where: { id } })` tanpa menyertakan validasi `tenantId`. Hal ini memungkinkan pengguna dari "Sekolah A" untuk memanipulasi data "Sekolah B" hanya dengan menebak parameter `id`.
2. **Inkonsistensi Validasi Payload (Zod Bypass):** Beberapa Server Actions dan API Rute belum menerapkan validasi *strict* via Zod untuk *request body*, membuka peluang eksploitasi tipe data dan manipulasi atribut (*Mass Assignment*).
3. **Potensi Cross-Tenant Role Mixing:** Session validasi mengandalkan `requireTenantAccess(tenantId)`, yang memastikan *user* adalah anggota sekolah. Namun, lapisan database (Prisma) tidak otomatis membatasi mutasi jika `tenantId` pada kueri `update/delete` dilupakan oleh *developer*.

---

## 2. Threat Vector Analysis

| Kategori Serangan | Temuan Saat Ini | Tingkat Keparahan | Cara Exploitasi |
| :--- | :--- | :---: | :--- |
| **Broken Access Control (IDOR)** | Rute `PATCH /api/students/[id]` mengubah data hanya berdasar `id`. Prisma `update()` tidak dicegat oleh App-Level `withTenant`. | 🔴 Kritis | Penyerang mengirim *request* valid di sekolahnya, tetapi menyusupkan `id` siswa sekolah lain di parameter URL. |
| **Injection & Input Validation** | Validasi input bervariasi. Beberapa sudah memakai Zod (seperti *FinanceService*), namun beberapa langsung mem-parsing `req.json()` ke Prisma. | 🟡 Sedang | Mengirim JSON dengan *field* berbahaya (misal merubah `amountPaid` atau menyisipkan *nested object* aneh) untuk manipulasi data. |
| **Authentication & Session** | Token divalidasi dengan baik oleh Auth.js, dan verifikasi anggota sekolah sudah menggunakan `requireTenantMembership`. | 🟢 Aman | Tidak ada sesi bocor. Otentikasi berlapis di-handle di middleware dan fungsi penjaga (*Tenant Guard*). |
| **Cross-Site Scripting (XSS)** | Teks kaya (pengumuman/post) sudah dibersihkan menggunakan `isomorphic-dompurify` sebelum di-render via `dangerouslySetInnerHTML`. | 🟢 Aman | Eksploitasi skrip pihak ketiga (seperti mencuri token *cookie*) sudah dimitigasi oleh DOMPurify. |

---

## 3. Deep Dive & Attack Scenarios

### Skenario Serangan: Cross-Tenant Data Hijacking (IDOR)

1. *Hacker* (Budi) mendaftarkan sekolah gratis di platform (Sekolah A).
2. Budi masuk sebagai Admin Sekolah A.
3. Budi mencegat *network request* saat memperbarui profil siswanya sendiri:
   `PATCH /api/students/clx123abc`
4. Budi secara acak atau sengaja memasukkan ID siswa dari Sekolah B yang elit:
   `PATCH /api/students/clx999xyz`
5. Aplikasi memeriksa: "Apakah Budi Admin di Sekolah A?" (Ya). "Apakah Budi menyertakan tenantId Sekolah A di Body?" (Ya).
6. Namun kode mengeksekusi `db.student.update({ where: { id: "clx999xyz" }, data })`. Prisma 5 akan langsung memperbarui siswa Sekolah B tanpa peduli Budi berasal dari Sekolah A, karena parameter `tenantId` luput dimasukkan ke dalam klausa `where`.

> [!IMPORTANT]
> **Solusi:** Selalu gunakan gabungan unik *Primary Key* dan *Tenant ID* pada operasi Prisma. Sejak Prisma versi 5, klausa `where` pada `update` dan `delete` dapat menerima filter tambahan selain *Primary Key*!

**Refactor (Before vs After):**
```typescript
// BEFORE: VULNERABLE IDOR
const student = await db.student.update({
  where: { id: reqId }, // BERBAHAYA! Tidak memfilter sekolah.
  data: reqBody
})

// AFTER: SECURE TENANT ISOLATION
const student = await db.student.update({
  where: { id: reqId, tenantId: reqTenantId }, // AMAN! Prisma 5 mendukung filter ganda ini.
  data: reqBody
})
```

---

## 4. Remediation Roadmap

Tim *Cyber Security* & *Engineering* wajib mengeksekusi tambalan berikut:

- **Fase 1: Tenant Boundary Fixes (H+1)**
  - Audit global menggunakan *Regex* terhadap semua pemanggilan `db.*.update({ where: { id } })` dan `db.*.delete({ where: { id } })`.
  - Injeksi parameter `tenantId` ke dalam semua objek `where` pada operasi mutasi (baik di API Route maupun Server Actions).
  
- **Fase 2: Zod Enforcement (H+2 - H+3)**
  - Mewajibkan penggunaan `Schema.parse()` atau `safeParse()` untuk setiap input `req.json()` dan *FormData* di seluruh modul.
  - Hapus metode *Type Casting* sembarangan seperti `as any` saat berhadapan dengan input publik.

- **Fase 3: Strict Edge Rate Limiting (Selesai)**
  - Proteksi *Brute Force* login sudah diaktifkan di `[...nextauth]/route.ts` via *Upstash Redis*. Tingkat keamanan *Gateway* sudah mencapai batas optimal.
