import { PageHeader } from "@/app/site/[slug]/_components/page-header"
import { notFound } from "next/navigation"
import { getPublicTenantBySlug } from "@/lib/services/tenant-public"
import { getPublicBasePath } from "@/lib/utils/public-path"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, BookOpen } from "lucide-react"

export const dynamic = "force-dynamic"

export async function generateMetadata({ params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await params
  const tenant = await getPublicTenantBySlug(slug)
  if (!tenant) return {}
  const program = (tenant.programs || []).find((p: any) => p.id === id)
  if (!program) return {}
  return {
    title: `${program.name} - ${tenant.name}`,
    description: program.description || `Informasi program keahlian ${program.name}`,
  }
}

export default async function ProgramDetailPage({ params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await params
  const tenant = await getPublicTenantBySlug(slug)
  if (!tenant) notFound()

  const program = (tenant.programs || []).find((p: any) => p.id === id)
  if (!program) notFound()

  const base = await getPublicBasePath(slug)

  return (
    <div className="bg-background min-h-screen pb-12">
      <PageHeader
        title={program.name}
        description={`Program Unggulan ${tenant.name}`}
        breadcrumbs={[
          { label: "Beranda", href: base || "/" },
          { label: "Program", href: `${base}/program` },
          { label: program.name },
        ]}
      />

      <article className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white rounded-[2rem] p-8 md:p-12 shadow-xl border border-border">
          {program.imageUrl ? (
            <div className="w-full h-[400px] relative rounded-2xl overflow-hidden mb-10 shadow-md">
              <Image 
                src={program.imageUrl} 
                alt={program.name} 
                fill 
                className="object-cover"
                priority
              />
            </div>
          ) : (
            <div className="w-full h-[300px] bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl flex items-center justify-center mb-10">
              <BookOpen className="h-24 w-24 text-primary/30" />
            </div>
          )}

          <div className="prose prose-lg max-w-none prose-p:text-muted-foreground">
            <h3 className="text-2xl font-bold mb-4">Mengenal Program {program.name}</h3>
            {program.description ? (
              <p className="whitespace-pre-wrap">{program.description}</p>
            ) : (
              <p className="italic">Tidak ada deskripsi detail untuk program ini.</p>
            )}
          </div>
        </div>

        {/* Back Link */}
        <div className="mt-12 text-center">
          <Link
            href={`${base}/program`}
            className="inline-flex items-center gap-2 px-8 py-3 bg-primary/10 text-primary rounded-full text-sm font-bold hover:bg-primary hover:text-white transition-all"
          >
            <ArrowLeft className="h-4 w-4" /> Kembali ke Daftar Program
          </Link>
        </div>
      </article>
    </div>
  )
}
