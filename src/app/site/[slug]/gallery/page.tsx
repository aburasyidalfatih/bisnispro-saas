import { PageHeader } from "@/app/site/[slug]/_components/page-header"
import { notFound } from "next/navigation"
import { GalleryGrid } from "./gallery-grid"
import { getPublicTenantBySlug } from "@/features/tenant/services/tenant-public.service"

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const tenant = await getPublicTenantBySlug(slug)
  if (!tenant) return {}
  return {
    title: `Galeri | ${tenant.seoTitle || tenant.name}`,
    description: `Galeri foto ${tenant.name}`,
  }
}

export default async function GalleryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const tenant = await getPublicTenantBySlug(slug)
  if (!tenant) notFound()

  // Support both old format (string[]) and new format ({url, caption}[])
  const raw = (tenant.gallery as any[]) || []
  const gallery = raw.map((item: any) =>
    typeof item === "string" ? { url: item, caption: "" } : item
  )

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
