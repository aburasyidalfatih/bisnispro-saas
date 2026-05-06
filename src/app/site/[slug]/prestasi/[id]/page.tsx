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
    <div className="bg-background min-h-screen pb-16">
      {/* ── HEADER SECTION ── */}
      <div className="bg-muted/30 pt-8 pb-12 border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link 
            href={`${base}/prestasi`}
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary mb-8 transition-colors"
          >
             <ArrowLeft className="h-4 w-4" /> Kembali
          </Link>
          
          <div className="flex items-center gap-3 mb-4">
             <div className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold uppercase tracking-widest flex items-center gap-1.5">
               <Trophy className="h-3.5 w-3.5" /> Juara {achievement.level}
             </div>
             <div className="flex items-center gap-1.5 text-sm text-muted-foreground font-medium">
               <Calendar className="h-4 w-4" />
               {format(new Date(achievement.date), "dd MMMM yyyy", { locale: idLocale })}
             </div>
          </div>
          
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-foreground leading-tight tracking-tight">
             {achievement.title}
          </h1>
        </div>
      </div>

      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-10 md:mt-12">
        {achievement.imageUrl ? (
          <div className="w-full aspect-video md:aspect-[21/9] relative rounded-3xl overflow-hidden mb-12 shadow-sm border border-border/50 bg-muted">
            <Image 
              src={achievement.imageUrl} 
              alt={achievement.title} 
              fill 
              className="object-cover"
              priority
            />
          </div>
        ) : (
          <div className="w-full aspect-[21/9] bg-gradient-to-br from-amber-500/5 to-amber-500/10 rounded-3xl flex items-center justify-center mb-12 border border-amber-500/10">
            <Trophy className="h-16 w-16 text-amber-500/20" />
          </div>
        )}

        <div className="prose prose-lg max-w-none text-muted-foreground leading-relaxed">
          {achievement.description ? (
            <p className="whitespace-pre-wrap">{achievement.description}</p>
          ) : (
            <p className="italic">Tidak ada detail deskripsi untuk prestasi ini.</p>
          )}
        </div>
      </article>
    </div>
  )
}
