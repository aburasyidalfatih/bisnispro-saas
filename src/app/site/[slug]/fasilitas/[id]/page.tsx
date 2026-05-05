import { PageHeader } from "@/app/site/[slug]/_components/page-header"
import { notFound } from "next/navigation"
import { getPublicTenantBySlug } from "@/lib/services/tenant-public"
import { getPublicBasePath } from "@/lib/utils/public-path"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, Building2 } from "lucide-react"

export const dynamic = "force-dynamic"

export async function generateMetadata({ params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await params
  const tenant = await getPublicTenantBySlug(slug)
  if (!tenant) return {}
  const facility = (tenant.facilities || []).find((f: any) => f.id === id)
  if (!facility) return {}
  return {
    title: `${facility.name} - ${tenant.name}`,
    description: facility.description || `Fasilitas ${facility.name} di ${tenant.name}`,
  }
}

export default async function FacilityDetailPage({ params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await params
  const tenant = await getPublicTenantBySlug(slug)
  if (!tenant) notFound()

  const facility = (tenant.facilities || []).find((f: any) => f.id === id)
  if (!facility) notFound()

  const base = await getPublicBasePath(slug)

  return (
    <div className="bg-background min-h-screen pb-12">
      <PageHeader
        title={facility.name}
        description={`Fasilitas ${tenant.name}`}
        breadcrumbs={[
          { label: "Beranda", href: base || "/" },
          { label: "Fasilitas", href: `${base}/fasilitas` },
          { label: facility.name },
        ]}
      />

      <article className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white rounded-[2rem] p-8 md:p-12 shadow-xl border border-border">
          {facility.imageUrl ? (
            <div className="w-full h-[400px] relative rounded-2xl overflow-hidden mb-10 shadow-md">
              <Image 
                src={facility.imageUrl} 
                alt={facility.name} 
                fill 
                className="object-cover"
                priority
              />
            </div>
          ) : (
            <div className="w-full h-[300px] bg-gradient-to-br from-emerald-500/10 to-teal-500/5 rounded-2xl flex items-center justify-center mb-10">
              <Building2 className="h-24 w-24 text-emerald-500/30" />
            </div>
          )}

          <div className="prose prose-lg max-w-none prose-p:text-muted-foreground">
            <h3 className="text-2xl font-bold mb-4">Informasi Fasilitas</h3>
            {facility.description ? (
              <p className="whitespace-pre-wrap">{facility.description}</p>
            ) : (
              <p className="italic">Tidak ada penjelasan lebih detail mengenai fasilitas ini.</p>
            )}
          </div>
        </div>

        {/* Back Link */}
        <div className="mt-12 text-center">
          <Link
            href={`${base}/fasilitas`}
            className="inline-flex items-center gap-2 px-8 py-3 bg-primary/10 text-primary rounded-full text-sm font-bold hover:bg-primary hover:text-white transition-all"
          >
            <ArrowLeft className="h-4 w-4" /> Kembali ke Daftar Fasilitas
          </Link>
        </div>
      </article>
    </div>
  )
}
