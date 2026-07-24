import { db } from "@/lib/db"
import { notFound } from "next/navigation"
import { Metadata } from "next"
import { headers } from "next/headers"
import { getTenantLayoutData } from "@/features/tenant/services/tenant-modular.service"
import Image from "next/image"
import { normalizeImageUrl } from "@/lib/utils"
import { ShareButtons } from "../blog/[id]/_components/share-buttons"
import DOMPurify from "isomorphic-dompurify"

interface PageProps {
  params: Promise<{ slug: string; pageSlug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const headerList = await headers();
  const rootDomain = headerList.get('x-root-domain') || process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'bisnispro.id';
  const { slug, pageSlug } = await params
  
  // Use getTenantLayoutData for cached, fast response
  const tenant = await getTenantLayoutData(slug)
  if (!tenant) return {}

  const page = await db.customPage.findUnique({
    where: { tenantId_slug: { tenantId: tenant.id, slug: pageSlug } }
  })
  
  if (!page || !page.isPublished) return {}

  const description = page.content?.replace(/<[^>]*>?/gm, "").substring(0, 160) || `${page.title} - ${tenant.name}`
  const domainUrl = tenant.domain ? `https://${tenant.domain}` : `https://${tenant.slug}.${rootDomain}`
  const pageUrl = `${domainUrl}/${page.slug}`
  
  let imageUrl = normalizeImageUrl(page.featuredImage) || tenant.heroImage || tenant.logo || "https://bisnispro.id/default-og.jpg"
  if (imageUrl.startsWith("/")) imageUrl = `${domainUrl}${imageUrl}`
  const finalOgImageUrl = `${domainUrl}/api/og-proxy?url=${encodeURIComponent(imageUrl)}&ext=.jpg`

  return {
    title: `${page.title} - ${tenant.name}`,
    description,
    alternates: {
      canonical: `/${page.slug}`,
    },
    openGraph: {
      title: `${page.title} - ${tenant.name}`,
      description,
      url: pageUrl,
      siteName: tenant.name,
      images: [{ url: finalOgImageUrl, width: 1200, height: 630 }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${page.title} - ${tenant.name}`,
      description,
      images: [finalOgImageUrl],
    },
  }
}

export default async function CustomPagePublicView({ params }: PageProps) {
  const headerList = await headers();
  const rootDomain = headerList.get('x-root-domain') || process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'bisnispro.id';
  const { slug, pageSlug } = await params
  
  const tenant = await getTenantLayoutData(slug)
  if (!tenant) notFound()

  const page = await db.customPage.findUnique({
    where: { tenantId_slug: { tenantId: tenant.id, slug: pageSlug } }
  })

  if (!page || !page.isPublished) {
    notFound()
  }

  const domainUrl = tenant.domain ? `https://${tenant.domain}` : `https://${tenant.slug}.${rootDomain}`
  const pageUrl = `${domainUrl}/${page.slug}`

  return (
    <div className="bg-background min-h-screen pt-24 pb-16">
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
                "item": domainUrl
              },
              {
                "@type": "ListItem",
                "position": 2,
                "name": page.title,
                "item": pageUrl
              }
            ]
          })
        }}
      />

      {/* JSON-LD for WebPage */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": page.title,
            "description": page.content?.replace(/<[^>]*>?/gm, "").substring(0, 160) || "",
            "publisher": {
              "@type": "Organization",
              "name": tenant.name,
              "logo": {
                "@type": "ImageObject",
                "url": tenant.logo || "https://bisnispro.id/logo-bisnispro.png"
              }
            },
            "image": normalizeImageUrl(page.featuredImage) || tenant.heroImage || "https://bisnispro.id/default-og.jpg"
          })
        }}
      />

      <div className="container max-w-4xl mx-auto px-4">
        <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-8 text-foreground">{page.title}</h1>
        
        {normalizeImageUrl(page.featuredImage) && (
          <div className="w-full aspect-[21/9] relative rounded-3xl overflow-hidden mb-12 shadow-sm border border-border/50 bg-muted">
            <Image
              src={normalizeImageUrl(page.featuredImage)!}
              alt={page.title}
              fill
              priority
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 100vw"
            />
          </div>
        )}

        {page.content ? (
          <div 
            className="prose prose-slate md:prose-lg dark:prose-invert max-w-none prose-headings:font-bold prose-p:mb-6 prose-p:mt-2 prose-p:leading-relaxed prose-a:text-primary hover:prose-a:text-primary/80"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(page.content, { ADD_TAGS: ["iframe", "video", "source"], ADD_ATTR: ["allow", "allowfullscreen", "frameborder", "scrolling", "controls"] }) }}
          />
        ) : (
          <p className="text-muted-foreground italic">Konten halaman belum tersedia.</p>
        )}

        {/* Share Buttons */}
        <div className="mt-12 pt-8 border-t border-border/50">
          <ShareButtons 
            url={pageUrl} 
            title={page.title}
            tenantId={tenant.id}
          />
        </div>
      </div>
    </div>
  )
}
