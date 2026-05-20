import { PageHeader } from "@/app/site/[slug]/_components/page-header"
import { notFound } from "next/navigation"
import { Trophy, Calendar, Medal, Award, Star } from "lucide-react"
import { getPublicTenantBySlug } from "@/features/tenant/services/tenant-public.service"
import { OptimizedImage } from "@/components/ui/optimized-image"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import Link from "next/link"
import { getPublicBasePath } from "@/lib/utils/public-path"
import { renderCustomTheme } from "@/app/site/[slug]/_themes/custom-renderer"

export default async function PrestasiPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const tenant = await getPublicTenantBySlug(slug)
  
  if (!tenant) notFound()

  const achievements = tenant.achievements || []
  const base = await getPublicBasePath(slug)

  // Custom Theme rendering
  if (tenant.customThemeId && tenant.customTheme?.achievementHtml) {
    const rendered = renderCustomTheme({
      templateHtml: tenant.customTheme.achievementHtml,
      layoutHtml: tenant.customTheme.layoutHtml,
      customCss: tenant.customTheme.customCss,
      customJs: tenant.customTheme.customJs,
      context: { tenant: { ...tenant, achievements }, base, settings: tenant.settings || {} },
    })
    if (rendered) return rendered
  }

  return (
    <div className="bg-background min-h-screen">
      {/* ── HERO SECTION ── */}
      <PageHeader
        title="Prestasi & Penghargaan"
        description="Membanggakan dan Inspiratif. Catatan perjalanan siswa dan institusi dalam meraih keunggulan di berbagai bidang."
        breadcrumbs={[
          { label: "Galeri & Alumni" },
          { label: "School Hall of Fame" }
        ]}
      />

      {/* ── MAIN CONTENT ── */}
      <section className="py-20 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {achievements.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {achievements.map((item: any, index: number) => (
              <Link 
                href={`${base}/prestasi/${item.id}`}
                key={item.id} 
                className="group relative flex flex-col bg-white rounded-[2rem] overflow-hidden border border-border shadow-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-2"
              >
                {/* Image & Badge */}
                <div className="relative aspect-[4/3] overflow-hidden">
                  <OptimizedImage
                    src={item.imageUrl || "https://images.unsplash.com/photo-1578574515318-de1f8553dae0?q=80&w=2070"}
                    alt={item.title}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute top-4 left-4 bg-primary text-white px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">
                    {item.level || "NASIONAL"}
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
                  
                  <div className="absolute bottom-6 left-6 right-6 text-white">
                     <div className="flex items-center gap-2 mb-2 opacity-80 text-[10px] font-bold">
                        <Calendar className="h-3 w-3" />
                        {item.date ? format(new Date(item.date), "dd MMMM yyyy", { locale: id }) : "Baru-baru ini"}
                     </div>
                     <h3 className="text-xl font-bold leading-tight line-clamp-2">
                        {item.title}
                     </h3>
                  </div>
                </div>
                
                {/* Content Details */}
                <div className="p-8 flex flex-col flex-grow bg-gradient-to-b from-white to-muted/20">
                  <p className="text-muted-foreground text-sm leading-relaxed mb-8 flex-grow line-clamp-5">
                    {item.description || "Pencapaian luar biasa yang diraih oleh siswa kami melalui dedikasi dan kerja keras yang tinggi."}
                  </p>
                  
                  <div className="flex items-center justify-between">
                     <div className="flex -space-x-2">
                        {[1, 2, 3].map((i) => (
                           <div key={i} className="h-8 w-8 rounded-full border-2 border-white bg-muted flex items-center justify-center overflow-hidden">
                              <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                           </div>
                        ))}
                     </div>
                     <div className="text-primary font-bold text-xs flex items-center gap-1 group-hover:gap-2 transition-all">
                        Detail Prestasi <Award className="h-4 w-4" />
                     </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-24 bg-muted/20 rounded-[3rem] border border-dashed border-border flex flex-col items-center">
            <div className="bg-primary/10 h-24 w-24 rounded-full flex items-center justify-center mb-6">
              <Trophy className="h-12 w-12 text-primary animate-pulse" />
            </div>
            <h3 className="text-2xl font-bold">Terus Berproses Menuju Juara</h3>
            <p className="text-muted-foreground mt-3 max-w-md mx-auto text-lg leading-relaxed">
              Daftar prestasi sedang dalam proses pembaruan. Nantikan kabar gembira dari siswa-siswi terbaik kami segera!
            </p>
          </div>
        )}
      </section>

      {/* ── MOTIVATIONAL FOOTER ── */}
      <section className="py-24 bg-dark text-white relative overflow-hidden bg-slate-900">
         <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20" />
         <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
            <QuoteIcon className="h-12 w-12 text-primary mx-auto mb-8 opacity-50" />
            <h2 className="text-3xl md:text-4xl font-extrabold italic leading-tight mb-8">
               "Prestasi bukanlah akhir, melainkan awal dari tanggung jawab yang lebih besar untuk terus berkarya."
            </h2>
            <div className="h-1 w-20 bg-primary mx-auto mb-8" />
            <p className="text-primary font-black uppercase tracking-[0.3em] text-sm">Visi Unggul SchoolPro</p>
         </div>
      </section>
    </div>
  )
}

function QuoteIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="currentColor"
        >
            <path d="M14.017 21L14.017 18C14.017 16.8954 14.9124 16 16.017 16H19.017C19.5693 16 20.017 15.5523 20.017 15V9C20.017 8.44772 19.5693 8 19.017 8H16.017C14.9124 8 14.017 7.10457 14.017 6V3L22.017 3V15C22.017 18.3137 19.3307 21 16.017 21H14.017ZM3.01693 21L3.01693 18C3.01693 16.8954 3.91236 16 5.01693 16H8.01693C8.56921 16 9.01693 15.5523 9.01693 15V9C9.01693 8.44772 8.56921 8 8.01693 8H5.01693C3.91236 8 3.01693 7.10457 3.01693 6V3L11.0169 3V15C11.0169 18.3137 8.33066 21 5.01693 21H3.01693Z" />
        </svg>
    )
}
