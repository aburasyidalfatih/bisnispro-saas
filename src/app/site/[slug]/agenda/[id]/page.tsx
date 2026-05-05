import { PageHeader } from "@/app/site/[slug]/_components/page-header"
import { notFound } from "next/navigation"
import { getPublicTenantBySlug } from "@/lib/services/tenant-public"
import { getPublicBasePath } from "@/lib/utils/public-path"
import Link from "next/link"
import { Calendar, ArrowLeft, Clock, MapPin, User } from "lucide-react"
import { format } from "date-fns"
import { id as idLocale } from "date-fns/locale"

export const dynamic = "force-dynamic"

export async function generateMetadata({ params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await params
  const tenant = await getPublicTenantBySlug(slug)
  if (!tenant) return {}
  const event = (tenant.events || []).find((e: any) => e.id === id)
  if (!event) return {}
  return {
    title: `${event.title} - ${tenant.name}`,
    description: event.description || `Agenda kegiatan ${event.title}`,
  }
}

export default async function AgendaDetailPage({ params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await params
  const tenant = await getPublicTenantBySlug(slug)
  if (!tenant) notFound()

  const event = (tenant.events || []).find((e: any) => e.id === id)
  if (!event) notFound()

  const base = await getPublicBasePath(slug)

  return (
    <div className="bg-background min-h-screen pb-12">
      <PageHeader
        title={event.title}
        description={
          <div className="flex flex-wrap items-center gap-4 justify-center text-sm">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              {format(new Date(event.startDate), "dd MMMM yyyy", { locale: idLocale })}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              {format(new Date(event.startDate), "HH:mm")} WIB
            </span>
          </div>
        }
        breadcrumbs={[
          { label: "Beranda", href: base || "/" },
          { label: "Agenda", href: `${base}/agenda` },
          { label: event.title },
        ]}
      />

      <article className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white rounded-[2rem] p-8 md:p-12 shadow-xl border border-border">
          <div className="grid md:grid-cols-2 gap-8 mb-10">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <MapPin className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-lg mb-1">Lokasi Kegiatan</h3>
                <p className="text-muted-foreground">{event.location || "Area Sekolah"}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <User className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-lg mb-1">Contact Person</h3>
                <p className="text-muted-foreground">{event.contactPerson || "Panitia / Tata Usaha"}</p>
              </div>
            </div>
          </div>

          <div className="prose prose-lg max-w-none prose-p:text-muted-foreground">
            <h3 className="text-xl font-bold mb-4">Deskripsi Kegiatan</h3>
            {event.description ? (
              <p className="whitespace-pre-wrap">{event.description}</p>
            ) : (
              <p className="italic">Tidak ada deskripsi detail untuk agenda ini.</p>
            )}
          </div>
        </div>

        {/* Back Link */}
        <div className="mt-12 text-center">
          <Link
            href={`${base}/agenda`}
            className="inline-flex items-center gap-2 px-8 py-3 bg-primary/10 text-primary rounded-full text-sm font-bold hover:bg-primary hover:text-white transition-all"
          >
            <ArrowLeft className="h-4 w-4" /> Kembali ke Daftar Agenda
          </Link>
        </div>
      </article>
    </div>
  )
}
