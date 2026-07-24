import { headers } from "next/headers"
import { PageHeader } from "@/app/site/[slug]/_components/page-header"
import { notFound } from "next/navigation"
import { getTenantLayoutData } from "@/features/tenant/services/tenant-modular.service"
import { db } from "@/lib/db"
import { getPublicBasePath } from "@/lib/utils/public-path"
import { normalizeImageUrl } from "@/lib/utils"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, Trophy, Calendar, Medal } from "lucide-react"
import { format } from "date-fns"
import { id as idLocale } from "date-fns/locale"
import { ShareButtons } from "../../blog/[id]/_components/share-buttons"
import DOMPurify from "isomorphic-dompurify"
import { SiteBreadcrumbs } from "@/app/site/[slug]/_components/site-breadcrumbs"


export async function generateMetadata({ params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await params
  const tenant = await getTenantLayoutData(slug)
  if (!tenant) return {}
  const portfolio = await db.portfolio.findFirst({
    where: {
      tenant: { slug },
      OR: [{ id }, { slug: id }]
    }
  })
  if (!portfolio) return {}
  return {
    title: `${portfolio.title} - ${tenant.name}`,
    description: (portfolio.description ? portfolio.description.replace(/<[^>]*>?/gm, '') : `Informasi portofolio ${portfolio.title}`),
    alternates: {
      canonical: `/portofolio/${portfolio.slug || portfolio.id}`,
    },
  }
}

export default async function AchievementDetailPage({ params }: { params: Promise<{ slug: string; id: string }> }) {
  const headerList = await headers();
  const rootDomain = headerList.get('x-root-domain') || process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'bisnispro.id';
  const { slug, id } = await params
  const tenant = await getTenantLayoutData(slug)
  if (!tenant) notFound()

  const portfolio = await db.portfolio.findFirst({
    where: {
      tenant: { slug },
      OR: [{ id }, { slug: id }]
    }
  })
  if (!portfolio) notFound()

  const base = await getPublicBasePath(slug)

  return (
    <div className="bg-background min-h-screen pb-16">
      {/* ── HEADER SECTION ── */}
      <div className="bg-muted/30 pt-8 pb-12 border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <SiteBreadcrumbs 
            tenant={tenant}
            basePath={base}
            targetUrl="/portofolio"
            fallbackLabel={(tenant.settings as any)?.labels?.achievements?.sectionTitle || "Portofolio"}
            currentItemName={portfolio.title}
            currentItemUrl={`/portofolio/${portfolio.slug || portfolio.id}`}
          />
          
          <div className="flex items-center gap-3 mb-4 mt-6">
             <div className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold uppercase tracking-widest flex items-center gap-1.5">
               <Trophy className="h-3.5 w-3.5" /> Portofolio {portfolio.category || ""}
             </div>
             <div className="flex items-center gap-1.5 text-sm text-muted-foreground font-medium">
               <Calendar className="h-4 w-4" />
               {portfolio.completedAt ? format(new Date(portfolio.completedAt), "dd MMMM yyyy", { locale: idLocale }) : "Tahun ini"}
             </div>
          </div>
          
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-foreground leading-tight tracking-tight">
             {portfolio.title}
          </h1>
        </div>
      </div>

      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-10 md:mt-12">
        {portfolio.imageUrl ? (
          <div className="w-full aspect-video relative rounded-3xl overflow-hidden mb-12 shadow-sm border border-border/50 bg-muted">
            <Image 
              src={normalizeImageUrl(portfolio.imageUrl) || portfolio.imageUrl} 
              alt={portfolio.title} 
              fill 
              className="object-cover"
              priority
            />
          </div>
        ) : (
          <div className="w-full aspect-video bg-gradient-to-br from-amber-500/5 to-amber-500/10 rounded-3xl flex items-center justify-center mb-12 border border-amber-500/10">
            <Trophy className="h-16 w-16 text-amber-500/20" />
          </div>
        )}

        <div className="prose prose-lg max-w-none text-muted-foreground leading-relaxed">
          {portfolio.description ? (
            <div className="whitespace-pre-wrap prose prose-slate max-w-none" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(portfolio.description, { ADD_TAGS: ["iframe", "video", "source"], ADD_ATTR: ["allow", "allowfullscreen", "frameborder", "scrolling", "controls"] }) }} />
          ) : (
            <p className="italic">Tidak ada detail deskripsi untuk portofolio ini.</p>
          )}
        </div>

        {/* Share Buttons */}
        <ShareButtons 
          url={`https://${tenant.domain || tenant.slug + '.' + rootDomain}/portofolio/${portfolio.slug || portfolio.id}`} 
          title={portfolio.title}
          tenantId={tenant.id}
        />
      </article>
    </div>
  )
}
