import { notFound } from "next/navigation"
import { getTenantLayoutData, getTenantPosts } from "@/features/tenant/services/tenant-modular.service"
import { db } from "@/lib/db"
import { getPublicBasePath } from "@/lib/utils/public-path"
import { normalizeImageUrl } from "@/lib/utils"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, User, Briefcase, Mail, Globe, GraduationCap, BookOpen, MessageCircle, PenTool, Calendar, ChevronRight } from "lucide-react"
import { SiteBreadcrumbs } from "@/app/site/[slug]/_components/site-breadcrumbs"


function slugify(text: string) {
  return text.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await params
  const tenant = await getTenantLayoutData(slug)
  if (!tenant) return {}
  
  const teamMembersData = await db.teamMember.findMany({ where: { tenant: { slug } } })
  const staffSlugDecoded = decodeURIComponent(id)
  const staff = (teamMembersData || []).find((s: any) => 
    s.id === id || slugify(s.name) === staffSlugDecoded
  )
  if (!staff) return {}
  
  return {
    title: `${staff.name} - ${tenant.name}`,
    description: (staff.bio ? staff.bio.replace(/<[^>]*>?/gm, '') : `Profil ${staff.name} (${staff.position}) di ${tenant.name}`),
    alternates: {
      canonical: `/tim/${staff.id}`,
    },
  }
}

export default async function GTKDetailPage({ params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await params
  const tenant = await getTenantLayoutData(slug)
  if (!tenant) notFound()

  const teamMembersData = await db.teamMember.findMany({ where: { tenant: { slug } } })
  const staffSlugDecoded = decodeURIComponent(id)
  const staff = (teamMembersData || []).find((s: any) => 
    s.id === id || slugify(s.name) === staffSlugDecoded
  )
  if (!staff) notFound()

  const base = await getPublicBasePath(slug)

  // Custom Theme rendering
  if (tenant.customThemeId && tenant.customTheme && 'teamDetailHtml' in tenant.customTheme) {
    const { renderCustomTheme } = await import("@/app/site/[slug]/_themes/custom-renderer")
    const rendered = renderCustomTheme({
      templateHtml: (tenant.customTheme as any).teamDetailHtml,
      layoutHtml: tenant.customTheme.layoutHtml,
      customCss: tenant.customTheme.customCss,
      customJs: tenant.customTheme.customJs,
      context: { tenant, base, staff, settings: tenant.settings || {} },
    })
    if (rendered) return rendered
  }
  
  // Get articles written by this staff member
  let articles: any[] = []

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
          <SiteBreadcrumbs 
            tenant={tenant}
            basePath={base}
            targetUrl="/tim"
            fallbackLabel={(tenant.settings as any)?.labels?.staff?.sectionTitle || "Tim & Staf (GTK)"}
            currentItemName={staff.name}
            currentItemUrl={`/tim/${staff.id}`}
          />

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
                   {staff.position}
                </div>
                <h1 className="text-4xl md:text-6xl font-black text-foreground leading-tight tracking-tighter mb-8 drop-shadow-sm break-words hyphens-auto">
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

                   {staff.linkedin && (
                     <a href={staff.linkedin} target="_blank" rel="noreferrer" className="flex items-center justify-center w-11 h-11 rounded-full bg-white/80 backdrop-blur-sm border border-slate-200/60 text-slate-400 hover:bg-blue-600 hover:text-white hover:border-blue-600 hover:-translate-y-1 transition-all duration-300 shadow-[0_4px_14px_0_rgb(0,0,0,0.05)] group/icon">
                       <svg className="h-4 w-4 text-slate-400 group-hover/icon:text-white transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>
                     </a>
                   )}
                   {staff.twitter && (
                     <a href={staff.twitter} target="_blank" rel="noreferrer" className="flex items-center justify-center w-11 h-11 rounded-full bg-white/80 backdrop-blur-sm border border-slate-200/60 text-slate-400 hover:bg-slate-900 hover:text-white hover:border-slate-900 hover:-translate-y-1 transition-all duration-300 shadow-[0_4px_14px_0_rgb(0,0,0,0.05)] group/icon">
                       <svg className="h-4 w-4 text-slate-400 group-hover/icon:text-white transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>
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
              <section className="bg-white p-6 sm:p-8 md:p-10 rounded-3xl md:rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100/60 relative overflow-hidden">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-[40px] -translate-y-1/2 translate-x-1/2"></div>
                 <h3 className="text-xl sm:text-2xl font-black mb-6 sm:mb-8 text-foreground flex items-center gap-3 relative z-10">
                    <User className="h-6 w-6 text-primary" /> Profil & Biografi
                 </h3>
                 <div className="absolute top-16 sm:top-20 left-4 sm:left-6 text-[80px] sm:text-[120px] leading-none text-slate-100 font-serif opacity-50 z-0">"</div>
                 {staff.bio ? (
                   <div 
                     className="whitespace-pre-wrap break-words text-base md:text-lg text-slate-600 leading-loose relative z-10" 
                   >
                     {staff.bio}
                   </div>
                 ) : (
                   <p className="whitespace-pre-wrap break-words text-base md:text-lg leading-loose text-slate-600 relative z-10">
                      Berkomitmen penuh untuk mendidik dan membimbing klien-siswi menuju masa depan yang cerah dengan bekal ilmu dan akhlak mulia.
                   </p>
                 )}
              </section>

              {/* ── ARTIKEL GURU ── */}
              {articles.length > 0 && (
                <section className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100/60 relative overflow-hidden">
                   <div className="flex items-center justify-between mb-8 relative z-10 border-b border-slate-100 pb-6">
                     <h3 className="text-xl font-black text-foreground flex items-center gap-3">
                        <PenTool className="h-6 w-6 text-primary" /> Artikel
                     </h3>
                     <Link href={`${base}/blog`} className="text-sm font-semibold text-slate-500 hover:text-primary transition-colors flex items-center">
                        Lihat Semua <ChevronRight className="h-4 w-4 ml-1" />
                     </Link>
                   </div>
                   
                   <div className="space-y-6 relative z-10">
                      {articles.map((post: any) => (
                        <Link href={`${base}/blog/${post.slug}`} key={post.id} className="group flex items-center gap-5 transition-all duration-300 hover:bg-slate-50/50 p-2 -mx-2 rounded-2xl">
                           <div className="relative w-28 h-20 sm:w-36 sm:h-24 rounded-2xl overflow-hidden bg-muted shrink-0 shadow-sm border border-slate-100/50">
                              {normalizeImageUrl(post.featuredImage) ? (
                                <Image src={normalizeImageUrl(post.featuredImage)!} alt={post.title} fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
                              ) : (
                                <div className="absolute inset-0 bg-primary/5 flex items-center justify-center">
                                  <BookOpen className="h-8 w-8 text-primary/20" />
                                </div>
                              )}
                           </div>
                           <div className="flex flex-col justify-center flex-1 min-w-0">
                              <h4 className="font-bold text-base sm:text-lg text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors leading-snug">
                                {post.title}
                              </h4>
                              <div className="flex items-center gap-3 text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest">
                                 <span>{new Date(post.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                 <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                 <span className="text-primary">{post.type === "PENGUMUMAN_PUBLIK" ? "PENGUMUMAN" : "BERITA"}</span>
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
                 <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary/10 rounded-full blur-[40px] translate-y-1/3 -translate-x-1/3"></div>
                 
                 <h4 className="font-black text-xl mb-8 text-foreground flex items-center gap-3 relative z-10">
                    Informasi Tim
                 </h4>
                 
                 <ul className="space-y-8 relative z-10">
                    <li className="flex items-start gap-5 group/item">
                       <div className="h-14 w-14 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-primary shrink-0 shadow-sm group-hover/item:bg-primary/5 group-hover/item:text-primary group-hover/item:border-primary/20 transition-all duration-300">
                          <BookOpen className="h-6 w-6" />
                       </div>
                       <div className="flex-1 pt-1">
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Departemen</p>
                          <p className="font-bold text-foreground text-base leading-tight">Umum</p>
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
