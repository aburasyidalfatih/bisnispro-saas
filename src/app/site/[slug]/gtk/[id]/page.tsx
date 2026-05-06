import { PageHeader } from "@/app/site/[slug]/_components/page-header"
import { notFound } from "next/navigation"
import { getPublicTenantBySlug } from "@/lib/services/tenant-public"
import { getPublicBasePath } from "@/lib/utils/public-path"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, User, Briefcase, Mail, Globe, GraduationCap, BookOpen, MessageCircle } from "lucide-react"

export const dynamic = "force-dynamic"

export async function generateMetadata({ params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await params
  const tenant = await getPublicTenantBySlug(slug)
  if (!tenant) return {}
  const staff = (tenant.staff || []).find((s: any) => s.id === id)
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

  const staff = (tenant.staff || []).find((s: any) => s.id === id)
  if (!staff) notFound()

  const base = await getPublicBasePath(slug)

  return (
    <div className="bg-background min-h-screen pb-16">
      {/* ── HEADER SECTION ── */}
      <div className="bg-muted/30 pt-8 pb-12 border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link 
            href={`${base}/gtk`}
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary mb-8 transition-colors"
          >
             <ArrowLeft className="h-4 w-4" /> Kembali
          </Link>
          
          <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
             <div className="w-32 h-32 md:w-40 md:h-40 relative rounded-full overflow-hidden border-4 border-background shadow-md shrink-0 bg-muted">
               {staff.imageUrl ? (
                 <Image 
                   src={staff.imageUrl} 
                   alt={staff.name} 
                   fill 
                   className="object-cover"
                   priority
                 />
               ) : (
                 <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                   <span className="text-4xl font-bold text-primary/30 uppercase">
                     {staff.name.charAt(0)}
                   </span>
                 </div>
               )}
             </div>

             <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary font-bold tracking-widest uppercase text-xs mb-3">
                   <Briefcase className="h-3.5 w-3.5" />
                   {staff.role}
                </div>
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-foreground leading-tight tracking-tight mb-4">
                   {staff.name}
                </h1>
                
                {/* Social / Contact */}
                <div className="flex items-center gap-3">
                   <a href={staff.email ? `mailto:${staff.email}` : "#"} className="h-10 w-10 rounded-full bg-background border border-border/50 shadow-sm flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all">
                      <Mail className="h-4 w-4" />
                   </a>
                   <a href={staff.phone ? `https://wa.me/${staff.phone.replace(/[^0-9]/g, '')}` : "#"} target="_blank" rel="noreferrer" className="h-10 w-10 rounded-full bg-background border border-border/50 shadow-sm flex items-center justify-center text-muted-foreground hover:bg-emerald-500 hover:text-white hover:border-emerald-500 transition-all">
                      <MessageCircle className="h-4 w-4" />
                   </a>
                   <a href="#" className="h-10 w-10 rounded-full bg-background border border-border/50 shadow-sm flex items-center justify-center text-muted-foreground hover:bg-[#0A66C2] hover:text-white hover:border-[#0A66C2] transition-all">
                      <Globe className="h-4 w-4" />
                   </a>
                </div>
             </div>
          </div>
        </div>
      </div>

      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-10 md:mt-12">
        <div className="grid md:grid-cols-3 gap-8 items-start">
           
           <div className="md:col-span-2 prose prose-lg max-w-none text-muted-foreground leading-relaxed">
              <h3 className="text-xl font-bold mb-4 text-foreground">Profil & Biografi</h3>
              <p className="whitespace-pre-wrap">
                 {staff.bio || "Berkomitmen penuh untuk mendidik dan membimbing siswa-siswi menuju masa depan yang cerah dengan bekal ilmu dan akhlak mulia."}
              </p>
           </div>

           <div className="space-y-6">
              <div className="bg-muted/30 rounded-3xl p-6 border border-border/50">
                 <h4 className="font-bold text-lg mb-4 text-foreground">Informasi Akademik</h4>
                 <ul className="space-y-4">
                    <li className="flex items-start gap-3">
                       <div className="h-8 w-8 rounded-full bg-background shadow-sm border border-border/50 flex items-center justify-center text-primary shrink-0"><BookOpen className="h-4 w-4" /></div>
                       <div>
                          <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Mata Pelajaran</p>
                          <p className="font-semibold text-foreground text-sm mt-0.5">{staff.subject || "Guru Kelas / Umum"}</p>
                       </div>
                    </li>
                    <li className="flex items-start gap-3">
                       <div className="h-8 w-8 rounded-full bg-background shadow-sm border border-border/50 flex items-center justify-center text-primary shrink-0"><GraduationCap className="h-4 w-4" /></div>
                       <div>
                          <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Pendidikan</p>
                          <p className="font-semibold text-foreground text-sm mt-0.5">{staff.education || "S1 Pendidikan"}</p>
                       </div>
                    </li>
                 </ul>
              </div>
           </div>
           
        </div>
      </article>
    </div>
  )
}
