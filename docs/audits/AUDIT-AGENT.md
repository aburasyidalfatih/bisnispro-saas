"Saya ingin kamu bertindak sebagai **Principal Enterprise Architect & Security Auditor** untuk mengevaluasi project SaaS saya (SchoolPro). Aplikasi ini adalah platform **Massive-Scale Multi-tenant SaaS** yang ditargetkan untuk melayani **ribuan hingga puluhan ribu sekolah (Enterprise Scale)**. Stack saat ini: Next.js (App Router), Prisma ORM, PostgreSQL, NextAuth, Zod, dan TailwindCSS.

Lakukan audit mendalam terhadap seluruh struktur, arsitektur, dan kode base saat ini dengan standar *Enterprise SLA 99.9%*. Buatkan **Dokumen Laporan Audit Enterprise Produksi** yang sangat komprehensif, kritis, dan berorientasi pada skala masif. 

Susun dokumen tersebut dengan struktur sebagai berikut:

## 1. Executive Summary (Ringkasan Eksekutif)
- **Enterprise Readiness Score:** Berikan penilaian objektif (Skor 1-10) berdasarkan standar *Mass-Scale Enterprise Production*.
- **Critical Scaling Bottlenecks:** 3-5 daftar temuan paling kritis yang dapat menyebabkan *Downtime*, *Connection Timeout*, kebocoran data, atau inefisiensi biaya server ketika aplikasi diakses secara bersamaan oleh ribuan sekolah.

## 2. Mass-Scale Architecture Audit (Tabel Audit Enterprise)
Sajikan temuan dalam bentuk **Tabel Audit** (Kategori, Temuan, Tingkat Risiko, Dampak Skalabilitas). Kategori wajib:
- **Hyper-Tenant Isolation & RLS:** Evaluasi apakah isolasi tenant sudah dipaksa di tingkat *Database (PostgreSQL Row Level Security)* selain di level *ORM (Prisma)* untuk keamanan absolut.
- **Database Connection Pooling & Caching:** Evaluasi potensi *connection exhaustion* (Prisma). Apakah sudah memerlukan *PgBouncer/Prisma Accelerate* dan lapisan *Redis/Memcached* untuk mengurangi beban I/O database?
- **Asynchronous & Background Processing:** Deteksi tugas-tugas berat sinkron (import CSV, laporan PDF, mass email/drip, *Cron Jobs*) yang berpotensi memblokir *Event Loop*. Apakah perlu dipindahkan ke *Message Queues* (seperti BullMQ, RabbitMQ, Upstash QStash, atau Inngest)?
- **Rate Limiting & Security (DDoS/Brute Force):** Apakah ada proteksi absolut per-tenant dan per-IP untuk *API Abuse* menggunakan Redis/Edge? Adakah logging terpusat (Datadog/Sentry)?
- **Next.js Edge Computing & RSC Optimization:** Evaluasi penggunaan *Server Components*, pemisahan *Service Layer*, dan pemanfaatan *Edge Runtime* untuk *middleware* atau otorisasi ringan.

## 3. Deep Dive & Actionable Recommendations (Analisis Mendalam)
- Untuk setiap kelemahan arsitektural berskala besar (misal: *N+1 queries* tersembunyi, ketiadaan *indexing* komposit, memori bocor), berikan penjelasan teknis mendalam.
- Sertakan **Blok Kode Rekomendasi (Refactor: Before vs After)** untuk mengimplementasikan *Best Practices Enterprise*.

## 4. Remediation & Scaling Roadmap (Peta Jalan Skalabilitas)
- Langkah-langkah taktis yang harus dieksekusi oleh tim Engineering, dibagi menjadi:
   - **Fase 1: Stability & Security Fixes (H+1 - H+3)**
   - **Fase 2: Asynchronous & Job Queue Migration (H+4 - H+7)**
   - **Fase 3: Caching, Pooling & Edge Optimizations (H+8 - H+14)**

## 5. Conclusion (Kesimpulan Penutup)
- Keputusan *Go/No-Go* secara profesional: Apakah arsitektur saat ini akan hancur/tumbang jika di-load oleh 1.000 tenant serentak besok? Apa investasi infrastruktur terpenting yang harus disiapkan.

Tampilkan dokumen ini menggunakan format Markdown standar GitHub (*GitHub Flavored Markdown*) yang elegan dan menggunakan *Alerts* (seperti `> [!WARNING]`, `> [!IMPORTANT]`, `> [!CAUTION]`) agar rapi saat saya salin ke `README_AUDIT_ENTERPRISE.md`."