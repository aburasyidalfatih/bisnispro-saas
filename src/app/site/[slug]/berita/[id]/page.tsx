import { headers } from "next/headers"
import { PageHeader } from "@/app/site/[slug]/_components/page-header"
import { notFound } from "next/navigation"
import { getTenantLayoutData, getTenantPosts } from "@/features/tenant/services/tenant-modular.service"
import { getPublicBasePath } from "@/lib/utils/public-path"
import { normalizeImageUrl } from "@/lib/utils"
import Link from "next/link"
import { Calendar, User, ArrowLeft, Clock, Tag } from "lucide-react"
import { format } from "date-fns"
import { id as idLocale } from "date-fns/locale"
import DOMPurify from "isomorphic-dompurify"
import Image from "next/image"
import { ReadingProgress } from "./_components/reading-progress"
import { ShareButtons } from "./_components/share-buttons"
import { PostViewCounter } from "./_components/view-counter"
import { getPostViews } from "@/features/post/services/views.service"
import { getShareCount } from "@/features/post/services/share.service"
import { AuthorBio } from "./_components/author-bio"

export async function generateMetadata({ params }: { params: Promise<{ slug: string; id: string }> }) {
  const headerList = await headers();
  const rootDomain = headerList.get('x-root-domain') || process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'schoolpro.id';
  const { slug, id } = await params
  const tenant = await getTenantLayoutData(slug)
  if (!tenant) return {}
  const postData = await getTenantPosts(slug)
  const staffSlugDecoded = decodeURIComponent(id)
  const post = (postData?.posts || []).find((p: any) => p.id === id || p.slug === staffSlugDecoded)
  if (!post) return {}
  const description = post.content?.replace(/<[^>]*>/g, "").substring(0, 160) || "Berita Terbaru"
  let imageUrl = normalizeImageUrl(post.featuredImage) || normalizeImageUrl(post.featuredImage) || tenant.heroImage || tenant.logo || "https://schoolpro.id/default-og.jpg"
  
  const domainUrl = tenant.domain ? `https://${tenant.domain}` : `https://${tenant.slug}.${rootDomain}`
  if (imageUrl.startsWith("/")) {
    imageUrl = `${domainUrl}${imageUrl}`
  }

  // Proxy through custom og-proxy to convert WebP to JPG and avoid CORS/ISP timeout issues for social media scrapers like Facebook and WhatsApp
  const finalOgImageUrl = `${domainUrl}/api/og-proxy?url=${encodeURIComponent(imageUrl)}&ext=.jpg`

  return {
    title: `${post.title} - ${tenant.name}`,
    description,
    alternates: {
      canonical: `/berita/${post.slug}`,
    },
    openGraph: {
      title: `${post.title} - ${tenant.name}`,
      description,
      url: `https://${tenant.domain || tenant.slug + '.' + rootDomain}/berita/${post.slug}`,
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

export default async function BeritaDetailPage({ params }: { params: Promise<{ slug: string; id: string }> }) {
  const headerList = await headers();
  const rootDomain = headerList.get('x-root-domain') || process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'schoolpro.id';
  const { slug, id } = await params
  const tenant = await getTenantLayoutData(slug)
  if (!tenant) notFound()

  const postData = await getTenantPosts(slug)
  const decodedId = decodeURIComponent(id)
  const post = (postData?.posts || []).find((p: any) => p.id === id || p.slug === decodedId)
  if (!post) notFound()

  const base = await getPublicBasePath(slug)

  // Custom Theme rendering
  if (tenant.customThemeId && tenant.customTheme?.newsDetailHtml) {
    const { renderCustomTheme } = await import("@/app/site/[slug]/_themes/custom-renderer")
    const rendered = renderCustomTheme({
      templateHtml: tenant.customTheme.newsDetailHtml,
      layoutHtml: tenant.customTheme.layoutHtml,
      customCss: tenant.customTheme.customCss,
      customJs: tenant.customTheme.customJs,
      context: { tenant, base, post, settings: tenant.settings || {} },
    })
    if (rendered) return rendered
  }

  // Get related posts (same type, exclude current)
  const relatedPosts = (postData?.posts || [])
    .filter((p: any) => p.id !== post.id)
    .slice(0, 3)

  // Get live views from Redis + Postgres baseline
  const redisViews = await getPostViews(id)
  const totalViews = (post.viewCount || 0) + redisViews
  
  // Get share count from Redis + Postgres
  const redisShares = await getShareCount(id)
  const totalShares = (post.shareCount || 0) + redisShares

  return (
    <div className="bg-background min-h-screen pt-4 md:pt-12 pb-24 font-sans text-foreground">
      <div className="print:hidden">
        <ReadingProgress />
      </div>

      {/* JSON-LD for BreadcrumbList */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
              {
                "@type": "ListItem",
                "position": 1,
                "name": "Beranda",
                "item": `https://${tenant.domain || tenant.slug + '.' + rootDomain}`
              },
              {
                "@type": "ListItem",
                "position": 2,
                "name": "Berita",
                "item": `https://${tenant.domain || tenant.slug + '.' + rootDomain}/berita`
              },
              {
                "@type": "ListItem",
                "position": 3,
                "name": post.title,
                "item": `https://${tenant.domain || tenant.slug + '.' + rootDomain}/berita/${post.slug}`
              }
            ]
          })
        }}
      />

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
              "name": post.author?.name || "Admin"
            },
              "publisher": {
              "@type": "Organization",
              "name": tenant.name,
              "logo": {
                "@type": "ImageObject",
                "url": tenant.logo || "https://schoolpro.id/logo-schoolpro.png",
                "width": 512,
                "height": 512
              }
            },
            "url": `https://${tenant.domain || tenant.slug + '.' + rootDomain}/berita/${post.slug}`
          })
        }}
      />

      {/* ── HEADER SECTION ── */}
      <div className="bg-muted/30 pt-6 pb-10 border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link 
            href={`${base}/berita`}
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary mb-8 transition-colors print:hidden"
          >
             <ArrowLeft className="h-4 w-4" /> Kembali
          </Link>
          
          <div className="flex flex-wrap items-center gap-3 mb-4">
             <div className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold uppercase tracking-widest">
               {post.category?.name || "BERITA"}
             </div>
             <div className="flex items-center gap-1.5 text-sm text-muted-foreground font-medium">
               <Calendar className="h-4 w-4" />
               {format(new Date(post.createdAt), "dd MMMM yyyy", { locale: idLocale })}
             </div>
             <div className="flex items-center gap-1.5 text-sm text-muted-foreground font-medium">
               <User className="h-4 w-4" />
               {post.author?.name || "Admin"}
             </div>
             <PostViewCounter postId={post.id} initialViews={totalViews} />
          </div>
          
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-foreground leading-tight tracking-tight">
            {post.title}
          </h1>
        </div>
      </div>

      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-10 md:mt-12">
        {(normalizeImageUrl(post.featuredImage) || normalizeImageUrl(post.featuredImage)) && (
          <div className="w-full aspect-video relative rounded-3xl overflow-hidden mb-12 shadow-sm border border-border/50 bg-muted">
            <Image
              src={(normalizeImageUrl(post.featuredImage) || normalizeImageUrl(post.featuredImage))!}
              alt={post.imageAlt || post.title}
              fill
              priority
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>
        )}

        <div
          className="prose prose-lg prose-primary max-w-none mx-auto prose-headings:font-bold prose-headings:text-foreground prose-p:text-muted-foreground prose-p:leading-relaxed prose-p:mb-6 prose-p:mt-2 prose-li:my-0 prose-ul:my-2 prose-ol:my-2 prose-a:text-primary hover:prose-a:text-primary/80 prose-img:rounded-3xl prose-img:shadow-md mt-10 md:mt-16"
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content || "") }}
        />

        {/* If content is plain text (no HTML), render as paragraphs */}
        {post.content && !post.content.includes("<") && (
          <div className="prose prose-lg prose-primary max-w-none mx-auto text-muted-foreground leading-relaxed mt-8">
            <p className="whitespace-pre-wrap">{post.content}</p>
          </div>
        )}

        {/* Share Buttons */}
        <ShareButtons 
          url={`https://${tenant.domain || tenant.slug + '.' + rootDomain}/berita/${post.slug}`} 
          title={post.title}
          postId={post.id}
          tenantId={tenant.id}
          initialShares={totalShares}
        />

        {/* Author Bio */}
        <div className="mt-8 print:hidden">
          <AuthorBio author={post.author} tenantId={tenant.id} basePath={base} />
        </div>
      </article>

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-16 print:hidden">
          <h3 className="text-xl font-bold mb-6">Berita Lainnya</h3>
          <div className="grid gap-6 md:grid-cols-3">
            {relatedPosts.map((related: any) => (
              <Link
                key={related.id}
                href={`${base}/berita/${related.slug}`}
                className="group flex flex-col bg-background rounded-2xl overflow-hidden border hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
              >
                <div className="aspect-[16/10] relative overflow-hidden bg-muted">
                  {(normalizeImageUrl(related.featuredImage) || normalizeImageUrl(related.image)) ? (
                    <Image
                      src={(normalizeImageUrl(related.featuredImage) || normalizeImageUrl(related.image))!}
                      alt={related.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full bg-primary/5">
                      <Calendar className="h-8 w-8 text-primary/20" />
                    </div>
                  )}
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground mb-2">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(related.createdAt), "dd MMM yyyy", { locale: idLocale })}
                  </div>
                  <h4 className="text-base font-bold mb-2 line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                    {related.title}
                  </h4>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
