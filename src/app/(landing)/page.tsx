import Link from "next/link"
import Image from "next/image"
import { db } from "@/lib/db"
import {
  ArrowRight,
  Globe,
  Database,
  Wallet,
  Users,
  PiggyBank,
  MonitorSmartphone,
  Shield,
  Zap,
  Check,
  ChevronRight,
  School,
  BellRing,
  Sparkles,
  Bot,
  Menu,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ReferralCapture } from "@/components/shared/referral-capture"

const featureModules = [
  {
    id: "website",
    title: "Website Terintegrasi",
    icon: Globe,
    description: "Infrastruktur portal digital sekolah masa depan dengan performa tinggi dan pengelolaan cerdas.",
    features: [
      { name: "Portal Profil Lembaga Profesional", status: "ready" },
      { name: "Sistem Manajemen Konten (CMS) Cepat", status: "ready" },
      { name: "SEO-Optimized untuk Visibilitas Tinggi", status: "ready" },
      { name: "Pusat Informasi & Pengumuman Dinamis", status: "ready" },
      { name: "Isolasi Tenant & Domain Terpusat", status: "ready" },
    ],
  },
  {
    id: "ppdb",
    title: "PPDB Online Pro",
    icon: Users,
    description: "Sistem otomasi rekrutmen siswa baru dari pendaftaran mandiri hingga konversi siswa aktif.",
    features: [
      { name: "Portal Pendaftaran & Verifikasi Mandiri", status: "ready" },
      { name: "Auto-Generate Tagihan Formulir & Daftar Ulang", status: "ready" },
      { name: "Sistem Kelulusan & Notifikasi Hasil Seleksi", status: "ready" },
      { name: "Sinkronisasi Langsung ke Data Master Siswa", status: "ready" },
      { name: "Kustomisasi Formulir Pendaftaran", status: "coming_soon" },
    ],
  },
  {
    id: "keuangan",
    title: "Core Banking Keuangan",
    icon: Wallet,
    description: "Ekosistem finansial tingkat lanjut untuk menekan tunggakan dan memantau arus kas real-time.",
    features: [
      { name: "Pembuatan Tagihan Otomatis Massal (SPP)", status: "ready" },
      { name: "Auto-Reminder Jatuh Tempo via WA & Email", status: "ready" },
      { name: "Pembayaran Online via Payment Gateway", status: "ready" },
      { name: "Cetak Nota PDF & Rekap Excel Profesional", status: "ready" },
      { name: "Pembukuan Buku Kas Umum (BKU)", status: "ready" },
    ],
  },
  {
    id: "tabungan",
    title: "E-Kantin & Tabungan",
    icon: PiggyBank,
    description: "Digitalisasi ekosistem sekolah tanpa uang tunai (Cashless) berbasis QR Code pintar.",
    features: [
      { name: "Dompet Digital (Wallet) per Siswa", status: "ready" },
      { name: "Limit Belanja Harian & Verifikasi PIN", status: "ready" },
      { name: "Transaksi Canteen via QR Code Scanner", status: "ready" },
      { name: "Notifikasi Instan Saldo Terpotong", status: "ready" },
      { name: "Cetak ID Card Barcode Cerdas", status: "coming_soon" },
    ],
  },
  {
    id: "enterprise",
    title: "Arsitektur Enterprise",
    icon: Zap,
    description: "Dibangun dengan fondasi teknologi level korporasi yang tahan banting untuk puluhan ribu sekolah.",
    features: [
      { name: "Inngest Queue untuk Background Tasks", status: "ready" },
      { name: "Isolasi Kredensial (Bring Your Own SMTP/WA)", status: "ready" },
      { name: "Pengiriman Notifikasi Asynchronous Massal", status: "ready" },
      { name: "Isolasi Database & Proteksi Data Anti-Bocor", status: "ready" },
      { name: "Export/Import Massal Ribuan Data via Excel", status: "ready" },
    ],
  },
  {
    id: "portal",
    title: "Akses Multi-Portal",
    icon: MonitorSmartphone,
    description: "Ekosistem terhubung untuk transparansi total antara pengurus yayasan, staf, dan orang tua.",
    features: [
      { name: "Dasbor Wali (Pantau SPP & Tabungan)", status: "ready" },
      { name: "Notifikasi Real-time WA, Email & In-App", status: "ready" },
      { name: "Hak Akses & Role-Based Control (RBAC)", status: "ready" },
      { name: "Manajemen Catatan Kedisiplinan Siswa", status: "ready" },
    ],
  },
  {
    id: "data",
    title: "Big Data & Keamanan",
    icon: Database,
    description: "Pusat komando data institusi Anda dengan sistem proteksi ketat dan migrasi mulus.",
    features: [
      { name: "Kelola Ribuan Data Petugas & Siswa", status: "ready" },
      { name: "Proses Kenaikan Kelas Massal 1-Klik", status: "ready" },
      { name: "Log Aktivitas (Audit Trail) Keamanan", status: "ready" },
      { name: "Ekspor/Impor Data via Excel", status: "ready" },
    ],
  },
  {
    id: "ai",
    title: "AI & Analisis Prediktif",
    icon: Bot,
    description: "Asisten kecerdasan buatan untuk membantu pengambilan keputusan strategis manajemen.",
    features: [
      { name: "Chatbot Analis Status Keuangan", status: "coming_soon" },
      { name: "Prediksi Penurunan Nilai Akademik", status: "coming_soon" },
      { name: "Generator Draf Surat Resmi", status: "coming_soon" },
      { name: "Natural Language Database Query", status: "coming_soon" },
    ],
  },
]

const plans = [
  {
    name: "Starter",
    price: "Rp 0",
    period: "selamanya",
    description: "Untuk sekolah yang baru memulai digitalisasi",
    features: ["Portal Website Terintegrasi", "Akses Data Master Dasar", "Notifikasi In-App", "Dukungan Komunitas"],
  },
  {
    name: "Pro",
    price: "Rp 149.000",
    period: "/bulan",
    popular: true,
    description: "Sistem operasional lengkap untuk otomasi tagihan",
    features: [
      "PPDB Online & Sinkronisasi Data",
      "Core Banking Keuangan & Kas",
      "Auto-Reminder WhatsApp & Email",
      "Akses Multi-Portal (Orang Tua & Guru)",
      "Log Aktivitas & Audit Trail",
    ],
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "/bulan",
    description: "Arsitektur khusus untuk yayasan skala besar",
    features: [
      "Domain Sekolah Kustom (.sch.id)",
      "Ekosistem Tabungan & E-Kantin",
      "Bring Your Own SMTP & WA API",
      "Dedicated Background Queue",
      "Prioritas Bantuan (Dedicated Support)",
    ],
  },
]

export default async function LandingPage() {
  const settings = await db.platformSetting.findMany({
    where: { key: { in: ["app_logo", "platform_name", "platform_tagline"] } },
  })

  let appLogo = "/logo-schoolpro.png"
  let platformName = "SchoolPro"
  let platformTagline = "Solusi Manajemen Sekolah Digital"

  settings.forEach((s) => {
    if (s.key === "app_logo" && s.value) appLogo = s.value
    if (s.key === "platform_name" && s.value) platformName = s.value
    if (s.key === "platform_tagline" && s.value) platformTagline = s.value
  })

  const activeTenants = await db.tenant.findMany({
    where: { isActive: true },
    select: { id: true, name: true, address: true, logo: true },
    orderBy: { createdAt: "desc" },
  })

  return (
    <div className="min-h-screen bg-mesh">
      <ReferralCapture />
      {/* ====== NAVBAR ====== */}
      <nav className="glass sticky top-0 z-50 border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Image src={appLogo} alt={`${platformName} Logo`} width={120} height={32} className="h-8 w-auto object-contain" />
            <span className="font-bold text-base md:text-lg tracking-tight">{platformName}</span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <Link href="#fitur" className="hover:text-foreground transition-colors">Fitur</Link>
            <Link href="#solusi" className="hover:text-foreground transition-colors">Solusi</Link>
          </div>

          {/* CTA + Mobile hint */}
          <div className="flex items-center gap-2">
            <Link href="/daftarkan-sekolah">
              <Button size="sm" className="rounded-xl btn-gradient text-white shadow-lg glow-primary border-0 text-xs md:text-sm">
                Daftar Gratis
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ====== HERO SECTION ====== */}
      <section className="relative overflow-hidden">
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full orb-1 opacity-20 blur-3xl" />
        <div className="absolute -top-20 right-0 h-80 w-80 rounded-full orb-2 opacity-15 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full orb-3 opacity-10 blur-3xl" />

        {/* Floating Technology Elements */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[15%] left-[10%] animate-float-slow opacity-30 md:opacity-40">
            <div className="h-12 w-12 rounded-2xl bg-blue-500/10 flex items-center justify-center backdrop-blur-sm border border-blue-500/20 shadow-xl shadow-blue-500/5">
              <Database className="h-6 w-6 text-blue-500" />
            </div>
          </div>
          <div className="absolute top-[25%] right-[15%] animate-float-delayed opacity-30 md:opacity-40">
            <div className="h-16 w-16 rounded-3xl bg-indigo-500/10 flex items-center justify-center backdrop-blur-sm border border-indigo-500/20 shadow-xl shadow-indigo-500/5">
              <Globe className="h-8 w-8 text-indigo-500" />
            </div>
          </div>
          <div className="absolute bottom-[25%] left-[20%] animate-float opacity-30 md:opacity-40">
            <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center backdrop-blur-sm border border-emerald-500/20 shadow-xl shadow-emerald-500/5">
              <Bot className="h-7 w-7 text-emerald-500" />
            </div>
          </div>
          <div className="absolute bottom-[35%] right-[10%] animate-float-slow opacity-30 md:opacity-40">
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center backdrop-blur-sm border border-amber-500/20 shadow-xl shadow-amber-500/5">
              <Zap className="h-5 w-5 text-amber-500" />
            </div>
          </div>
          <div className="absolute top-[45%] left-[5%] animate-float opacity-20 md:opacity-30">
            <div className="h-10 w-10 rounded-xl bg-purple-500/10 flex items-center justify-center backdrop-blur-sm border border-purple-500/20 shadow-xl shadow-purple-500/5">
              <Shield className="h-5 w-5 text-purple-500" />
            </div>
          </div>
        </div>

        <div className="container relative mx-auto px-4 py-14 text-center lg:py-20">
          <div className="mx-auto max-w-4xl space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full glass px-4 py-2 text-xs md:text-sm">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span className="text-muted-foreground">Platform Manajemen Pendidikan Masa Depan</span>
              <ChevronRight className="h-3 w-3 text-muted-foreground" />
            </div>

            {/* Hero Title — smaller base size for mobile */}
            <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.15]">
              Sistem ERP & Keuangan <span className="text-gradient">Enterprise</span> Sekolah
            </h1>

            <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed px-2">
              Satu platform cerdas untuk menyatukan seluruh ekosistem pendidikan.{" "}
              Nikmati analitik keuangan real-time, otomatisasi tagihan massal, e-Kantin cashless, dan portal terintegrasi (Ortu, Guru, Siswa) tanpa batasan skalabilitas.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
              <Link href="/daftarkan-sekolah" className="w-full sm:w-auto">
                <Button size="lg" className="w-full gap-2 rounded-xl btn-gradient text-white shadow-xl glow-primary h-12 md:h-14 px-6 md:px-8 text-sm md:text-base border-0">
                  Daftarkan Sekolah Gratis <ArrowRight className="h-4 w-4 md:h-5 md:w-5" />
                </Button>
              </Link>
              <Link href="#fitur" className="w-full sm:w-auto">
                <Button variant="outline" size="lg" className="w-full rounded-xl glass h-12 md:h-14 px-6 md:px-8 text-sm md:text-base">
                  Jelajahi Fitur
                </Button>
              </Link>
            </div>

            {/* Social proof micro-text */}
            <p className="text-xs text-muted-foreground/60 pt-2">
              Tanpa kartu kredit &bull; Setup instan 5 menit &bull; Gratis selamanya
            </p>
          </div>
        </div>
      </section>

      {/* ====== SCHOOLS SLIDER SECTION ====== */}
      {activeTenants.length > 0 && (
        <section className="py-8 md:py-10 border-y bg-muted/30 overflow-hidden">
          <div className="container mx-auto px-4 mb-6 text-center">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Dipercaya oleh inovator pendidikan di seluruh Indonesia
            </p>
          </div>
          {/* Marquee Container */}
          <div className="relative w-full overflow-hidden flex">
            <div className="absolute left-0 top-0 bottom-0 w-16 md:w-32 z-10 bg-gradient-to-r from-background to-transparent" />
            <div className="absolute right-0 top-0 bottom-0 w-16 md:w-32 z-10 bg-gradient-to-l from-background to-transparent" />
            <div 
              className="animate-marquee flex gap-8 md:gap-12 pl-8 md:pl-12 items-center"
              style={{ animationDuration: `${Math.max(activeTenants.length * 2, 10)}s` }}
            >
              {/* Render items 4 times to ensure seamless loop for marquee */}
              {[...activeTenants, ...activeTenants, ...activeTenants, ...activeTenants].map((tenant, idx) => {
                let city = "Indonesia"
                if (tenant.address) {
                  const kabMatch = tenant.address.match(/(Kota|Kabupaten|Kab\.)\s+([A-Za-z\- ]+)/i)
                  if (kabMatch) {
                    city = kabMatch[0].trim()
                  } else {
                    const kecMatch = tenant.address.match(/(Kecamatan|Kec\.)\s+([A-Za-z\- ]+)/i)
                    if (kecMatch) {
                      city = kecMatch[0].trim()
                    } else {
                      const parts = tenant.address.split(",")
                      const last = parts[parts.length - 1].trim()
                      city = last.length > 25 ? last.substring(0, 25) + "..." : last
                    }
                  }
                }
                return (
                  <div key={`${tenant.id}-${idx}`} className="flex items-center gap-3 shrink-0 opacity-70 hover:opacity-100 transition-opacity grayscale hover:grayscale-0 cursor-default">
                    {tenant.logo ? (
                      <Image src={tenant.logo} alt={tenant.name} width={48} height={48} className="h-10 w-10 md:h-12 md:w-12 object-contain rounded-full border bg-white p-1" />
                    ) : (
                      <div className="h-10 w-10 md:h-12 md:w-12 rounded-full border bg-muted flex items-center justify-center shrink-0">
                        <School className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex flex-col text-left">
                      <span className="text-sm md:text-base font-semibold leading-tight">{tenant.name}</span>
                      <span className="text-[10px] md:text-xs text-muted-foreground font-medium">{city}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* ====== SOLUSI SECTION ====== */}
      <section id="solusi" className="container mx-auto px-4 py-10 md:py-16">
        <div className="glass rounded-2xl md:rounded-3xl p-6 md:p-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 h-40 w-40 rounded-full orb-1 opacity-10 blur-3xl" />

          <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
            {/* Left */}
            <div className="space-y-5">
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
                Tinggalkan Proses Manual, Sambut Akurasi Real-Time
              </h2>
              <p className="text-muted-foreground leading-relaxed text-sm md:text-base">
                Tingkatkan efisiensi lembaga pendidikan Anda ke level korporasi. Kami mendigitalisasi proses kompleks mulai dari pencatatan BKU (Buku Kas Umum), pelaporan arus kas, hingga komunikasi presisi ke wali murid.
              </p>
              <ul className="space-y-3 pt-1">
                {[
                  "Dasbor analitik keuangan real-time & tanpa mock data.",
                  "Sistem e-Kantin cashless dengan akurasi harian terjamin.",
                  "Sinkronisasi data master guru, siswa & ortu bebas repot.",
                  "Penerimaan Siswa Baru (PPDB) end-to-end terstruktur.",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary">
                      <Check className="h-3 w-3" />
                    </div>
                    <span className="text-sm md:text-base text-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Right — WA notification mockup */}
            <div className="relative rounded-xl md:rounded-2xl border bg-background/50 p-5 md:p-6 shadow-2xl backdrop-blur-sm">
              <div className="flex items-center gap-3 md:gap-4 border-b pb-4 mb-4">
                <div className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                  <BellRing className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm md:text-base">Notifikasi Pintar AI-Powered</h4>
                  <p className="text-xs md:text-sm text-muted-foreground">Otomatisasi pengiriman pesan proaktif</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="rounded-xl bg-muted/50 p-3 md:p-4 text-xs md:text-sm border">
                  &quot;Bapak/Ibu, tagihan SPP bulan ini sebesar Rp 150.000 telah terbit. Silakan lakukan pembayaran via transfer ke Virtual Account...&quot;
                </div>
                <div className="rounded-xl bg-muted/50 p-3 md:p-4 text-xs md:text-sm border">
                  &quot;Terima kasih! Pembayaran tagihan Buku Paket atas nama Budi telah kami terima.&quot;
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====== FITUR TABS SECTION ====== */}
      <section id="fitur" className="container mx-auto px-4 py-10 md:py-16">
        <div className="text-center mb-10 md:mb-16 space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-xs md:text-sm text-primary font-medium">
            <School className="h-3.5 w-3.5" />
            Modul Lengkap
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">
            Satu Platform, Beragam Solusi
          </h2>
          <p className="text-muted-foreground text-sm md:text-lg max-w-2xl mx-auto px-2">
            Mulai dari website profil hingga manajemen tabungan kantin, semua terintegrasi di {platformName}.
          </p>
        </div>

        <Tabs defaultValue="website" className="max-w-5xl mx-auto">
          {/* Tab triggers — scrollable on mobile */}
          <div className="overflow-x-auto pb-2 mb-8 md:mb-12 no-scrollbar">
            <TabsList className="flex w-max md:w-auto md:flex-wrap md:justify-center h-auto gap-2 bg-transparent mx-auto px-1">
              {featureModules.map((module) => (
                <TabsTrigger
                  key={module.id}
                  value={module.id}
                  className="rounded-full px-4 md:px-6 py-2 md:py-3 text-xs md:text-sm whitespace-nowrap data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg glass border transition-all shrink-0"
                >
                  <module.icon className="h-3.5 w-3.5 mr-1.5 md:mr-2" />
                  {module.title}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {featureModules.map((module) => (
            <TabsContent
              key={module.id}
              value={module.id}
              className="animate-in fade-in slide-in-from-bottom-4 duration-500"
            >
              <div className="glass rounded-2xl md:rounded-3xl p-5 md:p-12 border">
                {/* Stack on mobile, side-by-side on md+ */}
                <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start">
                  {/* Module description */}
                  <div className="w-full md:w-1/3 space-y-3">
                    <div className="inline-flex h-12 w-12 md:h-16 md:w-16 items-center justify-center rounded-2xl bg-primary/10 mb-1">
                      <module.icon className="h-6 w-6 md:h-8 md:w-8 text-primary" />
                    </div>
                    <h3 className="text-xl md:text-2xl font-bold">{module.title}</h3>
                    <p className="text-muted-foreground leading-relaxed text-sm">{module.description}</p>
                  </div>

                  {/* Feature list */}
                  <div className="w-full md:w-2/3 bg-background/40 rounded-xl md:rounded-2xl p-4 md:p-6 border shadow-inner">
                    <h4 className="font-semibold mb-4 md:mb-6 flex items-center gap-2 text-sm md:text-base">
                      <Zap className="h-4 w-4 md:h-5 md:w-5 text-primary" /> Detail Modul
                    </h4>
                    {/* Single column on mobile, 2 cols on sm+ */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-4">
                      {module.features.map((feature, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-2 md:gap-3 p-2 md:p-3 rounded-xl hover:bg-muted/50 transition-colors border border-transparent hover:border-border"
                        >
                          <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary">
                            <Check className="h-3 w-3" />
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs md:text-sm font-medium leading-snug">{feature.name}</span>
                            {feature.status === "coming_soon" && (
                              <span className="ml-1 inline-block rounded text-[10px] bg-secondary/50 text-secondary-foreground px-1.5 py-0.5 font-semibold whitespace-nowrap">
                                Segera
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </section>


      {/* ====== CTA SECTION ====== */}
      <section className="container mx-auto px-4 py-12 md:py-20">
        <div className="glass rounded-[1.75rem] md:rounded-[2.5rem] p-8 md:p-20 text-center relative overflow-hidden border">
          <div className="absolute -top-20 -right-20 h-80 w-80 rounded-full orb-1 opacity-20 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-80 w-80 rounded-full orb-2 opacity-20 blur-3xl" />
          <div className="relative space-y-6 md:space-y-8 max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight leading-tight">
              Wujudkan Sekolah <br className="hidden sm:block" />
              <span className="text-gradient">Bertaraf Digital</span>
            </h2>
            <p className="text-muted-foreground text-sm md:text-lg">
              Tingkatkan kredibilitas dan operasional lembaga Anda bersama platform yang dirancang khusus untuk ekosistem pendidikan masa depan.
            </p>
            <div className="pt-2">
              <Link href="/daftarkan-sekolah">
                <Button
                  size="lg"
                  className="rounded-xl md:rounded-2xl btn-gradient text-white shadow-2xl glow-primary h-12 md:h-14 px-7 md:px-10 text-sm md:text-lg font-semibold gap-3 border-0 w-full sm:w-auto"
                >
                  Daftar & Mulai Sekarang <ArrowRight className="h-4 w-4 md:h-5 md:w-5" />
                </Button>
              </Link>
            </div>
            <p className="text-xs text-muted-foreground/60">Tanpa kartu kredit &bull; Setup instan 5 menit</p>
          </div>
        </div>
      </section>

      {/* ====== FOOTER ====== */}
      <footer className="border-t glass">
        <div className="container mx-auto px-4 py-6 md:py-8 text-sm text-muted-foreground">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-md btn-gradient text-white font-bold text-[10px]">
                S
              </div>
              <span className="font-semibold text-foreground">{platformName}</span>
            </div>

            <p className="text-center text-xs">
              &copy; {new Date().getFullYear()}{" "}
              <a href="https://schoolpro.id" className="hover:underline text-foreground">
                SchoolPro.id
              </a>
              . Hak cipta dilindungi.
            </p>

            <div className="flex gap-4 text-xs">
              <Link href="/kebijakan-privasi" className="hover:text-foreground transition-colors">
                Kebijakan Privasi
              </Link>
              <Link href="/syarat-ketentuan" className="hover:text-foreground transition-colors">
                Syarat & Ketentuan
              </Link>
              <Link href="/mitra-afiliasi" className="hover:text-foreground transition-colors font-medium text-primary">
                Program Afiliasi
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
