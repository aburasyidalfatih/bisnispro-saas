import { PageHeader } from "@/app/site/[slug]/_components/page-header"
import { notFound } from "next/navigation"
import { GraduationCap, Quote, MessageCircle, ExternalLink, Heart, Star, Award } from "lucide-react"
import { getTenantLayoutData, getTenantAlumni } from "@/features/tenant/services/tenant-modular.service"
import { getPublicBasePath } from "@/lib/utils/public-path"
import { OptimizedImage } from "@/components/ui/optimized-image"
import { cn, normalizeImageUrl } from "@/lib/utils"

export const revalidate = 60;


export default async function AlumniPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const tenant = await getTenantLayoutData(slug)
  
  if (!tenant) notFound()

  const alumniData = await getTenantAlumni(slug)
  const alumni = alumniData?.alumni || []
  const base = await getPublicBasePath(slug)

  // Custom Theme rendering
  if (tenant.customThemeId && tenant.customTheme?.alumniHtml) {
    const { renderCustomTheme } = await import("@/app/site/[slug]/_themes/custom-renderer")
    const rendered = renderCustomTheme({
      templateHtml: tenant.customTheme.alumniHtml,
      layoutHtml: tenant.customTheme.layoutHtml,
      customCss: tenant.customTheme.customCss,
      customJs: tenant.customTheme.customJs,
      context: { tenant: { ...tenant, alumni }, base, settings: tenant.settings || {} },
    })
    if (rendered) return rendered
  }

  return (
    <div className="bg-background min-h-screen">
      {/* ── HERO SECTION ── */}
      <PageHeader
        title="Jejak Langkah Alumni"
        description="Melihat kontribusi dan kesuksesan para lulusan kami yang kini telah berkiprah di berbagai bidang dan institusi ternama."
        breadcrumbs={[
          { label: "Galeri & Alumni" },
          { label: "Alumni Success Stories" }
        ]}
      />

      {/* ── STATISTICS BAR ── */}
      <section className="py-12 bg-muted/40 border-b border-border/50">
         <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-wrap justify-center gap-8 md:gap-20">
            {[
              { label: "Total Lulusan", value: "2.500+" },
              { label: "Melanjutkan Studi", value: "85%" },
              { label: "Bekerja & Berwirausaha", value: "15%" },
              { label: "Mitra Universitas", value: "50+" },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                 <div className="text-2xl font-black text-primary leading-none mb-1">{stat.value}</div>
                 <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{stat.label}</div>
              </div>
            ))}
         </div>
      </section>

      {/* ── ALUMNI GRID & TESTIMONIALS ── */}
      <section className="py-12 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-3 gap-16">
          
          {/* Left Column: Testimonial Feed */}
          <div className="lg:col-span-2 space-y-12">
            <div className="flex items-center gap-4 mb-8">
               <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center text-white">
                  <Quote className="h-6 w-6" />
               </div>
               <div>
                  <h2 className="text-3xl font-bold">Apa Kata Mereka?</h2>
                  <p className="text-muted-foreground">Testimoni tulus dari para alumni tentang perjalanan mereka.</p>
               </div>
            </div>

            {alumni.length > 0 ? (
              <div className="grid gap-8">
                {alumni.map((item: any) => (
                  <div 
                    key={item.id} 
                    className="relative bg-white p-8 md:p-10 rounded-[2.5rem] border border-border shadow-sm hover:shadow-xl transition-all group"
                  >
                    <div className="absolute -top-4 -left-4 h-12 w-12 bg-amber-400 rounded-2xl flex items-center justify-center text-white shadow-lg opacity-0 group-hover:opacity-100 transition-all rotate-[-10deg] group-hover:rotate-0">
                       <Star className="h-6 w-6 fill-white" />
                    </div>
                    
                    <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
                      <div className="relative h-20 w-20 rounded-2xl overflow-hidden shadow-md shrink-0 border-2 border-primary/10">
                        <OptimizedImage 
                          src={item.imageUrl || "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=1974"} 
                          alt={item.name} 
                          fill 
                          className="object-cover" 
                        />
                      </div>
                      <div>
                        <h4 className="font-bold text-xl">{item.name}</h4>
                        <p className="text-sm text-primary font-bold">Lulusan Tahun {item.graduationYear}</p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                           <Award className="h-3.5 w-3.5" /> {item.currentStatus || "Bekerja"} di {item.institutionName || "Perusahaan / Universitas"}
                        </div>
                      </div>
                    </div>

                    <div className="mt-8 relative">
                       <Quote className="absolute -top-4 -left-2 h-12 w-12 text-primary/5 -z-10" />
                       <p className="text-lg text-slate-700 leading-relaxed italic relative z-10">
                         "{item.testimonial || "Pendidikan di sekolah ini bukan hanya tentang nilai di atas kertas, tapi tentang bagaimana menjadi manusia yang bermanfaat dan memiliki integritas tinggi. Saya bangga menjadi bagian dari keluarga besar ini."}"
                       </p>
                    </div>

                    <div className="mt-8 pt-8 border-t border-border/50 flex items-center justify-between">
                       <div className="flex items-center gap-4">
                          <div className="flex -space-x-1">
                             {[1,2,3,4,5].map(i => (
                                <Star key={i} className="h-3 w-3 text-amber-500 fill-amber-500" />
                             ))}
                          </div>
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Verified Alumni</span>
                       </div>
                       <button className="text-primary hover:text-primary/80 transition-colors">
                          <ExternalLink className="h-4 w-4" />
                       </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-muted/20 rounded-[2.5rem] border border-dashed border-border">
                <MessageCircle className="h-12 w-12 text-primary/30 mx-auto mb-4" />
                <h3 className="text-xl font-bold">Testimoni Belum Tersedia</h3>
                <p className="text-muted-foreground mt-2">Daftar testimoni alumni sedang dalam proses pengumpulan.</p>
              </div>
            )}
          </div>

          {/* Right Column: Alumni Success Grid (Sidebar style) */}
          <div className="space-y-12">
            <div>
               <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
                  <GraduationCap className="h-6 w-6 text-primary" /> Alumni Berjaya
               </h3>
               <div className="grid gap-4">
                  {alumni.slice(0, 4).map((item: any) => (
                    <div key={item.id} className="p-4 bg-muted/30 rounded-2xl border border-transparent hover:border-primary/20 hover:bg-white transition-all">
                       <div className="flex gap-4 items-center">
                          <div className="h-12 w-12 rounded-xl overflow-hidden shrink-0">
                             <img 
                               src={normalizeImageUrl(item.imageUrl) || item.imageUrl || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1974"} 
                               alt={item.name} 
                               className="h-full w-full object-cover" 
                             />
                          </div>
                          <div>
                             <h5 className="font-bold text-sm leading-tight">{item.name}</h5>
                             <p className="text-[10px] text-muted-foreground">{item.institutionName || "Mitra Institusi"}</p>
                          </div>
                       </div>
                    </div>
                  ))}
               </div>
            </div>

            <div className="bg-primary/5 rounded-[2.5rem] p-8 border border-primary/10">
               <Heart className="h-10 w-10 text-primary mb-6" />
               <h3 className="text-xl font-bold mb-4">Update Data Alumni</h3>
               <p className="text-sm text-muted-foreground leading-relaxed mb-8">
                  Apakah Anda alumni kami? Mari tetap terhubung dan bagikan kabar gembira Anda untuk menginspirasi adik-adik kelas.
               </p>
               <a 
                 href={`${base}/contact`} 
                 className="block text-center w-full py-3 bg-primary text-white rounded-xl font-bold text-sm hover:shadow-lg transition-all"
               >
                 Isi Tracer Study
               </a>
            </div>

            <div className="relative rounded-[2.5rem] overflow-hidden group">
               <OptimizedImage 
                 src="https://images.unsplash.com/photo-1523580494863-6f3031224c94?q=80&w=2070" 
                 alt="Graduation" 
                 width={400} 
                 height={600} 
                 className="object-cover aspect-[3/4] group-hover:scale-105 transition-transform duration-700" 
               />
               <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-8 text-white">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] mb-2 text-primary">Class of 2024</p>
                  <h4 className="text-2xl font-black">Bersiaplah Menjadi Bagian dari Mereka</h4>
               </div>
            </div>
          </div>

        </div>
      </section>

      {/* ── FOOTER HIGHLIGHT ── */}
      <section className="py-20 bg-slate-900 text-white text-center relative overflow-hidden">
         <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
         <div className="relative z-10 max-w-4xl mx-auto px-4">
            <h2 className="text-3xl md:text-5xl font-black mb-8 leading-tight">Mendidik dengan Hati, <br/> Mencetak Generasi Berprestasi</h2>
            <div className="flex justify-center gap-6">
               <a href={`${base}/contact`} className="px-10 py-4 bg-primary rounded-full font-bold hover:scale-105 transition-transform">PPDB Sekarang</a>
               <a href={`${base}/`} className="px-10 py-4 bg-white/10 backdrop-blur-md rounded-full font-bold hover:bg-white/20 transition-all border border-white/20">Tentang Kami</a>
            </div>
         </div>
      </section>
    </div>
  )
}
