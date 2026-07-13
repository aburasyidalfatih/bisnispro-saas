import { notFound } from "next/navigation"
import { getTenantLayoutData, getTenantStaff, getTenantPosts } from "@/features/tenant/services/tenant-modular.service"
import { getPublicBasePath } from "@/lib/utils/public-path"
import { normalizeImageUrl } from "@/lib/utils"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, User, Briefcase, Mail, Globe, GraduationCap, BookOpen, MessageCircle, PenTool, Calendar, ChevronRight } from "lucide-react"


function slugify(text: string) {
  return text.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await params
  const tenant = await getTenantLayoutData(slug)
  if (!tenant) return {}
  
  const staffData = await getTenantStaff(slug)
  const staffSlugDecoded = decodeURIComponent(id)
  const staff = (staffData?.staff || []).find((s: any) => 
    s.id === id || slugify(s.name) === staffSlugDecoded
  )
  if (!staff) return {}
  
  return {
    title: `${staff.name} - ${tenant.name}`,
    description: (staff.bio ? staff.bio.replace(/<[^>]*>?/gm, '') : `Profil ${staff.name} (${staff.role}) di ${tenant.name}`),
    alternates: {
      canonical: `/gtk/${staff.id}`,
    },
  }
}

export default async function GTKDetailPage({ params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await params
  const tenant = await getTenantLayoutData(slug)
  if (!tenant) notFound()

  const staffData = await getTenantStaff(slug)
  const staffSlugDecoded = decodeURIComponent(id)
  const staff = (staffData?.staff || []).find((s: any) => 
    s.id === id || slugify(s.name) === staffSlugDecoded
  )
  if (!staff) notFound()

  const base = await getPublicBasePath(slug)

  // Custom Theme rendering
  if (tenant.customThemeId && tenant.customTheme?.staffDetailHtml) {
    const { renderCustomTheme } = await import("@/app/site/[slug]/_themes/custom-renderer")
    const rendered = renderCustomTheme({
      templateHtml: tenant.customTheme.staffDetailHtml,
      layoutHtml: tenant.customTheme.layoutHtml,
      customCss: tenant.customTheme.customCss,
      customJs: tenant.customTheme.customJs,
      context: { tenant, base, staff, settings: tenant.settings || {} },
    })
    if (rendered) return rendered
  }
  
  // Get articles written by this staff member
  let articles: any[] = []
  if (staff.userId) {
    const postsData = await getTenantPosts(slug)
    articles = (postsData?.posts || []).filter((p: any) => p.authorId === staff.userId)
  }

  return (
    <div className="bg-background min-h-screen pb-20">
      {/* ── HEADER SECTION ── */}
      <div className="relative pt-32 pb-24 overflow-hidden border-b border-border/30">
        {/* Background Decorative */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-blue-500/10 z-0" />
        <div className="absolute inset-0 z-0" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(0,0,0,0.05) 1px, transparent 0)', backgroundSize: '32px 32px' }}></div>
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[120px] translate-x-1/3 -translate-y-1/3 z-0 max-w-full" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[100px] -translate-x-1/3 translate-y-1/3 z-0 max-w-full" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

          <div className="flex flex-col md:flex-row gap-12 items-center md:items-start">
             
             {/* Profile Image with Glowing Ring */}
             <div className="relative shrink-0 group">
               <div className="absolute inset-0 bg-gradient-to-tr from-primary to-blue-500 rounded-full blur-2xl opacity-40 group-hover:opacity-60 transition-opacity duration-700"></div>
               <div className="w-48 h-48 md:w-56 md:h-56 relative rounded-full overflow-hidden border-[6px] border-white/80 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.2)] bg-white backdrop-blur-xl">
                 {normalizeImageUrl(staff.imageUrl) ? (
                   <Image 
                     src={normalizeImageUrl(staff.imageUrl)!} 
                     alt={staff.name} 
                     fill 
                     className="object-cover"
                     priority
                   />
                 ) : (
                   <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                     <span className="text-7xl font-black text-primary/40 uppercase">
                       {staff.name.charAt(0)}
                     </span>
                   </div>
                 )}
               </div>
             </div>

             <div className="flex-1 text-center md:text-left pt-2 md:pt-6">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary font-bold tracking-widest uppercase text-xs mb-5 border border-primary/20 backdrop-blur-md shadow-sm">
                   <Briefcase className="h-3.5 w-3.5" />
                   {staff.role}
                </div>
                <h1 className="text-4xl md:text-6xl font-black text-slate-900 leading-tight tracking-tighter mb-8 drop-shadow-sm">
                   {staff.name}
                </h1>
                
                {/* Social / Contact Buttons (Elegant Monochrome) */}
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">

                   {staff.instagram && (
                     <a href={staff.instagram} target="_blank" rel="noreferrer" className="flex items-center justify-center w-11 h-11 rounded-full bg-white/80 backdrop-blur-sm border border-slate-200/60 text-slate-400 hover:bg-pink-500 hover:text-white hover:border-pink-500 hover:-translate-y-1 transition-all duration-300 shadow-[0_4px_14px_0_rgb(0,0,0,0.05)] group/icon">
                       <svg className="h-4 w-4 text-slate-400 group-hover/icon:text-white transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
                     </a>
                   )}
                   {staff.facebook && (
                     <a href={staff.facebook} target="_blank" rel="noreferrer" className="flex items-center justify-center w-11 h-11 rounded-full bg-white/80 backdrop-blur-sm border border-slate-200/60 text-slate-400 hover:bg-blue-600 hover:text-white hover:border-blue-600 hover:-translate-y-1 transition-all duration-300 shadow-[0_4px_14px_0_rgb(0,0,0,0.05)] group/icon">
                       <svg className="h-4 w-4 text-slate-400 group-hover/icon:text-white transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
                     </a>
                   )}
                   {staff.youtube && (
                     <a href={staff.youtube} target="_blank" rel="noreferrer" className="flex items-center justify-center w-11 h-11 rounded-full bg-white/80 backdrop-blur-sm border border-slate-200/60 text-slate-400 hover:bg-red-600 hover:text-white hover:border-red-600 hover:-translate-y-1 transition-all duration-300 shadow-[0_4px_14px_0_rgb(0,0,0,0.05)] group/icon">
                       <svg className="h-4 w-4 text-slate-400 group-hover/icon:text-white transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"/><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"/></svg>
                     </a>
                   )}
                   {staff.tiktok && (
                     <a href={staff.tiktok} target="_blank" rel="noreferrer" className="flex items-center justify-center w-11 h-11 rounded-full bg-white/80 backdrop-blur-sm border border-slate-200/60 text-slate-400 hover:bg-slate-900 hover:text-white hover:border-slate-900 hover:-translate-y-1 transition-all duration-300 shadow-[0_4px_14px_0_rgb(0,0,0,0.05)] group/icon">
                       <svg className="h-4 w-4 text-slate-400 group-hover/icon:text-white transition-colors" viewBox="0 0 24 24" fill="currentColor">
                         <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                       </svg>
                     </a>
                   )}
                </div>
             </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-4 md:mt-8">
        <div className="grid md:grid-cols-3 gap-10 items-start">
           
           <div className="md:col-span-2 space-y-12">
              <section className="prose prose-lg max-w-none text-slate-600 leading-relaxed bg-white p-8 md:p-10 rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100/60 relative overflow-hidden">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-[40px] -translate-y-1/2 translate-x-1/2"></div>
                 <h3 className="text-2xl font-black mb-8 text-slate-900 flex items-center gap-3 relative z-10">
                    <User className="h-6 w-6 text-primary" /> Profil & Biografi
                 </h3>
                 <div className="absolute top-20 left-6 text-[120px] leading-none text-slate-100 font-serif opacity-50 z-0">"</div>
                 {staff.bio ? (
                   <div 
                     className="whitespace-pre-wrap text-base md:text-lg prose prose-slate text-slate-600 prose-p:leading-loose relative z-10" 
                     dangerouslySetInnerHTML={{ __html: staff.bio }} 
                   />
                 ) : (
                   <p className="whitespace-pre-wrap text-base md:text-lg leading-loose text-slate-600 relative z-10">
                      Berkomitmen penuh untuk mendidik dan membimbing siswa-siswi menuju masa depan yang cerah dengan bekal ilmu dan akhlak mulia.
                   </p>
                 )}
              </section>

              {/* ── ARTIKEL GURU ── */}
              {articles.length > 0 && (
                <section>
                   <h3 className="text-2xl font-black mb-6 text-slate-900 flex items-center gap-3 px-2">
                      <PenTool className="h-6 w-6 text-primary" /> Artikel & Tulisan
                   </h3>
                   <div className="grid sm:grid-cols-2 gap-6">
                      {articles.map((post: any) => (
                        <Link href={`${base}/berita/${post.slug}`} key={post.id} className="group bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] transition-all duration-500 hover:-translate-y-1 flex flex-col">
                           <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
                              {normalizeImageUrl(post.featuredImage) ? (
                                <Image src={normalizeImageUrl(post.featuredImage)!} alt={post.title} fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
                              ) : (
                                <div className="absolute inset-0 bg-primary/5 flex items-center justify-center">
                                  <BookOpen className="h-10 w-10 text-primary/20" />
                                </div>
                              )}
                           </div>
                           <div className="p-6 flex flex-col flex-1 relative">
                              <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium mb-3">
                                 <Calendar className="h-3.5 w-3.5" />
                                 {new Date(post.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                              </div>
                              <h4 className="font-bold text-lg text-slate-900 mb-3 line-clamp-2 group-hover:text-primary transition-colors">
                                {post.title}
                              </h4>
                              <div className="mt-auto pt-4 border-t border-slate-100 flex items-center text-sm font-semibold text-primary">
                                 Baca selengkapnya <ChevronRight className="h-4 w-4 ml-1 transition-transform duration-300 group-hover:translate-x-1.5" />
                              </div>
                           </div>
                        </Link>
                      ))}
                   </div>
                </section>
              )}
           </div>

           <div className="space-y-8 sticky top-32">
              <div className="relative rounded-[2.5rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-white/80 bg-white/60 backdrop-blur-2xl overflow-hidden group">
                 {/* Decorative elements */}
                 <div className="absolute top-0 right-0 w-40 h-40 bg-primary/10 rounded-full blur-[40px] -translate-y-1/2 translate-x-1/3 transition-transform duration-700 group-hover:scale-110"></div>
                 <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/10 rounded-full blur-[40px] translate-y-1/3 -translate-x-1/3"></div>
                 
                 <h4 className="font-black text-xl mb-8 text-slate-900 flex items-center gap-3 relative z-10">
                    Informasi Akademik
                 </h4>
                 
                 <ul className="space-y-8 relative z-10">
                    <li className="flex items-start gap-5 group/item">
                       <div className="h-14 w-14 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-blue-500 shrink-0 shadow-sm group-hover/item:bg-blue-50 group-hover/item:text-blue-600 group-hover/item:border-blue-100 transition-all duration-300">
                          <BookOpen className="h-6 w-6" />
                       </div>
                       <div className="flex-1 pt-1">
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Mata Pelajaran</p>
                          <p className="font-bold text-slate-800 text-base leading-tight">{staff.subject || "Guru Kelas / Umum"}</p>
                       </div>
                    </li>
                    
                    <div className="h-px w-full bg-gradient-to-r from-transparent via-slate-200 to-transparent"></div>
                    
                    <li className="flex items-start gap-5 group/item">
                       <div className="h-14 w-14 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-primary shrink-0 shadow-sm group-hover/item:bg-primary/5 group-hover/item:border-primary/20 transition-all duration-300">
                          <GraduationCap className="h-6 w-6" />
                       </div>
                       <div className="flex-1 pt-1">
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Pendidikan</p>
                          <p className="font-bold text-slate-800 text-base leading-tight">{staff.education || "S1 Pendidikan"}</p>
                       </div>
                    </li>
                 </ul>
              </div>
           </div>
           
        </div>
      </div>
    </div>
  )
}
