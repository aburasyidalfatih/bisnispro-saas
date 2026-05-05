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
      <PageHeader
        title={achievement.title}
        description={
          <div className="flex flex-wrap items-center gap-4 justify-center text-sm">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              {format(new Date(achievement.date), "dd MMMM yyyy", { locale: idLocale })}
            </span>
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/20">
              <Medal className="h-3.5 w-3.5" />
              Tingkat {achievement.level}
            </span>
          </div>
        }
        breadcrumbs={[
          { label: "Beranda", href: base || "/" },
          { label: "Prestasi", href: `${base}/prestasi` },
          { label: achievement.title },
        ]}
      />

      <article className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white rounded-[2rem] p-8 md:p-12 shadow-xl border border-border">
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

          <div className="prose prose-lg max-w-none prose-p:text-muted-foreground">
            <h3 className="text-2xl font-bold mb-4">Detail Prestasi</h3>
            {achievement.description ? (
              <p className="whitespace-pre-wrap">{achievement.description}</p>
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
