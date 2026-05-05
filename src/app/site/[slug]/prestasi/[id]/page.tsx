import { PageHeader } from "@/app/site/[slug]/_components/page-header"
import { notFound } from "next/navigation"
import { getPublicTenantBySlug } from "@/lib/services/tenant-public"
import { getPublicBasePath } from "@/lib/utils/public-path"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, Trophy, Calendar, Medal } from "lucide-react"
import { format } from "date-fns"
import { id as idLocale } from "date-fns/locale"

export const dynamic = "force-dynamic"

export async function generateMetadata({ params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await params
  const tenant = await getPublicTenantBySlug(slug)
  if (!tenant) return {}
  const achievement = (tenant.achievements || []).find((a: any) => a.id === id)
  if (!achievement) return {}
  return {
    title: `${achievement.title} - ${tenant.name}`,
    description: achievement.description || `Informasi prestasi ${achievement.title}`,
  }
}

export default async function AchievementDetailPage({ params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await params
  const tenant = await getPublicTenantBySlug(slug)
  if (!tenant) notFound()

  const achievement = (tenant.achievements || []).find((a: any) => a.id === id)
  if (!achievement) notFound()

  const base = await getPublicBasePath(slug)

  return (
    <div className="bg-background min-h-screen pb-12">
      {/* ── HALL OF FAME SPOTLIGHT BANNER ── */}
      <div className="relative pt-32 pb-40 px-4 sm:px-6 lg:px-8 bg-slate-900 overflow-hidden">
         {/* Decorative Background */}
         <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30 mix-blend-color-dodge" />
         <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-amber-500/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3" />
         <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/4" />
         
         <div className="absolute top-0 left-0 right-0 p-6 z-20">
           <div className="max-w-5xl mx-auto flex items-center justify-between">
              <Link 
                href={`${base}/prestasi`}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white text-xs font-bold uppercase tracking-widest transition-all border border-white/10"
              >
                 <ArrowLeft className="h-4 w-4" /> Kembali
              </Link>
           </div>
         </div>

         <div className="max-w-4xl mx-auto relative z-10 flex flex-col items-center text-center">
            <div className="h-20 w-20 md:h-24 md:w-24 rounded-full bg-gradient-to-b from-amber-400 to-amber-600 flex items-center justify-center shadow-[0_0_40px_rgba(251,191,36,0.4)] mb-8 border-4 border-slate-900 ring-4 ring-amber-500/30">
               <Trophy className="h-10 w-10 md:h-12 md:w-12 text-white" />
            </div>
            
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/20 text-amber-400 font-bold tracking-widest uppercase text-xs mb-6 border border-amber-500/30">
               <Medal className="h-4 w-4" /> Juara {achievement.level}
            </div>
            
            <h1 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-200 mb-6 drop-shadow-sm leading-tight">
               {achievement.title}
            </h1>
            
            <div className="flex items-center gap-2 text-white/70 font-medium">
               <Calendar className="h-4 w-4" />
               {format(new Date(achievement.date), "dd MMMM yyyy", { locale: idLocale })}
            </div>
         </div>
      </div>

      <article className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 relative z-20 -mt-24 pb-16">
        <div className="bg-white rounded-[2.5rem] p-8 md:p-16 shadow-2xl border border-border">
          {achievement.imageUrl ? (
            <div className="w-full h-[400px] relative rounded-2xl overflow-hidden mb-10 shadow-md">
              <Image 
                src={achievement.imageUrl} 
                alt={achievement.title} 
                fill 
                className="object-cover"
                priority
              />
            </div>
          ) : (
            <div className="w-full h-[300px] bg-gradient-to-br from-amber-500/10 to-amber-500/5 rounded-2xl flex items-center justify-center mb-10">
              <Trophy className="h-24 w-24 text-amber-500/30" />
            </div>
          )}

          <div className="prose prose-lg max-w-none prose-p:text-slate-600 prose-p:leading-relaxed text-center">
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-6">Cerita di Balik Prestasi</h3>
            {achievement.description ? (
              <p className="whitespace-pre-wrap text-xl md:text-2xl font-medium leading-relaxed text-slate-800">
                 "{achievement.description}"
              </p>
            ) : (
              <p className="italic">Tidak ada detail deskripsi untuk prestasi ini.</p>
            )}
          </div>
        </div>

        {/* Back Link */}
        <div className="mt-12 text-center">
          <Link
            href={`${base}/prestasi`}
            className="inline-flex items-center gap-2 px-8 py-3 bg-primary/10 text-primary rounded-full text-sm font-bold hover:bg-primary hover:text-white transition-all"
          >
            <ArrowLeft className="h-4 w-4" /> Kembali ke Daftar Prestasi
          </Link>
        </div>
      </article>
    </div>
  )
}
