# BisnisPro SaaS

Platform Pembuatan Website Bisnis & Company Profile Profesional Berbasis Multi-Tenant SaaS (Software as a Service). Dirancang untuk memudahkan UMKM, Startup, Agensi, dan Profesional membuat website company profile instan hanya dengan mendaftar.

---

## 💼 Model Bisnis (Freemium)

BisnisPro menggunakan model bisnis freemium dengan beberapa tingkatan (tier):

1. **Free Tier (Gratis)**: 
   Setiap bisnis (tenant) mendapatkan website company profile profesional secara gratis. Termasuk di dalamnya fitur **Custom Domain** (misal: `tokobudi.bisnispro.id`), CMS untuk mempublikasikan artikel/blog, galeri, dan profil perusahaan.
2. **Pro Tier (Rp 99.000 / Bulan)**: 
   Membuka seluruh fitur lanjutan. Unlimited layanan & portofolio, custom domain, AI copywriter, analytics, hapus branding BisnisPro.
3. **Business Tier (Rp 249.000 / Bulan)**: 
   Multi-user, WhatsApp gateway, email automation, priority support.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router, Turbopack, React Compiler)
- **Auth**: Auth.js v5 (JWT, Credentials, Google OAuth, 2FA/TOTP)
- **Database**: Prisma ORM + PostgreSQL
- **UI**: Tailwind CSS + Radix UI + Lucide Icons
- **Payment**: Tripay Gateway
- **Notification**: Email (SMTP), WhatsApp (StarSender)
- **Deploy**: PM2 / Docker
- **PWA**: Web App Manifest

---

## 🚀 Quick Start (Development)

```bash
# 1. Install Dependencies
npm install --legacy-peer-deps

# 2. Copy environment config
cp .env.example .env
# Edit .env dengan konfigurasi database dan domain Anda

# 3. Setup Database (Pastikan PostgreSQL sudah berjalan & .env terisi)
npx prisma db push

# 4. Jalankan Development Server
npm run dev
```

Buka aplikasi di browser (biasanya berjalan di `http://localhost:3000`).

---

## 📁 Struktur Utama Project

```
src/
├── app/
│   ├── (auth)/                    # Autentikasi (Login, Register, 2FA)
│   ├── (dashboard)/               # Dashboard Admin Bisnis (Tenant)
│   ├── (super-admin)/             # Dashboard Super Admin (Pemilik BisnisPro)
│   ├── (landing)/                 # Landing Page BisnisPro SaaS
│   ├── (public)/                  # Pendaftaran Bisnis Baru
│   ├── site/[slug]/               # Website Publik Company Profile (Tenant)
│   ├── api/                       # API Routes
│   └── layout.tsx                 # Root layout
├── components/
│   ├── layout/                    # Header, Sidebar
│   ├── providers/                 # React Context Providers
│   ├── shared/                    # Reusable components
│   └── ui/                        # Radix UI primitives
├── lib/
│   ├── auth.ts                    # Auth.js Config
│   └── db.ts                      # Prisma Client Singleton
├── features/                      # Feature-based modular services
└── middleware.ts                   # Multi-tenant router middleware
```

---

## 🌐 Website Company Profile (Tenant)

Setiap bisnis yang mendaftar langsung mendapat website profesional dengan halaman:

| Halaman | Deskripsi |
|---|---|
| **Homepage** | Hero banner, statistik bisnis, layanan unggulan, testimoni |
| **Tentang Kami** | Profil perusahaan, visi & misi, sejarah |
| **Layanan** | Daftar layanan/produk yang ditawarkan |
| **Portofolio** | Showcase proyek/karya yang pernah dikerjakan |
| **Tim Kami** | Profil anggota tim perusahaan |
| **Testimoni** | Review dan cerita sukses dari klien |
| **Blog** | Artikel, tips bisnis, press release |
| **Event** | Webinar, workshop, peluncuran produk |
| **Galeri** | Foto kantor, produk, kegiatan |
| **Partner** | Logo wall mitra dan klien |
| **FAQ** | Pertanyaan yang sering diajukan |
| **Kontak** | Form kontak, peta lokasi, jam operasional |
| **Download** | Brosur, katalog, price list |

