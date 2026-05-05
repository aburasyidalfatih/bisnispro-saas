import { PageHeader } from "@/app/site/[slug]/_components/page-header"
import { notFound } from "next/navigation"
import { getPublicTenantBySlug } from "@/lib/services/tenant-public"
import { getPublicBasePath } from "@/lib/utils/public-path"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, User, Briefcase } from "lucide-react"

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
    <div className="bg-background min-h-screen pb-12">
      {/* ── PROFILE BANNER ── */}
      <div className="relative h-64 md:h-80 w-full bg-slate-900 overflow-hidden">
         {/* Decorative Background */}
         <div className="absolute inset-0 opacity-40 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
         <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary/80 to-slate-900 mix-blend-multiply" />
         
         <div className="absolute top-0 left-0 right-0 p-6 z-20">
           <div className="max-w-5xl mx-auto flex items-center justify-between">
              <Link 
                href={`${base}/gtk`}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white text-xs font-bold uppercase tracking-widest transition-all"
              >
                 <ArrowLeft className="h-4 w-4" /> Kembali
              </Link>
           </div>
         </div>
      </div>

      <article className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 relative z-30 pb-16">
        <div className="bg-white rounded-[2.5rem] shadow-2xl border border-border overflow-hidden -mt-32 relative">
          
          <div className="px-8 md:px-16 pt-16 pb-12 text-center flex flex-col items-center">
            {/* Avatar */}
            <div className="w-40 h-40 md:w-48 md:h-48 rounded-full overflow-hidden shadow-2xl border-8 border-white absolute -top-24 mx-auto left-0 right-0 bg-white">
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
                  <span className="text-6xl font-bold text-primary/30 uppercase">
                    {staff.name.charAt(0)}
                  </span>
                </div>
              )}
            </div>

            <div className="mt-16 md:mt-20">
               <h1 className="text-4xl font-black text-slate-900 mb-4">{staff.name}</h1>
               <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-primary/10 text-primary font-bold tracking-widest uppercase text-xs mb-8">
                  <Briefcase className="h-4 w-4" />
                  {staff.role}
               </div>

               {/* Bio/Quote */}
               <div className="relative max-w-2xl mx-auto">
                  <div className="absolute -top-6 -left-6 text-primary/10 text-6xl font-serif">"</div>
                  <p className="text-xl text-slate-700 leading-relaxed italic relative z-10">
                     {staff.bio || "Berkomitmen penuh untuk mendidik dan membimbing siswa-siswi menuju masa depan yang cerah dengan bekal ilmu dan akhlak mulia."}
                  </p>
                  <div className="absolute -bottom-10 -right-6 text-primary/10 text-6xl font-serif">"</div>
               </div>
            </div>
          </div>
          
          <div className="bg-slate-50 p-8 md:p-12 border-t border-slate-200">
             <div className="max-w-2xl mx-auto grid sm:grid-cols-2 gap-8 text-left">
                <div>
                   <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-4">Informasi Tambahan</h3>
                   <ul className="space-y-4">
                      <li className="flex items-start gap-3">
                         <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0"><User className="h-4 w-4" /></div>
                         <div>
                            <p className="text-xs text-muted-foreground font-bold">Status Pegawai</p>
                            <p className="font-semibold text-slate-900">Staff Aktif</p>
                         </div>
                      </li>
                   </ul>
                </div>
             </div>
          </div>
        </div>

        {/* Back Link */}
        <div className="mt-12 text-center">
          <Link
            href={`${base}/gtk`}
            className="inline-flex items-center gap-2 px-8 py-3 bg-primary/10 text-primary rounded-full text-sm font-bold hover:bg-primary hover:text-white transition-all"
          >
            <ArrowLeft className="h-4 w-4" /> Kembali ke Direktori GTK
          </Link>
        </div>
      </article>
    </div>
  )
}
