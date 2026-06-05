import { notFound } from "next/navigation"
import { getTenantLayoutData } from "@/features/tenant/services/tenant-modular.service"
import { db } from "@/lib/db"
import { getPublicPosts } from "@/features/tenant/services/tenant-public-queries.service"
import { cache } from "react"

const getPengumuman = cache(async (tenantId: string, slugOrId: string) => {
  const posts = await getPublicPosts(tenantId, 1, 1, {
    status: "PUBLISHED",
    OR: [{ id: slugOrId }, { slug: slugOrId }],
    type: { in: ["PENGUMUMAN", "PENGUMUMAN_SEMUA", "PENGUMUMAN_GTK", "PENGUMUMAN_ORTU", "PENGUMUMAN_SISWA"] }
  })
  return posts[0] || null
})

const getRelatedPengumuman = cache(async (tenantId: string, currentId: string) => {
  return getPublicPosts(tenantId, 1, 3, {
    status: "PUBLISHED",
    id: { not: currentId },
    type: { in: ["PENGUMUMAN", "PENGUMUMAN_SEMUA", "PENGUMUMAN_GTK", "PENGUMUMAN_ORTU", "PENGUMUMAN_SISWA"] }
  })
})
import { getPublicBasePath } from "@/lib/utils/public-path"
import { normalizeImageUrl } from "@/lib/utils"
import Link from "next/link"
import { Calendar, User, ArrowLeft, Megaphone } from "lucide-react"
import { format } from "date-fns"
import { id as idLocale } from "date-fns/locale"
import DOMPurify from "isomorphic-dompurify"
import Image from "next/image"
import { ReadingProgress } from "@/app/site/[slug]/berita/[id]/_components/reading-progress"
import { ShareButtons } from "@/app/site/[slug]/berita/[id]/_components/share-buttons"

export const revalidate = 60;




export async function generateMetadata({ params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id: postId } = await params
  const tenant = await getTenantLayoutData(slug)
  if (!tenant) return {}
  const slugDecoded = decodeURIComponent(postId)
  const post = await getPengumuman(tenant.id, slugDecoded)
  if (!post) return {}
  const description = post.seoDesc || post.content?.replace(/<[^>]*>/g, "").substring(0, 160)
  let imageUrl = normalizeImageUrl(post.featuredImage) || normalizeImageUrl(post.featuredImage) || tenant.heroImage || tenant.logo || "https://schoolpro.id/default-og.jpg"
  
  const domainUrl = tenant.domain ? `https://${tenant.domain}` : `https://${tenant.slug}.schoolpro.id`
  if (imageUrl.startsWith("/")) {
    imageUrl = `${domainUrl}${imageUrl}`
  }

  // Proxy through custom og-proxy to convert WebP to JPG and avoid CORS/ISP timeout issues for social media scrapers like Facebook and WhatsApp
  const finalOgImageUrl = `${domainUrl}/api/og-proxy?url=${encodeURIComponent(imageUrl)}&ext=.jpg`

  return {
    title: `${post.title} - ${tenant.name}`,
    description,
    alternates: {
      canonical: `/pengumuman/${post.slug}`,
    },
    openGraph: {
      title: `${post.title} - ${tenant.name}`,
      description,
      url: `https://${tenant.domain || tenant.slug + '.schoolpro.id'}/pengumuman/${post.slug}`,
      siteName: tenant.name,
      images: [{ url: finalOgImageUrl, width: 1200, height: 630 }],
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description,
      images: [finalOgImageUrl],
    },
  }
}

export default async function PengumumanDetailPage({ params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await params
  const tenant = await getTenantLayoutData(slug)
  if (!tenant) notFound()

  const decodedId = decodeURIComponent(id)
  const post = await getPengumuman(tenant.id, decodedId)
  if (!post) notFound()

  const base = await getPublicBasePath(slug)

  // Custom Theme rendering
  if (tenant.customThemeId && tenant.customTheme?.pengumumanDetailHtml) {
    const { renderCustomTheme } = await import("@/app/site/[slug]/_themes/custom-renderer")
    const rendered = renderCustomTheme({
      templateHtml: tenant.customTheme.pengumumanDetailHtml,
      layoutHtml: tenant.customTheme.layoutHtml,
      customCss: tenant.customTheme.customCss,
      customJs: tenant.customTheme.customJs,
      context: { tenant, base, post, settings: tenant.settings || {} },
    })
    if (rendered) return rendered
  }

  // Get related pengumuman
  const relatedPosts = await getRelatedPengumuman(tenant.id, post.id)

  return (
    <div className="bg-background min-h-screen pt-4 md:pt-12 pb-24 font-sans text-foreground">
      <ReadingProgress />
      {/* JSON-LD for Article Rich Snippets */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            "headline": post.title,
            "image": normalizeImageUrl(post.featuredImage) || normalizeImageUrl(post.featuredImage) || "https://schoolpro.id/logo-schoolpro.png",
            "datePublished": post.createdAt,
            "dateModified": post.updatedAt || post.createdAt,
            "author": {
              "@type": "Person",
              "name": post.author?.name || "Tata Usaha"
            },
            "publisher": {
              "@type": "Organization",
              "name": tenant.name,
              "logo": {
                "@type": "ImageObject",
                "url": tenant.logo || "https://schoolpro.id/logo-schoolpro.png"
              }
            },
            "url": `https://${tenant.domain || tenant.slug + '.schoolpro.id'}/pengumuman/${post.slug}`
          })
        }}
      />

      {/* ── HEADER SECTION ── */}
      <div className="bg-blue-500/5 pt-6 pb-10 border-b border-blue-500/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link 
            href={`${base}/pengumuman`}
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-blue-600 mb-8 transition-colors"
          >
             <ArrowLeft className="h-4 w-4" /> Papan Pengumuman
          </Link>
          
          <div className="flex flex-wrap items-center gap-3 mb-4">
             <div className="px-3 py-1 bg-blue-600 text-white rounded-full text-xs font-bold uppercase tracking-widest">
               {post.category?.name || "INFORMASI PENTING"}
             </div>
             <div className="flex items-center gap-1.5 text-sm text-muted-foreground font-medium">
               <Calendar className="h-4 w-4" />
               {format(new Date(post.createdAt), "dd MMMM yyyy", { locale: idLocale })}
             </div>
             <div className="flex items-center gap-1.5 text-sm text-muted-foreground font-medium">
               <User className="h-4 w-4" />
               {post.author?.name || "Tata Usaha"}
             </div>
          </div>
          
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-slate-900 leading-tight tracking-tight">
            {post.title}
          </h1>
        </div>
      </div>

      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-10 md:mt-12">
        {(normalizeImageUrl(post.featuredImage) || normalizeImageUrl(post.featuredImage)) && (
          <div className="w-full aspect-video md:aspect-[21/9] relative rounded-3xl overflow-hidden mb-12 shadow-sm border border-border/50 bg-muted">
            <Image
              src={(normalizeImageUrl(post.featuredImage) || normalizeImageUrl(post.featuredImage))!}
              alt={post.title}
              fill
              priority
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>
        )}

        {/* Content */}
        <div
          className="prose prose-lg prose-blue max-w-none mx-auto prose-headings:font-bold prose-headings:text-slate-900 prose-p:text-muted-foreground prose-p:leading-relaxed prose-a:text-blue-600 hover:prose-a:text-blue-700 prose-img:rounded-3xl prose-img:shadow-md mt-10 md:mt-16"
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content || "") }}
        />

        {/* If content is plain text (no HTML), render as paragraphs */}
        {post.content && !post.content.includes("<") && (
          <div className="prose prose-lg prose-blue max-w-none mx-auto text-muted-foreground leading-relaxed mt-8">
            <p className="whitespace-pre-wrap">{post.content}</p>
          </div>
        )}

        {/* Share Buttons */}
        <ShareButtons 
          url={`https://${tenant.domain || tenant.slug + '.schoolpro.id'}/pengumuman/${post.slug}`} 
          title={post.title}
          postId={post.id}
          tenantId={tenant.id}
        />
      </article>

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-16 pt-16">
          <h3 className="text-xl font-bold mb-6">Pengumuman Lainnya</h3>
          <div className="grid gap-6 md:grid-cols-3">
            {relatedPosts.map((related: any) => (
              <Link
                key={related.id}
                href={`${base}/pengumuman/${related.slug}`}
                className="group flex flex-col bg-background rounded-2xl overflow-hidden border hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
              >
                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground mb-3">
                    <Calendar className="h-3 w-3 text-blue-500" />
                    {format(new Date(related.createdAt), "dd MMM yyyy", { locale: idLocale })}
                  </div>
                  <h4 className="text-base font-bold mb-2 line-clamp-2 leading-snug group-hover:text-blue-600 transition-colors">
                    {related.title}
                  </h4>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {related.seoDesc || related.content.replace(/<[^>]*>/g, '').substring(0, 80) + "..."}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
