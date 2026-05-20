"Saya ingin kamu bertindak sebagai **Lead QA Automation Engineer & Next.js Testing Expert** untuk mengawasi dan membangun arsitektur *testing* pada project SaaS saya (SchoolPro). Aplikasi ini adalah platform **Multi-tenant SaaS** yang menggunakan **Next.js 14/15 (App Router), Prisma ORM, NextAuth, Zod, dan Server Actions**.

Tugas kamu adalah merancang, mengkonfigurasi, dan menulis *Unit Test* dan *Integration Test* yang komprehensif untuk memastikan tidak ada celah keamanan (terutama kebocoran data antar tenant) dan memastikan stabilitas kode.

Gunakan framework **Vitest**, **React Testing Library**, dan **vitest-mock-extended** (khusus untuk *mocking* Prisma ORM). Berikan laporan, langkah demi langkah, dan blok kode untuk mengimplementasikan strategi pengujian dengan struktur berikut:

## 1. Executive Setup & Konfigurasi (Fase Inisialisasi)
- Berikan instruksi instalasi paket yang relevan (`vitest`, `@testing-library/react`, `vitest-mock-extended`, dll).
- Berikan konfigurasi optimal untuk `vitest.config.ts` di ekosistem Next.js App Router.
- Buat file *setup* untuk *mocking* `PrismaClient` (misal: `__mocks__/prisma.ts`) agar tes tidak memanipulasi *database* produksi/nyata.

## 2. Security & Guard Testing (Prioritas Utama: Kritikal)
Fokus pertama adalah mengamankan fondasi isolasi data pengguna. Buatkan blok kode pengujian menyeluruh (Positive & Negative Test Cases) untuk file `src/lib/guards/tenant-guard.ts`:
- **Test Case 1:** `requireTenantAccess` melempar *Error* jika *session user* tidak ditemukan (Unauthenticated).
- **Test Case 2:** `requireTenantAccess` lolos otomatis jika *user* memiliki *role* `isSuperAdmin`.
- **Test Case 3:** `requireTenantAccess` melempar *Error* (Forbidden) jika *user* terotentikasi namun mencoba mengakses `tenantId` yang bukan miliknya.
- **Test Case 4:** `requireTenantAccess` berhasil mengembalikan *user* jika memiliki *role* valid ('owner', 'admin', 'operator') pada *tenant* tersebut.

## 3. Server Actions Testing (Isolasi Mutasi Backend)
Pilih salah satu entitas *mission-critical* (contoh: `src/lib/actions/facilities.ts` atau `staff.ts`) dan berikan pedoman pengujian. Tes harus membuktikan bahwa:
- *Server Actions* menolak ekseskusi jika parameter validasi *Zod* tidak terpenuhi.
- *Server Actions* (`create`, `update`, `delete`) memanggil `requireTenantAccess` dengan tepat sebelum mengeksekusi operasi Prisma.
- Hasil kembalian (Return data) dari aksi berhasil dikonversi ke tipe data yang sesuai dan fungsi `revalidatePath` dipanggil dengan benar.

## 4. UI Components & Validation Testing (Integrasi Form)
Berikan satu contoh pengujian *Client Component* untuk form (misal `Facilities Form` atau `Program Form`):
- Uji apakah validasi Zod *error* tertampil jika form di-*submit* dalam kondisi kosong.
- Uji apakah *state* berubah dan tombol submit menampilkan status *loading* saat memproses data.

## 5. Action Plan & Testing Checklist
Berikan daftar tindak lanjut (*checklist*) taktis file-file mana saja di `src/lib/actions/*` dan `src/app/api/*` yang wajib diliput (*covered*) pada sesi selanjutnya.

Pastikan kode *testing* yang kamu buat rapi, mudah dibaca, dilengkapi komentar penjelasan, dan tidak memicu *Hydration Error* atau konflik *async/await* bawaan Next.js. Tampilkan respons ini dalam format Markdown yang elegan."
