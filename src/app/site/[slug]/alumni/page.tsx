import { PageHeader } from "@/app/site/[slug]/_components/page-header"
import { notFound } from "next/navigation"
import { GraduationCap, Quote, MessageCircle, ExternalLink, Heart, Star, Award } from "lucide-react"
import { getTenantLayoutData, getTenantAlumni } from "@/features/tenant/services/tenant-modular.service"
import { getPublicBasePath } from "@/lib/utils/public-path"
import { OptimizedImage } from "@/components/ui/optimized-image"
import { cn, normalizeImageUrl } from "@/lib/utils"
import { AlumniSubmissionForm } from "./_components/alumni-submission-form"


export default async function AlumniPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const tenant = await getTenantLayoutData(slug)
  
  if (!tenant) notFound()

  const alumniData = await getTenantAlumni(slug)
  const alumni = (alumniData as any)?.alumni || []
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
        title={tenant.settings?.labels?.alumni?.sectionTitle || "Jejak Langkah Alumni"}
        description={tenant.settings?.labels?.alumni?.sectionSubtitle || "Melihat kontribusi dan kesuksesan para lulusan kami yang kini telah berkiprah di berbagai bidang dan institusi ternama."}
        breadcrumbs={[
          { label: "Galeri & Alumni" },
          { label: "Alumni Success Stories" }
        ]}
      />


      {/* ── ALUMNI GRID & TESTIMONIALS ── */}
      <section className="py-12 mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="space-y-12">
            <div className="flex items-center gap-4 mb-8">
               <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center text-white">
                  <Quote className="h-6 w-6" />
               </div>
               <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                 <div>
                    <h2 className="text-3xl font-bold">Apa Kata Mereka?</h2>
                    <p className="text-muted-foreground">Testimoni tulus dari para alumni tentang perjalanan mereka.</p>
                 </div>
                 <AlumniSubmissionForm tenantId={tenant.id} />
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
                         "{item.testimonial}"
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
      </section>

      {/* ── FOOTER HIGHLIGHT ── */}
      <section className="py-20 bg-slate-900 text-white text-center relative overflow-hidden">
         <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
         <div className="relative z-10 max-w-4xl mx-auto px-4">
            <h2 className="text-3xl md:text-5xl font-black mb-8 leading-tight">
              {tenant.tagline ? (
                <>{tenant.tagline}</>
              ) : (
                <>Mendidik dengan Hati, <br/> Mencetak Generasi Berprestasi</>
              )}
            </h2>
            <div className="flex justify-center gap-4 md:gap-6 flex-wrap">
               <a href={(tenant.settings as any)?.ppdbUrl ? String((tenant.settings as any).ppdbUrl) : `${base}/contact`} className="px-8 md:px-10 py-3 md:py-4 bg-primary rounded-full font-bold hover:scale-105 transition-transform text-sm md:text-base">{(tenant.settings as any)?.ppdbUrl ? "PPDB Sekarang" : "Hubungi Kami"}</a>
               <a href={`${base}/`} className="px-8 md:px-10 py-3 md:py-4 bg-white/10 backdrop-blur-md rounded-full font-bold hover:bg-white/20 transition-all border border-white/20 text-sm md:text-base">Tentang Kami</a>
            </div>
         </div>
      </section>
    </div>
  )
}
