import { PageHeader } from "@/app/site/[slug]/_components/page-header"
import { notFound } from "next/navigation"
import { getPublicTenantBySlug } from "@/lib/services/tenant-public"
import { getPublicBasePath } from "@/lib/utils/public-path"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, Building2, Users, CheckCircle, Tag } from "lucide-react"

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
      {/* ── IMMERSIVE HERO IMAGE ── */}
      <div className="relative w-full h-[60vh] md:h-[75vh] bg-slate-900">
         {facility.imageUrl ? (
            <img 
               src={facility.imageUrl} 
               alt={facility.name} 
               className="w-full h-full object-cover opacity-80"
            />
         ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/80 to-slate-900 opacity-80 flex items-center justify-center">
               <Building2 className="h-32 w-32 text-white/20" />
            </div>
         )}
         <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
         
         <div className="absolute top-0 left-0 right-0 p-6 z-20">
           <div className="max-w-6xl mx-auto flex items-center justify-between">
              <Link 
                href={`${base}/fasilitas`}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white text-xs font-bold uppercase tracking-widest transition-all"
              >
                 <ArrowLeft className="h-4 w-4" /> Kembali
              </Link>
           </div>
         </div>
      </div>

      <article className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 relative z-20 -mt-32 pb-16">
        <div className="grid lg:grid-cols-3 gap-12 items-start">
           
           {/* Main Content */}
           <div className="lg:col-span-2 bg-white rounded-[2.5rem] p-8 md:p-12 shadow-2xl border border-border">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest mb-6">
                 <Building2 className="h-4 w-4" /> Fasilitas Utama
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-slate-900 leading-tight mb-8">
                 {facility.name}
              </h1>
              
              <div className="prose prose-lg max-w-none prose-p:text-slate-600 prose-p:leading-relaxed">
                 {facility.description ? (
                    <p className="whitespace-pre-wrap first-letter:text-7xl first-letter:font-black first-letter:text-primary first-letter:mr-3 first-letter:float-left first-letter:leading-none">
                       {facility.description}
                    </p>
                 ) : (
                    <p className="italic text-muted-foreground">Tidak ada penjelasan lebih detail mengenai fasilitas ini.</p>
                 )}
              </div>
           </div>

           {/* Sidebar Specs */}
           <div className="bg-slate-50 rounded-[2.5rem] p-8 border border-border sticky top-32">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
                 <div className="h-6 w-1.5 bg-primary rounded-full" />
                 Spesifikasi
              </h3>
              <ul className="space-y-6">
                 <li className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-primary shrink-0"><Tag className="h-5 w-5" /></div>
                    <div>
                       <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Kategori</p>
                       <p className="font-semibold text-slate-900 mt-1">Sarana & Prasarana</p>
                    </div>
                 </li>
                 <li className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-emerald-500 shrink-0"><CheckCircle className="h-5 w-5" /></div>
                    <div>
                       <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Kondisi</p>
                       <p className="font-semibold text-slate-900 mt-1">Sangat Baik / Terawat</p>
                    </div>
                 </li>
                 <li className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-blue-500 shrink-0"><Users className="h-5 w-5" /></div>
                    <div>
                       <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Hak Akses</p>
                       <p className="font-semibold text-slate-900 mt-1">Seluruh Sivitas Akademika</p>
                    </div>
                 </li>
              </ul>
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
