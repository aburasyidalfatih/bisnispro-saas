import { PageHeader } from "@/app/site/[slug]/_components/page-header"
import { notFound } from "next/navigation"
import { getPublicTenantBySlug } from "@/lib/services/tenant-public"
import { getPublicBasePath } from "@/lib/utils/public-path"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, Activity, Clock } from "lucide-react"

export const dynamic = "force-dynamic"

export async function generateMetadata({ params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await params
  const tenant = await getPublicTenantBySlug(slug)
  if (!tenant) return {}
  const extra = (tenant.extracurriculars || []).find((e: any) => e.id === id)
  if (!extra) return {}
  return {
    title: `${extra.name} - ${tenant.name}`,
    description: extra.description || `Informasi Ekstrakurikuler ${extra.name}`,
  }
}

export default async function ExtracurricularDetailPage({ params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await params
  const tenant = await getPublicTenantBySlug(slug)
  if (!tenant) notFound()

  const extra = (tenant.extracurriculars || []).find((e: any) => e.id === id)
  if (!extra) notFound()

  const base = await getPublicBasePath(slug)

  return (
    <div className="bg-background min-h-screen pb-12">
      <PageHeader
        title={extra.name}
        description={`Ekstrakurikuler ${tenant.name}`}
        breadcrumbs={[
          { label: "Beranda", href: base || "/" },
          { label: "Ekstrakurikuler", href: `${base}/ekstrakurikuler` },
          { label: extra.name },
        ]}
      />

      <article className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white rounded-[2rem] p-8 md:p-12 shadow-xl border border-border">
          {extra.imageUrl ? (
            <div className="w-full h-[400px] relative rounded-2xl overflow-hidden mb-10 shadow-md">
              <Image 
                src={extra.imageUrl} 
                alt={extra.name} 
                fill 
                className="object-cover"
                priority
              />
            </div>
          ) : (
            <div className="w-full h-[300px] bg-gradient-to-br from-blue-500/10 to-indigo-500/5 rounded-2xl flex items-center justify-center mb-10">
              <Activity className="h-24 w-24 text-blue-500/30" />
            </div>
          )}

          {extra.schedule && (
            <div className="mb-8 flex items-center gap-3 bg-muted/50 w-max px-5 py-3 rounded-xl border border-border">
              <div className="bg-primary/10 p-2 rounded-lg">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Jadwal Kegiatan</p>
                <p className="font-semibold">{extra.schedule}</p>
              </div>
            </div>
          )}

          <div className="prose prose-lg max-w-none prose-p:text-muted-foreground">
            <h3 className="text-2xl font-bold mb-4">Mengenal {extra.name}</h3>
            {extra.description ? (
              <p className="whitespace-pre-wrap">{extra.description}</p>
            ) : (
              <p className="italic">Tidak ada deskripsi detail untuk ekstrakurikuler ini.</p>
            )}
          </div>
        </div>

        {/* Back Link */}
        <div className="mt-12 text-center">
          <Link
            href={`${base}/ekstrakurikuler`}
            className="inline-flex items-center gap-2 px-8 py-3 bg-primary/10 text-primary rounded-full text-sm font-bold hover:bg-primary hover:text-white transition-all"
          >
            <ArrowLeft className="h-4 w-4" /> Kembali ke Daftar Ekstrakurikuler
          </Link>
        </div>
      </article>
    </div>
  )
}
