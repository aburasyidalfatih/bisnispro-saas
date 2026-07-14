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
        title={(tenant.settings as any)?.labels?.alumni?.sectionTitle || "Jejak Langkah Alumni"}
        description={(tenant.settings as any)?.labels?.alumni?.sectionSubtitle || "Melihat kontribusi dan kesuksesan para lulusan kami yang kini telah berkiprah di berbagai bidang dan institusi ternama."}
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
                        <div className="flex flex-col gap-2 mt-1">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                             <Award className="h-3.5 w-3.5" /> {item.currentStatus || "Bekerja"} di {item.institutionName || "Perusahaan / Universitas"}
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            {item.instagram && (
                              <a href={item.instagram} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-pink-500 transition-colors" title="Instagram">
                                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
                              </a>
                            )}
                            {item.facebook && (
                              <a href={item.facebook} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-blue-600 transition-colors" title="Facebook">
                                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
                              </a>
                            )}
                            {item.youtube && (
                              <a href={item.youtube} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-red-600 transition-colors" title="YouTube">
                                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"/><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"/></svg>
                              </a>
                            )}
                            {item.tiktok && (
                              <a href={item.tiktok} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-slate-900 transition-colors" title="TikTok">
                                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/></svg>
                              </a>
                            )}
                            {item.linkedin && (
                              <a href={item.linkedin} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-blue-600 transition-colors" title="LinkedIn">
                                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>
                              </a>
                            )}
                            {item.twitter && (
                              <a href={item.twitter} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-slate-900 transition-colors" title="Twitter / X">
                                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>
                              </a>
                            )}
                            {item.pinterest && (
                              <a href={item.pinterest} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-red-600 transition-colors" title="Pinterest">
                                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 22s-2-5.5-2-9c0-1.6 1.4-3 3-3s3 1.4 3 3c0 2.2-1.7 4-3.5 4-2 0-3.5-1.5-3.5-3.5C9 10 10.5 8 12.5 8 15 8 17 10 17 12.5 17 16 15 19.5 12 22z"/></svg>
                              </a>
                            )}
                          </div>
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
