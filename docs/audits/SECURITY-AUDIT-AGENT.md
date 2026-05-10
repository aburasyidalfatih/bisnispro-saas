"Saya ingin kamu bertindak sebagai **Lead Penetration Tester & Security Architect** untuk mengevaluasi celah keamanan aplikasi SaaS saya (SchoolPro). Aplikasi ini dibangun dengan kerangka kerja Next.js, Auth.js (NextAuth), Prisma, dan PostgreSQL. Aplikasi ini multi-tenant, memisahkan data ribuan sekolah.

Lakukan audit keamanan tingkat eksekutif dengan menyisir seluruh permukaan serangan (Attack Surface). Buatkan **Dokumen Laporan Audit Keamanan Enterprise (Pentest Report)** yang agresif dan berpedoman pada standar OWASP Top 10.

Susun dokumen tersebut dengan struktur:

## 1. Executive Security Summary
- **SaaS Security Score:** (Skor 1-10) untuk resiliensi kode terhadap peretasan.
- **Top 3 Critical Vulnerabilities:** Tiga celah paling berbahaya yang bisa meruntuhkan platform.

## 2. Threat Vector Analysis (Tabel Vektor Serangan)
Sajikan dalam **Tabel Audit** (Kategori, Temuan, Tingkat Keparahan, Cara Exploitasi). Kategori wajib:
- **Broken Access Control (IDOR):** Apakah pengguna bisa memanipulasi parameter URL (seperti `invoiceId` atau `studentId`) untuk mengakses atau menghapus data sekolah lain?
- **Injection & Input Validation:** Apakah *Server Actions* atau API memvalidasi struktur input secara ketat menggunakan Zod sebelum menyentuh fungsi Prisma?
- **Authentication & Session (Auth.js):** Apakah sesi divalidasi mutlak di sisi server? Apakah peran ganda (*Cross-Tenant Role*) menyebabkan kebocoran otorisasi?
- **Cross-Site Scripting (XSS):** Apakah input Markdown atau HTML (*Rich Text Editor*) di pengumuman sekolah dibersihkan (*sanitized*) menggunakan DOMPurify sebelum di-*render* ke halaman siswa?

## 3. Deep Dive & Attack Scenarios
- Berikan simulasi konkret bagaimana *Hacker* (Siswa iseng atau Pihak Eksternal) bisa memanfaatkan satu celah untuk mendapatkan akses *Super Admin*.

## 4. Remediation Roadmap (Peta Jalan Penambalan Celah)
- **Fase 1: Tenant Boundary & Zod Validation (H+1 - H+3)**
- **Fase 2: XSS Sanitization & CSRF Protection (H+4 - H+7)**

Tampilkan dokumen ini dalam *GitHub Flavored Markdown* dan simpan hasilnya sebagai `README_SECURITY_AUDIT.md`."
