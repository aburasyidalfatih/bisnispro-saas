import { Bot, Check, Database, Globe, PiggyBank, School, Wallet, Users, Zap } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const featureModules = [
  {
    id: "website",
    title: "Website Sekolah Gratis",
    icon: Globe,
    description: "Pondasi digital sekolah Anda. Dapatkan web sekolah gratis dengan desain profesional tanpa biaya server.",
    features: [
      { name: "Profil Sekolah & Sejarah", status: "ready" },
      { name: "Manajemen Fasilitas & Ekstrakurikuler", status: "ready" },
      { name: "Galeri Kegiatan & Prestasi", status: "ready" },
      { name: "Daftar Guru & Tenaga Kependidikan", status: "ready" },
      { name: "Optimasi SEO (Mudah dicari di Google)", status: "ready" },
    ],
  },
  {
    id: "informasi",
    title: "Pusat Informasi (Gratis)",
    icon: Users,
    description: "Portal komunikasi satu arah yang elegan antara sekolah dan masyarakat.",
    features: [
      { name: "Berita & Artikel Sekolah", status: "ready" },
      { name: "Papan Pengumuman Resmi", status: "ready" },
      { name: "Agenda Kegiatan Sekolah", status: "ready" },
      { name: "Integrasi Kontak WhatsApp", status: "ready" },
    ],
  },
  {
    id: "data",
    title: "Big Data Dasar (Gratis)",
    icon: Database,
    description: "Pusat data dasar untuk mengelola entitas operasional ringan.",
    features: [
      { name: "Kelola Data Siswa Dasar", status: "ready" },
      { name: "Kelola Data Guru & Pegawai", status: "ready" },
      { name: "Ekspor/Impor Data via Excel", status: "ready" },
    ],
  },
  {
    id: "ppdb",
    title: "PPDB Smart Hub (Ekspansi Pro)",
    icon: Zap,
    description: "Tingkatkan website Anda dengan sistem otomasi penerimaan siswa baru.",
    features: [
      { name: "Portal Pendaftaran Mandiri", status: "ready" },
      { name: "Auto-Generate Tagihan Formulir", status: "ready" },
      { name: "Sistem Seleksi & Pengumuman Lulus", status: "ready" },
      { name: "Sinkronisasi Langsung ke Master Siswa", status: "ready" },
    ],
  },
  {
    id: "keuangan",
    title: "Core Banking & Tagihan (Ekspansi Pro)",
    icon: Wallet,
    description: "Ekosistem finansial tingkat lanjut untuk menekan tunggakan SPP.",
    features: [
      { name: "Tagihan SPP Massal Otomatis", status: "ready" },
      { name: "Auto-Reminder Jatuh Tempo via WA", status: "ready" },
      { name: "Pembayaran Online (Payment Gateway)", status: "ready" },
      { name: "Pembukuan Buku Kas Umum (BKU)", status: "ready" },
    ],
  },
  {
    id: "tabungan",
    title: "E-Kantin & Tabungan (Ekspansi Pro)",
    icon: PiggyBank,
    description: "Digitalisasi transaksi kantin sekolah (Cashless) berbasis QR Code.",
    features: [
      { name: "Dompet Digital per Siswa", status: "ready" },
      { name: "Limit Belanja Harian", status: "ready" },
      { name: "Transaksi via QR Code Scanner", status: "ready" },
      { name: "Notifikasi Saldo ke Ortu via WA", status: "ready" },
    ],
  },
  {
    id: "ai",
    title: "AI Analytics (Ekspansi Pro)",
    icon: Bot,
    description: "Asisten kecerdasan buatan untuk membantu manajemen pengurus yayasan.",
    features: [
      { name: "Chatbot Analis Keuangan", status: "coming_soon" },
      { name: "Prediksi Penurunan Kinerja", status: "coming_soon" },
      { name: "Generator Draf Surat Resmi", status: "coming_soon" },
    ],
  },
]

export function FeaturesSection() {
  return (
    <section id="fitur" className="container mx-auto px-4 py-10 md:py-16">
      <div className="text-center mb-10 md:mb-16 space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-xs md:text-sm text-primary font-medium">
          <School className="h-3.5 w-3.5" />
          Modul Lengkap
        </div>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">
          Mulai dari Website, Tumbuh Menjadi Ekosistem
        </h2>
        <p className="text-muted-foreground text-sm md:text-lg max-w-2xl mx-auto px-2">
          Nikmati fasilitas website gratis selamanya. Kapan pun sekolah Anda siap, upgrade ke fitur Pro (PPDB,
          Keuangan, Tabungan) hanya dengan satu klik di dalam dasbor.
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
  )
}
