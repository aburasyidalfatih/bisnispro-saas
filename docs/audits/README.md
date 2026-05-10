# SchoolPro Enterprise Audit Playbooks

Selamat datang di direktori **Audit Playbooks**. Direktori ini menyimpan kumpulan Standar Operasional Prosedur (SOP) tingkat Enterprise untuk mengaudit, memelihara, dan menyempurnakan platform SaaS SchoolPro secara berkala.

Jika Anda ingin mengevaluasi kesehatan sistem di masa mendatang (misalnya sebelum rilis besar atau saat target 1.000 sekolah tercapai), gunakan *prompt* dari file-file di bawah ini kepada AI Engineer Anda.

## 🗂️ Daftar Audit Agents

| Nama Audit | File SOP | Fokus Evaluasi | Prioritas Eksekusi |
| :--- | :--- | :--- | :---: |
| **Enterprise Architecture** | [`AUDIT-AGENT.md`](./AUDIT-AGENT.md) | Kesesuaian skalabilitas *Server*, proteksi DDoS, dan batas arsitektur Node.js/Next.js. | P1 |
| **Database & Scaling** | [`DB-AUDIT-AGENT.md`](./DB-AUDIT-AGENT.md) | *Table bloat*, *Composite Indexes*, Normalisasi Prisma, dan penghapusan kaskade. | P1 |
| **Security & Pentest** | [`SECURITY-AUDIT-AGENT.md`](./SECURITY-AUDIT-AGENT.md) | Kerentanan XSS, IDOR, Kebocoran Sesi Auth.js, dan isolasi *Multi-tenant*. | P1 |
| **Financial & Fintech** | [`FINANCE-AUDIT-AGENT.md`](./FINANCE-AUDIT-AGENT.md) | Celah klik ganda (*Race Condition*), *Webhook Idempotency*, presisi bilangan. | P2 |
| **UI/UX & Aesthetics** | [`UI-UX-AUDIT-AGENT.md`](./UI-UX-AUDIT-AGENT.md) | *Loading Skeletons*, konsistensi komponen, *Empty States*, aksesibilitas. | P2 |
| **Frontend Perf. & SEO** | [`SEO-PERF-AUDIT-AGENT.md`](./SEO-PERF-AUDIT-AGENT.md) | Waktu muat halaman (Lighthouse LCP), optimasi gambar, metatag dinamis SEO publik. | P3 |

## 🚀 Cara Penggunaan

1. Buka salah satu file `.md` di atas.
2. Salin (*Copy*) seluruh instruksinya.
3. Tempel (*Paste*) instruksi tersebut ke asisten AI Anda di masa mendatang untuk langsung memulai prosedur audit mendalam.

---
*Tujuan akhir kita adalah mencapai platform SaaS dengan **SLA 99.99%**, Zero Data Loss, dan performa setara Vercel/Stripe.*
