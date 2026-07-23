import { headers } from "next/headers"
import { PageHeader } from "@/app/site/[slug]/_components/page-header"
import { notFound } from "next/navigation"
import { getTenantLayoutData } from "@/features/tenant/services/tenant-modular.service"
import { getPublicEvents } from "@/features/tenant/services/tenant-public-queries.service"
import { cache } from "react"

const getEvent = cache(async (tenantId: string, slugOrId: string) => {
  const events = await getPublicEvents(tenantId)
  return events.find((e: any) => e.id === slugOrId || e.slug === slugOrId) || null
})
import { getPublicBasePath } from "@/lib/utils/public-path"
import Link from "next/link"
import { Calendar, ArrowLeft, Clock, MapPin, User } from "lucide-react"
import { format } from "date-fns"
import { formatInTimeZone } from "date-fns-tz"
import { id as idLocale } from "date-fns/locale"
import { ShareButtons } from "../../berita/[id]/_components/share-buttons"
import { EventViewCounter } from "./_components/view-counter"
import { getEventViews } from "@/features/post/services/views.service"
import DOMPurify from "isomorphic-dompurify"
import { SiteBreadcrumbs } from "@/app/site/[slug]/_components/site-breadcrumbs"


export async function generateMetadata({ params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await params
  const tenant = await getTenantLayoutData(slug)
  if (!tenant) return {}
  const event = await getEvent(tenant.id, id)
  if (!event) return {}
  return {
    title: `${event.title} - ${tenant.name}`,
    description: (event.description ? event.description.replace(/<[^>]*>?/gm, '') : `Agenda kegiatan ${event.title}`),
    alternates: {
      canonical: `/agenda/${event.slug || event.id}`,
    },
  }
}

export default async function AgendaDetailPage({ params }: { params: Promise<{ slug: string; id: string }> }) {
  const headerList = await headers();
  const rootDomain = headerList.get('x-root-domain') || process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'schoolpro.id';
  const { slug, id } = await params
  const tenant = await getTenantLayoutData(slug)
  if (!tenant) notFound()

  const event = await getEvent(tenant.id, id)
  if (!event) notFound()

  const base = await getPublicBasePath(slug)
  
  const redisViews = await getEventViews(id)
  const totalViews = (event.viewCount || 0) + redisViews

  const tz = (tenant.settings as any)?.timezone || (tenant.settings as any)?.attendance?.timezone || "Asia/Jakarta"
  const tzLabel = tz === "Asia/Makassar" || tz === "Asia/Pontianak" ? "WITA" : tz === "Asia/Jayapura" ? "WIT" : "WIB"

  return (
    <div className="bg-background min-h-screen pb-16">
      {/* JSON-LD for Event Rich Snippets */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Event",
            "name": event.title,
            "startDate": event.startDate,
            "endDate": event.endDate || event.startDate,
            "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
            "eventStatus": "https://schema.org/EventScheduled",
            "location": {
              "@type": "Place",
              "name": event.location || "Sekolah",
              "address": {
                "@type": "PostalAddress",
                "addressCountry": "ID"
              }
            },
            "description": event.description || `Agenda kegiatan ${event.title}`,
            "organizer": {
              "@type": "Organization",
              "name": tenant.name,
              "url": `https://${tenant.domain || tenant.slug + '.' + rootDomain}`
            }
          })
        }}
      />

      {/* ── HEADER SECTION ── */}
      <div className="bg-muted/30 pt-6 pb-10 border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <SiteBreadcrumbs 
            tenant={tenant}
            basePath={base}
            targetUrl="/agenda"
            fallbackLabel={(tenant.settings as any)?.labels?.agenda?.sectionTitle || "Agenda"}
            currentItemName={event.title}
            currentItemUrl={`/agenda/${event.slug || event.id}`}
          />
          
          <div className="flex flex-wrap items-center gap-3 mb-4 mt-6">
             <div className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold uppercase tracking-widest flex items-center gap-1.5">
               <Calendar className="h-3.5 w-3.5" /> Agenda
             </div>
             <div className="flex items-center gap-1.5 text-sm text-muted-foreground font-medium">
                <Clock className="h-4 w-4" />
                {formatInTimeZone(new Date(event.startDate), tz, "HH:mm")} - {formatInTimeZone(new Date(event.endDate || event.startDate), tz, "HH:mm")} {tzLabel}
             </div>
             <div className="flex items-center gap-1.5 text-sm text-muted-foreground font-medium">
                <MapPin className="h-4 w-4" />
                {event.location || "Area Kampus"}
             </div>
             <EventViewCounter eventId={event.id} initialViews={totalViews} />
          </div>
          
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-foreground leading-tight tracking-tight">
             {event.title}
          </h1>
        </div>
      </div>

      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-10 md:mt-12">
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {/* Date Card */}
          <div className="bg-muted rounded-3xl p-6 text-center border border-border/50 shadow-sm flex flex-col justify-center">
             <div className="text-primary font-bold uppercase tracking-widest text-xs mb-1">
                {formatInTimeZone(new Date(event.startDate), tz, "MMMM", { locale: idLocale })}
             </div>
             <div className="text-5xl font-black text-foreground leading-none mb-1">
                {formatInTimeZone(new Date(event.startDate), tz, "dd")}
             </div>
             <div className="text-muted-foreground font-medium text-sm">
                {formatInTimeZone(new Date(event.startDate), tz, "yyyy")}
             </div>
          </div>
          
          {/* Info Cards */}
          <div className="md:col-span-2 grid sm:grid-cols-2 gap-4">
            <div className="bg-background rounded-2xl p-5 border border-border/50 flex items-start gap-4 shadow-sm">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <MapPin className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Lokasi</p>
                <p className="text-sm font-medium text-foreground">{event.location || "Area Sekolah"}</p>
              </div>
            </div>
            <div className="bg-background rounded-2xl p-5 border border-border/50 flex items-start gap-4 shadow-sm">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Kontak</p>
                <p className="text-sm font-medium text-foreground">{event.contactPerson || "Panitia / Tata Usaha"}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="prose prose-lg max-w-none text-muted-foreground leading-relaxed prose-p:my-2 prose-li:my-0 prose-ul:my-2 prose-ol:my-2">
          <h3 className="text-xl font-bold text-foreground mb-4">Deskripsi Kegiatan</h3>
          {event.description ? (
            <div className="whitespace-pre-wrap prose prose-slate max-w-none prose-p:mb-6 prose-p:mt-2 prose-p:leading-relaxed prose-li:my-0 prose-ul:my-2 prose-ol:my-2" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(event.description, { ADD_TAGS: ["iframe", "video", "source"], ADD_ATTR: ["allow", "allowfullscreen", "frameborder", "scrolling", "controls"] }) }} />
          ) : (
            <p className="italic">Tidak ada deskripsi detail untuk agenda ini.</p>
          )}
        </div>

        {/* Share Buttons */}
        <ShareButtons 
          url={`https://${tenant.domain || tenant.slug + '.' + rootDomain}/agenda/${event.slug || event.id}`} 
          title={event.title}
          tenantId={tenant.id}
        />
      </article>
    </div>
  )
}
