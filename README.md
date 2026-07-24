# 🚀 BisnisPro SaaS

**Platform Pembuatan Website Bisnis & Company Profile Profesional** — Berbasis Multi-Tenant SaaS.  
Dirancang untuk memudahkan UMKM, Startup, Agensi, dan Profesional membuat website company profile instan hanya dengan mendaftar.

> Daftar → Pilih Template → Website Profesional Langsung Online di `namabisnis.bisnispro.id`

---

## ✨ Fitur Utama

### 🌐 Website Company Profile Instan
Setiap bisnis yang mendaftar langsung mendapat website profesional dengan halaman lengkap:

| Halaman | Deskripsi |
|---|---|
| **Homepage** | Hero banner, statistik bisnis, layanan unggulan, testimoni klien |
| **Tentang Kami** | Profil perusahaan, visi & misi, sejarah, sambutan founder |
| **Layanan** | Daftar layanan/produk yang ditawarkan dengan detail & harga |
| **Portofolio** | Showcase proyek/karya yang pernah dikerjakan |
| **Tim Kami** | Profil anggota tim perusahaan dengan sosial media |
| **Testimoni** | Review dan cerita sukses dari klien |
| **Blog / Artikel** | CMS lengkap untuk artikel, tips bisnis, press release |
| **Event / Agenda** | Webinar, workshop, peluncuran produk |
| **Galeri** | Foto kantor, produk, kegiatan perusahaan |
| **Partner & Klien** | Logo wall mitra bisnis dan klien |
| **FAQ** | Pertanyaan yang sering diajukan |
| **Kontak** | Form kontak, peta lokasi, jam operasional |
| **Download** | Brosur, katalog, company profile, price list |
| **Halaman Custom** | Buat halaman tambahan sesuai kebutuhan |

### 🤖 AI-Powered
- **AI Copywriter** — Generate konten website, artikel blog, dan deskripsi layanan
- **AI Chat Assistant** — Chatbot pintar untuk tanya jawab dengan AI
- **AI Token Management** — Sistem token dengan top-up dan tracking penggunaan

### 📊 Dashboard Admin Bisnis
- **Analitik Website** — Statistik pengunjung, page views, traffic source
- **CMS Lengkap** — Kelola semua konten website dari satu dashboard
- **SEO Otomatis** — Meta tags, JSON-LD (LocalBusiness), sitemap, Open Graph
- **Multi Template** — Pilih dan ganti tema website kapan saja
- **WhatsApp Integration** — Broadcast pesan, log WA, notifikasi otomatis
- **Email Automation** — Drip campaign dan email queue system
- **Audit Log** — Rekam semua aktivitas untuk keamanan
- **Social Media** — Integrasi dengan platform sosial media

### 🏢 Multi-Tenant Architecture
- **Subdomain Otomatis** — `namabisnis.bisnispro.id`
- **Custom Domain** — Hubungkan domain sendiri (contoh: `www.tokobudi.com`)
- **Data Isolation** — Setiap tenant terisolasi secara aman
- **Role-Based Access** — Multi-user dengan kontrol akses

### 💰 Sistem Billing & Afiliasi
- **Subscription Plans** — Free, Pro, Business tier
- **Payment Gateway** — Integrasi Tripay untuk pembayaran otomatis
- **Program Afiliasi** — Referral system dengan komisi dan tracking
- **Discount Codes** — Sistem kode diskon untuk promo

---

## 🛠️ Tech Stack

| Kategori | Teknologi |
|---|---|
| **Framework** | Next.js 16.2 (App Router, Turbopack, React Compiler) |
| **Runtime** | React 19.2 (View Transitions, Activity API) |
| **Language** | TypeScript 5.8 |
| **Auth** | Auth.js v5 (JWT, Credentials, Google OAuth, 2FA/TOTP) |
| **Database** | Prisma ORM 6.x + PostgreSQL |
| **UI Components** | Radix UI + Tailwind CSS 3.4 + Framer Motion |
| **Icons** | Lucide React |
| **Rich Text Editor** | TipTap |
| **Charts** | Recharts |
| **AI** | Vercel AI SDK (Google Gemini, OpenAI, OpenRouter) |
| **Payment** | Tripay Gateway |
| **Email** | Nodemailer (SMTP) |
| **WhatsApp** | StarSender / Wavio |
| **Queue** | BullMQ + Redis |
| **Storage** | AWS S3 Compatible |
| **Monitoring** | Sentry |
| **Security** | Cloudflare Turnstile, Rate Limiting (Upstash Redis) |
| **Testing** | Vitest + React Testing Library |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18.17+ (disarankan 20+)
- PostgreSQL 14+
- Redis (opsional, untuk queue & rate limiting)

### Development Setup

```bash
# 1. Clone repository
git clone https://github.com/aburasyidalfatih/bisnispro-saas.git
cd bisnispro-saas

# 2. Install dependencies
npm install --legacy-peer-deps

# 3. Setup environment
cp .env.example .env
# Edit .env — isi DATABASE_URL, AUTH_SECRET, dan konfigurasi lainnya

# 4. Setup database
npx prisma db push
npx prisma generate

# 5. Jalankan development server
npm run dev
```

Buka `http://localhost:3000` di browser.

### Environment Variables

| Variable | Deskripsi | Contoh |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/bisnispro` |
| `AUTH_SECRET` | Secret untuk Auth.js | Random string panjang |
| `AUTH_URL` | URL aplikasi | `http://localhost:3000` |
| `NEXT_PUBLIC_ROOT_DOMAIN` | Domain utama platform | `bisnispro.test` (dev) / `bisnispro.id` (prod) |
| `NEXT_PUBLIC_APP_URL` | Full URL aplikasi | `http://bisnispro.test` |

Lihat `.env.example` untuk daftar lengkap variabel.

---

## 📁 Struktur Project

```
src/
├── app/
│   ├── (auth)/                    # Autentikasi (Login, Register, 2FA)
│   ├── (dashboard)/               # Dashboard Admin Bisnis
│   │   └── admin/                 # Panel admin tenant
│   ├── (super-admin)/             # Dashboard Super Admin Platform
│   ├── (landing)/                 # Landing Page BisnisPro
│   │   ├── _components/           # Hero, Features, Solutions, CTA
│   │   └── direktori/             # Direktori Bisnis publik
│   ├── (public)/
│   │   ├── daftarkan-bisnis/      # Form registrasi bisnis baru
│   │   └── mitra-afiliasi/        # Portal afiliasi
│   ├── site/[slug]/               # Website Publik Tenant
│   │   ├── _components/           # Section components (services, portfolio, dll)
│   │   ├── _themes/               # Template engine (default, modern)
│   │   ├── layanan/               # Halaman layanan
│   │   ├── portofolio/            # Halaman portofolio
│   │   ├── tim/                   # Halaman tim
│   │   ├── testimoni/             # Halaman testimoni
│   │   ├── blog/                  # Halaman blog/artikel
│   │   ├── event/                 # Halaman event
│   │   ├── tentang/               # Halaman tentang
│   │   ├── kontak/                # Halaman kontak
│   │   └── ...                    # Galeri, FAQ, Download, dll
│   └── api/                       # API Routes
├── components/
│   ├── layout/                    # Header, Sidebar, Footer
│   ├── providers/                 # React Context Providers
│   ├── shared/                    # Reusable components
│   └── ui/                        # Radix UI primitives (shadcn/ui)
├── config/
│   └── menus.ts                   # Konfigurasi menu dashboard
├── features/                      # Feature-based modular services
├── lib/
│   ├── auth.ts                    # Auth.js configuration
│   ├── db.ts                      # Prisma Client singleton
│   └── tenant-scope.ts            # Tenant data isolation
└── middleware.ts                   # Multi-tenant routing middleware
```

---

## 📜 Scripts

| Script | Deskripsi |
|---|---|
| `npm run dev` | Development server (Turbopack) |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run typecheck` | TypeScript type checking |
| `npm run lint` | ESLint linting |
| `npm run test` | Jalankan unit tests (Vitest) |
| `npm run db:push` | Push Prisma schema ke database |
| `npm run db:studio` | Buka Prisma Studio (GUI database) |
| `npm run db:seed` | Seed data awal |
| `npm run worker` | Jalankan BullMQ worker (email/WA queue) |

---

## 🏗️ Arsitektur

### Multi-Tenant Routing
```
bisnispro.id          → Landing Page (platform utama)
tokobudi.bisnispro.id → Website Tenant "Toko Budi"
www.tokobudi.com      → Custom Domain → Website Tenant
```

Routing ditangani oleh `middleware.ts` yang melakukan:
1. **Host Detection** — Identifikasi tenant dari subdomain/custom domain
2. **Domain Cache** — Redis cache untuk resolusi domain cepat
3. **Security** — Rate limiting, IP banning, attack detection
4. **Rewrite** — Route ke `/site/[slug]/*` secara internal

### Data Isolation
Setiap model yang tenant-scoped otomatis difilter via `tenant-scope.ts`, memastikan data antar tenant tidak bocor.

---

## 💼 Model Bisnis

| Tier | Harga | Fitur |
|---|---|---|
| **Free** | Gratis | Website dasar, subdomain, 5 halaman, branding BisnisPro |
| **Pro** | Rp 99.000/bln | Unlimited halaman, custom domain, AI copywriter, analytics, hapus branding |
| **Business** | Rp 249.000/bln | Multi-user, WhatsApp gateway, email automation, priority support |

---

## 🔒 Keamanan

- **2FA/TOTP** — Two-factor authentication
- **Rate Limiting** — Upstash Redis rate limiter
- **CSRF Protection** — Built-in Next.js protection
- **XSS/SQLi Detection** — Security log & auto-ban
- **Cloudflare Turnstile** — Bot protection pada form publik
- **CSP Headers** — Content Security Policy ketat
- **Audit Log** — Rekam semua aktivitas admin

---

## 📄 License

Private — All rights reserved.

---

Built with ❤️ using **Next.js 16** & **React 19**
