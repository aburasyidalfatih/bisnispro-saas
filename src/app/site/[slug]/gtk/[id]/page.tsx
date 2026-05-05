import { PageHeader } from "@/app/site/[slug]/_components/page-header"
import { notFound } from "next/navigation"
import { getPublicTenantBySlug } from "@/lib/services/tenant-public"
import { getPublicBasePath } from "@/lib/utils/public-path"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, User, Briefcase } from "lucide-react"

export const dynamic = "force-dynamic"

export async function generateMetadata({ params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await params
  const tenant = await getPublicTenantBySlug(slug)
  if (!tenant) return {}
  const staff = (tenant.staff || []).find((s: any) => s.id === id)
  if (!staff) return {}
  return {
    title: `${staff.name} - ${tenant.name}`,
    description: staff.bio || `Profil ${staff.name} (${staff.role}) di ${tenant.name}`,
  }
}

export default async function GTKDetailPage({ params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await params
  const tenant = await getPublicTenantBySlug(slug)
  if (!tenant) notFound()

  const staff = (tenant.staff || []).find((s: any) => s.id === id)
  if (!staff) notFound()

  const base = await getPublicBasePath(slug)

  return (
    <div className="bg-background min-h-screen pb-12">
      <PageHeader
        title={staff.name}
        description={staff.role}
        breadcrumbs={[
          { label: "Beranda", href: base || "/" },
          { label: "Direktori GTK", href: `${base}/gtk` },
          { label: "Profil Staff" },
        ]}
      />

      <article className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white rounded-[2rem] p-8 md:p-12 shadow-xl border border-border flex flex-col md:flex-row gap-10 items-start">
          <div className="w-48 h-48 md:w-56 md:h-56 shrink-0 rounded-2xl overflow-hidden relative shadow-lg border-4 border-white mx-auto md:mx-0">
            {staff.imageUrl ? (
              <Image 
                src={staff.imageUrl} 
                alt={staff.name} 
                fill 
                className="object-cover"
                priority
              />
            ) : (
              <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                <span className="text-6xl font-bold text-primary/30 uppercase">
                  {staff.name.charAt(0)}
                </span>
              </div>
            )}
          </div>

          <div className="flex-1 w-full text-center md:text-left">
            <h2 className="text-3xl font-extrabold mb-2">{staff.name}</h2>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-6">
              <Briefcase className="h-4 w-4" />
              {staff.role}
            </div>

            <div className="prose prose-lg max-w-none prose-p:text-muted-foreground text-left">
              <h3 className="text-lg font-bold mb-3 border-b pb-2">Biografi Singkat</h3>
              {staff.bio ? (
                <p className="whitespace-pre-wrap">{staff.bio}</p>
              ) : (
                <p className="italic">Belum ada informasi biografi yang ditambahkan.</p>
              )}
            </div>
          </div>
        </div>

        {/* Back Link */}
        <div className="mt-12 text-center">
          <Link
            href={`${base}/gtk`}
            className="inline-flex items-center gap-2 px-8 py-3 bg-primary/10 text-primary rounded-full text-sm font-bold hover:bg-primary hover:text-white transition-all"
          >
            <ArrowLeft className="h-4 w-4" /> Kembali ke Direktori GTK
          </Link>
        </div>
      </article>
    </div>
  )
}
