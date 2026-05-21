import { PageHeader } from "@/app/site/[slug]/_components/page-header"
import { notFound } from "next/navigation"
import { GalleryGrid } from "./gallery-grid"
import { getPublicTenantBySlug } from "@/features/tenant/services/tenant-public.service"
import { getPublicBasePath } from "@/lib/utils/public-path"
import { renderCustomTheme } from "@/app/site/[slug]/_themes/custom-renderer"

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const tenant = await getPublicTenantBySlug(slug)
  if (!tenant) return {}
  
  const title = `Galeri Dokumentasi`
  const description = `Galeri dokumentasi kegiatan dan fasilitas unggulan di ${tenant.name}`
  const domainUrl = tenant.domain ? `https://${tenant.domain}` : `https://${tenant.slug}.schoolpro.id`

  return {
    title: `${title} | ${tenant.name}`,
    description,
    alternates: { canonical: "/gallery" },
    openGraph: {
      title: `${title} | ${tenant.name}`,
      description,
      url: `${domainUrl}/gallery`,
    }
  }
}

export default async function GalleryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const tenant = await getPublicTenantBySlug(slug)
  if (!tenant) notFound()

  const base = await getPublicBasePath(slug)

  // Support both old format (string[]) and new format ({url, caption}[])
  const raw = (tenant.gallery as any[]) || []
  const gallery = raw.map((item: any) =>
    typeof item === "string" ? { url: item, caption: "" } : item
  )

  // Custom Theme rendering
  if (tenant.customThemeId && tenant.customTheme?.galleryHtml) {
    const rendered = renderCustomTheme({
      templateHtml: tenant.customTheme.galleryHtml,
      layoutHtml: tenant.customTheme.layoutHtml,
      customCss: tenant.customTheme.customCss,
      customJs: tenant.customTheme.customJs,
      context: { tenant, base, gallery, settings: tenant.settings || {} },
    })
    if (rendered) return rendered
  }

  return (
    <>
      <PageHeader
        title="Galeri Kami"
        description="Dokumentasi kegiatan dan portofolio pekerjaan kami."
        breadcrumbs={[
          { label: "Galeri & Alumni" },
          { label: "Dokumentasi" }
        ]}
      />

      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <GalleryGrid items={gallery} />
      </section>
    </>
  )
}
