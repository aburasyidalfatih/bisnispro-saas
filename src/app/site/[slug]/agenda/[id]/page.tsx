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
      <div className="bg-slate-900 pt-24 pb-32 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Background Accents */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 opacity-20">
           <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary rounded-full blur-[120px]" />
           <div className="absolute top-1/2 -left-24 w-72 h-72 bg-blue-500 rounded-full blur-[100px]" />
        </div>

        <div className="max-w-5xl mx-auto relative z-10 flex flex-col md:flex-row gap-12 items-center md:items-start">
           {/* Date Box */}
           <div className="bg-white rounded-[2rem] p-8 text-center shadow-2xl shrink-0 w-full md:w-64 border-b-8 border-primary transform md:-rotate-2 hover:rotate-0 transition-transform duration-500">
              <div className="text-primary font-black uppercase tracking-[0.3em] text-sm mb-2">
                 {format(new Date(event.startDate), "MMMM", { locale: idLocale })}
              </div>
              <div className="text-7xl font-black text-slate-900 leading-none mb-2">
                 {format(new Date(event.startDate), "dd")}
              </div>
              <div className="text-slate-500 font-bold">
                 {format(new Date(event.startDate), "yyyy")}
              </div>
              <div className="mt-6 pt-6 border-t border-dashed border-slate-200">
                 <button className="w-full py-3 bg-primary/10 text-primary rounded-xl font-bold text-sm hover:bg-primary hover:text-white transition-all flex items-center justify-center gap-2">
                    <Calendar className="h-4 w-4" /> Simpan Jadwal
                 </button>
              </div>
           </div>

           {/* Event Details */}
           <div className="flex-1 text-center md:text-left">
              <Link 
                href={`${base}/agenda`}
                className="inline-flex items-center gap-2 text-white/60 hover:text-white mb-6 text-sm font-semibold transition-colors"
              >
                 <ArrowLeft className="h-4 w-4" /> Kembali ke Agenda
              </Link>
              <h1 className="text-4xl md:text-5xl font-black text-white leading-tight mb-6">
                 {event.title}
              </h1>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                 <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full text-white text-sm font-medium border border-white/10">
                    <Clock className="h-4 w-4 text-primary" />
                    {event.time || format(new Date(event.startDate), "HH:mm")} WIB
                 </div>
                 <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full text-white text-sm font-medium border border-white/10">
                    <MapPin className="h-4 w-4 text-primary" />
                    {event.location || "Area Kampus"}
                 </div>
              </div>
           </div>
        </div>
      </div>

      <article className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 -mt-20 relative z-20 pb-16">
        <div className="bg-white rounded-[2.5rem] p-8 md:p-16 shadow-2xl border border-border">
          <div className="grid md:grid-cols-2 gap-8 mb-12 pb-12 border-b border-border/50">
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

          <div className="prose prose-lg max-w-none prose-p:text-muted-foreground prose-p:leading-relaxed">
            <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
               <div className="h-8 w-2 bg-primary rounded-full" />
               Deskripsi Kegiatan
            </h3>
            {event.description ? (
              <p className="whitespace-pre-wrap text-lg">{event.description}</p>
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
