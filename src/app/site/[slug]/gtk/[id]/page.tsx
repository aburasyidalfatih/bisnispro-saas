import { notFound } from "next/navigation"
import { getPublicTenantBySlug } from "@/features/tenant/services/tenant-public.service"
import { getPublicBasePath } from "@/lib/utils/public-path"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, User, Briefcase, Mail, Globe, GraduationCap, BookOpen, MessageCircle, PenTool, Calendar, ChevronRight } from "lucide-react"

export const dynamic = "force-dynamic"

function slugify(text: string) {
  return text.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await params
  const tenant = await getPublicTenantBySlug(slug)
  if (!tenant) return {}
  
  const staffSlugDecoded = decodeURIComponent(id)
  const staff = (tenant.staff || []).find((s: any) => 
    s.id === id || slugify(s.name) === staffSlugDecoded
  )
  if (!staff) return {}
  
  return {
    title: `${staff.name} - ${tenant.name}`,
    description: staff.bio || `Profil ${staff.name} (${staff.role}) di ${tenant.name}`,
  }
}

export default async function GTKDetailPage({ params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await params
  const tenant = await getPublicTenantBySlug(slug)
  if (!tenant) notFound()

  const staffSlugDecoded = decodeURIComponent(id)
  const staff = (tenant.staff || []).find((s: any) => 
    s.id === id || slugify(s.name) === staffSlugDecoded
  )
  if (!staff) notFound()

  const base = await getPublicBasePath(slug)
  
  // Get articles written by this staff member
  const articles = staff.userId 
    ? (tenant.posts || []).filter((p: any) => p.authorId === staff.userId)
    : []

  return (
    <div className="bg-background min-h-screen pb-20">
      {/* ── HEADER SECTION ── */}
      <div className="relative pt-24 pb-16 overflow-hidden">
        {/* Background Decorative */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-background z-0" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] translate-x-1/2 -translate-y-1/2 z-0" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-blue-500/5 rounded-full blur-[80px] -translate-x-1/2 translate-y-1/2 z-0" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <Link 
            href={`${base}/gtk`}
            className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-primary mb-10 transition-colors bg-white/50 backdrop-blur-md px-4 py-2 rounded-full border border-border shadow-sm"
          >
             <ArrowLeft className="h-4 w-4" /> Kembali ke Daftar Guru
          </Link>
          
          <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] p-8 md:p-12 shadow-2xl border border-white/50 flex flex-col md:flex-row gap-10 items-center md:items-start relative overflow-hidden">
             
             {/* Profile Image */}
             <div className="w-40 h-40 md:w-48 md:h-48 relative rounded-full overflow-hidden border-8 border-white shadow-xl shrink-0 bg-muted/30">
               {staff.imageUrl ? (
                 <Image 
                   src={staff.imageUrl} 
                   alt={staff.name} 
                   fill 
                   className="object-cover"
                   priority
                 />
               ) : (
                 <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                   <span className="text-6xl font-black text-primary/40 uppercase">
                     {staff.name.charAt(0)}
                   </span>
                 </div>
               )}
             </div>

             <div className="flex-1 text-center md:text-left">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary font-bold tracking-widest uppercase text-xs mb-4 border border-primary/20 shadow-inner">
                   <Briefcase className="h-3.5 w-3.5" />
                   {staff.role}
                </div>
                <h1 className="text-3xl md:text-5xl font-black text-slate-900 leading-tight tracking-tight mb-6">
                   {staff.name}
                </h1>
                
                {/* Social / Contact Buttons */}
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                   <a href={staff.email ? `mailto:${staff.email}` : "#"} className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 hover:bg-primary hover:text-white hover:border-primary transition-all font-semibold text-sm shadow-sm">
                      <Mail className="h-4 w-4" /> Email
                   </a>
                   <a href={staff.phone ? `https://wa.me/${staff.phone.replace(/[^0-9]/g, '')}` : "#"} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 hover:bg-emerald-500 hover:text-white hover:border-emerald-500 transition-all font-semibold text-sm shadow-sm">
                      <MessageCircle className="h-4 w-4" /> WhatsApp
                   </a>
                   {staff.instagram && (
                     <a href={staff.instagram} target="_blank" rel="noreferrer" className="flex items-center justify-center w-10 h-10 rounded-full bg-pink-50 border border-pink-100 text-pink-600 hover:bg-pink-500 hover:text-white hover:border-pink-500 transition-all shadow-sm">
                       <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
                     </a>
                   )}
                   {staff.facebook && (
                     <a href={staff.facebook} target="_blank" rel="noreferrer" className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-50 border border-blue-100 text-blue-600 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all shadow-sm">
                       <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
                     </a>
                   )}
                   {staff.youtube && (
                     <a href={staff.youtube} target="_blank" rel="noreferrer" className="flex items-center justify-center w-10 h-10 rounded-full bg-red-50 border border-red-100 text-red-600 hover:bg-red-600 hover:text-white hover:border-red-600 transition-all shadow-sm">
                       <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"/><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"/></svg>
                     </a>
                   )}
                   {staff.tiktok && (
                     <a href={staff.tiktok} target="_blank" rel="noreferrer" className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-100 border border-slate-200 text-slate-800 hover:bg-slate-800 hover:text-white hover:border-slate-800 transition-all shadow-sm">
                       <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
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
              <section className="prose prose-lg max-w-none text-slate-600 leading-relaxed bg-white p-8 md:p-10 rounded-[2rem] shadow-lg border border-slate-100">
                 <h3 className="text-2xl font-black mb-6 text-slate-900 flex items-center gap-3 border-b pb-4">
                    <User className="h-6 w-6 text-primary" /> Profil & Biografi
                 </h3>
                 <p className="whitespace-pre-wrap text-base md:text-lg">
                    {staff.bio || "Berkomitmen penuh untuk mendidik dan membimbing siswa-siswi menuju masa depan yang cerah dengan bekal ilmu dan akhlak mulia."}
                 </p>
              </section>

              {/* ── ARTIKEL GURU ── */}
              {articles.length > 0 && (
                <section>
                   <h3 className="text-2xl font-black mb-6 text-slate-900 flex items-center gap-3 px-2">
                      <PenTool className="h-6 w-6 text-primary" /> Artikel & Tulisan
                   </h3>
                   <div className="grid sm:grid-cols-2 gap-6">
                      {articles.map((post: any) => (
                        <Link href={`${base}/berita/${post.slug}`} key={post.id} className="group bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-md hover:shadow-xl transition-all hover:-translate-y-1 flex flex-col">
                           <div className="relative h-48 w-full overflow-hidden bg-muted">
                              {post.featuredImage ? (
                                <Image src={post.featuredImage} alt={post.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                              ) : (
                                <div className="absolute inset-0 bg-primary/5 flex items-center justify-center">
                                  <BookOpen className="h-10 w-10 text-primary/20" />
                                </div>
                              )}
                           </div>
                           <div className="p-6 flex flex-col flex-1">
                              <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium mb-3">
                                 <Calendar className="h-3.5 w-3.5" />
                                 {new Date(post.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                              </div>
                              <h4 className="font-bold text-lg text-foreground mb-3 line-clamp-2 group-hover:text-primary transition-colors">
                                {post.title}
                              </h4>
                              <div className="mt-auto pt-4 border-t border-slate-100 flex items-center text-sm font-semibold text-primary">
                                 Baca selengkapnya <ChevronRight className="h-4 w-4 ml-1 transition-transform group-hover:translate-x-1" />
                              </div>
                           </div>
                        </Link>
                      ))}
                   </div>
                </section>
              )}
           </div>

           <div className="space-y-8 sticky top-24">
              <div className="bg-white rounded-[2rem] p-8 shadow-lg border border-slate-100">
                 <h4 className="font-black text-xl mb-6 text-slate-900 border-b pb-4">Informasi Akademik</h4>
                 <ul className="space-y-6">
                    <li className="flex items-start gap-4">
                       <div className="h-12 w-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0"><BookOpen className="h-5 w-5" /></div>
                       <div>
                          <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-1">Mata Pelajaran</p>
                          <p className="font-bold text-slate-800 text-base">{staff.subject || "Guru Kelas / Umum"}</p>
                       </div>
                    </li>
                    <li className="flex items-start gap-4">
                       <div className="h-12 w-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0"><GraduationCap className="h-5 w-5" /></div>
                       <div>
                          <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-1">Pendidikan</p>
                          <p className="font-bold text-slate-800 text-base">{staff.education || "S1 Pendidikan"}</p>
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
