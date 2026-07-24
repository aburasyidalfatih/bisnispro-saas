import { Bot, Check, Database, Globe, PenTool, TrendingUp, Images, MessageCircle, LayoutTemplate } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const featureModules = [
  {
    id: "website",
    title: "Custom Domain & Branding",
    icon: Globe,
    description: "Pondasi digital bisnis Anda. Dapatkan web perusahaan dengan domain custom dan branding profesional.",
    features: [
      { name: "Profil Perusahaan & Visi Misi", status: "ready" },
      { name: "Layanan & Produk", status: "ready" },
      { name: "Integrasi Custom Domain", status: "ready" },
      { name: "Tim & Karyawan", status: "ready" },
      { name: "Optimasi Mobile & Cepat", status: "ready" },
    ],
  },
  {
    id: "seo",
    title: "SEO Otomatis",
    icon: TrendingUp,
    description: "Mudah ditemukan oleh calon klien di Google dengan fitur SEO otomatis kami.",
    features: [
      { name: "Auto Meta Tags", status: "ready" },
      { name: "Sitemap Generator", status: "ready" },
      { name: "Optimasi Kecepatan", status: "ready" },
      { name: "Schema Markup Bisnis", status: "ready" },
    ],
  },
  {
    id: "blog",
    title: "Blog & CMS",
    icon: PenTool,
    description: "Tingkatkan engagement dan trafik dengan mempublikasikan artikel dan berita terbaru.",
    features: [
      { name: "Sistem Manajemen Konten", status: "ready" },
      { name: "Kategori & Tag", status: "ready" },
      { name: "Komentar & Interaksi", status: "ready" },
    ],
  },
  {
    id: "portfolio",
    title: "Portofolio & Galeri",
    icon: Images,
    description: "Tampilkan karya terbaik, proyek, atau galeri foto layanan Anda secara elegan.",
    features: [
      { name: "Grid & Masonry Layout", status: "ready" },
      { name: "Detail Proyek & Studi Kasus", status: "ready" },
      { name: "Testimoni Klien", status: "ready" },
      { name: "Integrasi Video", status: "ready" },
    ],
  },
  {
    id: "whatsapp",
    title: "WhatsApp Integration",
    icon: MessageCircle,
    description: "Konversi pengunjung menjadi pelanggan dengan tombol chat WhatsApp langsung.",
    features: [
      { name: "Floating WhatsApp Button", status: "ready" },
      { name: "Form Lead ke WhatsApp", status: "ready" },
      { name: "Multi Agen CS", status: "ready" },
      { name: "Template Pesan Otomatis", status: "ready" },
    ],
  },
  {
    id: "template",
    title: "Multi Template",
    icon: LayoutTemplate,
    description: "Pilih desain terbaik untuk jenis industri dan brand identity Anda.",
    features: [
      { name: "Tema Startup & Teknologi", status: "ready" },
      { name: "Tema F&B dan Restoran", status: "ready" },
      { name: "Tema Kreatif & Agensi", status: "ready" },
      { name: "Tema Jasa Profesional", status: "ready" },
    ],
  },
  {
    id: "ai",
    title: "AI Copywriter",
    icon: Bot,
    description: "Asisten kecerdasan buatan untuk membantu menulis konten website Anda.",
    features: [
      { name: "Generator Deskripsi Layanan", status: "ready" },
      { name: "Pembuat Artikel Blog", status: "coming_soon" },
      { name: "Saran Tagline & Headline", status: "ready" },
    ],
  },
]

export function FeaturesSection() {
  return (
    <section id="fitur" className="container mx-auto px-4 py-10 md:py-16">
      <div className="text-center mb-10 md:mb-16 space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-xs md:text-sm text-primary font-medium">
          <Globe className="h-3.5 w-3.5" />
          Fitur Lengkap
        </div>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">
          Website Bisnis Modern dengan Fitur Canggih
        </h2>
        <p className="text-muted-foreground text-sm md:text-lg max-w-2xl mx-auto px-2">
          Nikmati fasilitas website modern. Tingkatkan konversi dan kredibilitas bisnis Anda dengan fitur-fitur profesional kami.
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
                    <Check className="h-4 w-4 md:h-5 md:w-5 text-primary" /> Detail Fitur
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
