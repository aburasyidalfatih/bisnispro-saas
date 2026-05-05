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
      {/* ── VIBRANT ACTIVITY HUB BANNER ── */}
      <div className="relative pt-32 pb-40 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-indigo-900 via-primary to-blue-900 overflow-hidden">
         {/* Dynamic Abstract Shapes */}
         <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
         <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-white/5 rounded-full blur-2xl translate-y-1/3 -translate-x-1/4" />
         
         <div className="absolute top-0 left-0 right-0 p-6 z-20">
           <div className="max-w-5xl mx-auto flex items-center justify-between">
              <Link 
                href={`${base}/ekstrakurikuler`}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white text-xs font-bold uppercase tracking-widest transition-all"
              >
                 <ArrowLeft className="h-4 w-4" /> Kembali
              </Link>
           </div>
         </div>

         <div className="max-w-5xl mx-auto relative z-10 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-md text-white font-bold tracking-widest uppercase text-[10px] mb-6 border border-white/20 shadow-lg">
               <Activity className="h-4 w-4" /> Ekstrakurikuler Pilihan
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-white mb-6 drop-shadow-xl">{extra.name}</h1>
            <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto">Wadah kreasi dan inovasi siswa untuk mengembangkan minat, bakat, dan karakter kepemimpinan unggul.</p>
         </div>
      </div>

      <article className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 relative z-20 -mt-24 pb-16">
        <div className="grid md:grid-cols-3 gap-8 items-start">
           
           {/* Visual & Main Description */}
           <div className="md:col-span-2 bg-white rounded-[2.5rem] p-8 shadow-2xl border border-border">
              {extra.imageUrl ? (
                <div className="w-full h-[350px] relative rounded-3xl overflow-hidden mb-10 shadow-lg group">
                  <Image 
                    src={extra.imageUrl} 
                    alt={extra.name} 
                    fill 
                    className="object-cover group-hover:scale-110 transition-transform duration-700"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </div>
              ) : (
                <div className="w-full h-[300px] bg-gradient-to-br from-indigo-500/10 to-blue-500/5 rounded-3xl flex items-center justify-center mb-10 border border-indigo-500/10">
                  <Activity className="h-24 w-24 text-indigo-500/30" />
                </div>
              )}

              <div className="prose prose-lg max-w-none prose-p:text-slate-600 prose-p:leading-relaxed px-4">
                <h3 className="text-2xl font-bold mb-6 text-slate-900">Mengenal {extra.name}</h3>
                {extra.description ? (
                  <p className="whitespace-pre-wrap">{extra.description}</p>
                ) : (
                  <p className="italic text-muted-foreground">Tidak ada deskripsi detail untuk ekstrakurikuler ini.</p>
                )}
              </div>
           </div>

           {/* Info Panel Side */}
           <div className="space-y-6">
              {extra.schedule && (
                <div className="bg-white rounded-[2rem] p-8 shadow-xl border border-border/50 text-center relative overflow-hidden group hover:-translate-y-1 transition-transform">
                  <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="bg-primary/10 h-16 w-16 rounded-2xl flex items-center justify-center text-primary mx-auto mb-4 rotate-3 group-hover:rotate-0 transition-transform">
                    <Clock className="h-8 w-8" />
                  </div>
                  <h4 className="font-bold text-lg text-slate-900 mb-2">Jadwal Latihan</h4>
                  <p className="text-primary font-black text-xl">{extra.schedule}</p>
                  <p className="text-sm text-muted-foreground mt-2">Diharapkan hadir tepat waktu sebelum sesi dimulai.</p>
                </div>
              )}

              <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-[2rem] p-8 shadow-xl text-white text-center">
                 <h4 className="font-bold text-lg mb-4">Tertarik Bergabung?</h4>
                 <p className="text-white/70 text-sm mb-6">Hubungi pembina atau pengurus OSIS bagian ekstrakurikuler untuk pendaftaran anggota baru.</p>
                 <button className="w-full py-3 bg-white text-slate-900 rounded-xl font-bold hover:bg-primary hover:text-white transition-colors">
                    Daftar Sekarang
                 </button>
              </div>
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
