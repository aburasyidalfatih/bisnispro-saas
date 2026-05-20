import { PageHeader } from "@/app/site/[slug]/_components/page-header"
import { notFound } from "next/navigation"
import Link from "next/link"
import { getPublicTenantBySlug } from "@/features/tenant/services/tenant-public.service"
import { getPublicBasePath } from "@/lib/utils/public-path"
import { Calendar, MapPin, Clock, ArrowRight, Search } from "lucide-react"
import { format } from "date-fns"
import { id } from "date-fns/locale"

export default async function AgendaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const tenant = await getPublicTenantBySlug(slug)
  if (!tenant) notFound()

  const events = tenant.events || []
  const base = await getPublicBasePath(slug)

  // Custom Theme rendering
  if (tenant.customThemeId && tenant.customTheme?.agendaHtml) {
    const { renderCustomTheme } = await import("@/app/site/[slug]/_themes/custom-renderer")
    const rendered = renderCustomTheme({
      templateHtml: tenant.customTheme.agendaHtml,
      layoutHtml: tenant.customTheme.layoutHtml,
      customCss: tenant.customTheme.customCss,
      customJs: tenant.customTheme.customJs,
      context: { tenant: { ...tenant, events }, base, settings: tenant.settings || {} },
    })
    if (rendered) return rendered
  }

  return (
    <div className="bg-background min-h-screen pb-12">
      {/* ── HERO SECTION ── */}
      <PageHeader
        title="Agenda & Acara Sekolah"
        description={<>Jadwal kegiatan akademik, hari besar, dan acara menarik lainnya di {tenant.name}.</>}
        breadcrumbs={[
          { label: "Informasi" },
          { label: "Informasi Acara" }
        ]}
      />

      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        {events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 bg-white/50 rounded-[3rem] border border-dashed border-border/60">
             <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-6">
               <Calendar className="h-10 w-10" />
             </div>
             <h3 className="text-2xl font-bold mb-2">Belum ada agenda</h3>
             <p className="text-muted-foreground max-w-sm text-center">Jadwal acara dan kegiatan sekolah akan segera diperbarui di sini.</p>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-6">
            {events.map((event: any) => (
              <Link 
                key={event.id} 
                href={`${base}/agenda/${event.id}`}
                className="group flex flex-col md:flex-row bg-white rounded-3xl overflow-hidden border border-border/50 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative"
              >
                {/* Decoration line */}
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary/20 group-hover:bg-primary transition-colors" />
                
                <div className="md:w-56 bg-primary/5 group-hover:bg-primary text-primary group-hover:text-white flex flex-col items-center justify-center p-8 text-center transition-colors duration-300">
                   <p className="text-xs font-bold uppercase tracking-[0.2em] opacity-80 mb-2">
                      {format(new Date(event.startDate), 'MMMM', { locale: id })}
                   </p>
                   <p className="text-6xl font-black leading-none mb-2">
                      {format(new Date(event.startDate), 'dd')}
                   </p>
                   <p className="text-sm font-bold opacity-80">
                      {format(new Date(event.startDate), 'yyyy')}
                   </p>
                </div>
                <div className="flex-1 p-8 md:p-10 flex flex-col justify-center">
                  <h3 className="text-2xl font-bold mb-4 text-slate-900 group-hover:text-primary transition-colors">{event.title}</h3>
                  <div className="flex flex-wrap gap-x-8 gap-y-3 text-sm text-muted-foreground mb-6 font-medium">
                     <div className="flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-lg">
                        <Clock className="h-4 w-4 text-primary" /> {event.time || "08.00 - Selesai"}
                     </div>
                     <div className="flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-lg">
                        <MapPin className="h-4 w-4 text-primary" /> {event.location || "Area Sekolah"}
                     </div>
                  </div>
                  <p className="text-muted-foreground line-clamp-2 leading-relaxed">
                     {event.description || "Silakan klik untuk melihat detail informasi agenda kegiatan ini."}
                  </p>
                  <div className="mt-6 flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                    Lihat Detail <ArrowRight className="h-3 w-3" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Info tambahan */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-16">
         <div className="bg-primary/5 rounded-3xl p-8 border border-primary/10 flex flex-col md:flex-row items-center gap-6">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
               <Search className="h-6 w-6" />
            </div>
            <div className="flex-1 text-center md:text-left">
               <h4 className="font-bold text-lg">Ada pertanyaan mengenai acara?</h4>
               <p className="text-sm text-muted-foreground">Silakan hubungi bagian kesiswaan atau panitia terkait untuk informasi lebih lanjut.</p>
            </div>
            <Link href={`${base}/contact`} className="px-6 py-2.5 bg-white border border-primary/20 text-primary rounded-xl text-sm font-bold hover:bg-primary/5 transition-colors">
               Hubungi Kami
            </Link>
         </div>
      </section>
    </div>
  )
}
