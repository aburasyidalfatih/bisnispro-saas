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
  
  const focusList = program.focus ? program.focus.split(',').map((f: string) => f.trim()).filter(Boolean) : [
    "Teori & Praktik Intensif",
    "Sertifikasi Kompetensi",
    "Kemitraan Industri",
    "Pengembangan Karakter"
  ]

  const prospectList = program.prospects ? program.prospects.split(',').map((p: string) => p.trim()).filter(Boolean) : [
    "Terserap di Industri/Perusahaan Mitra",
    "Melanjutkan ke Perguruan Tinggi Terkemuka",
    "Menjadi Wirausaha Muda Profesional"
  ]

  return (
    <div className="bg-background min-h-screen pb-12">
      {/* ── ACADEMIC COURSE BANNER ── */}
      <div className="relative pt-32 pb-40 px-4 sm:px-6 lg:px-8 bg-slate-900 overflow-hidden">
         <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/blueprint.png')] opacity-10" />
         
         <div className="absolute top-0 left-0 right-0 p-6 z-20">
           <div className="max-w-5xl mx-auto flex items-center justify-between">
              <Link 
                href={`${base}/program`}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white text-xs font-bold uppercase tracking-widest transition-all"
              >
                 <ArrowLeft className="h-4 w-4" /> Kembali
              </Link>
           </div>
         </div>

         <div className="max-w-5xl mx-auto relative z-10 flex flex-col md:flex-row items-center gap-12">
            <div className="flex-1 text-center md:text-left">
               <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 text-primary-foreground font-bold tracking-widest uppercase text-[10px] mb-6 border border-primary/30">
                  <BookOpen className="h-4 w-4" /> Program Keahlian Unggulan
               </div>
               <h1 className="text-4xl md:text-6xl font-black text-white mb-6 leading-tight">{program.name}</h1>
               <p className="text-lg text-white/70 max-w-xl mx-auto md:mx-0">
                  Mempersiapkan lulusan yang kompeten, profesional, dan berkarakter unggul siap bersaing di dunia kerja maupun jenjang pendidikan tinggi.
               </p>
            </div>
            
            {/* Quick Stats or Focus Area */}
            <div className="bg-white/10 backdrop-blur-md rounded-[2rem] p-8 border border-white/20 w-full md:w-80 shrink-0">
               <h4 className="text-white font-bold mb-4">Fokus Pembelajaran</h4>
               <ul className="space-y-3">
                  {focusList.map((item: string, i: number) => (
                     <li key={i} className="flex items-center gap-3 text-sm text-white/80">
                        <div className="h-2 w-2 rounded-full bg-primary" /> {item}
                     </li>
                  ))}
               </ul>
            </div>
         </div>
      </div>

      <article className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 relative z-20 -mt-24 pb-16">
        <div className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-2xl border border-border mb-12">
          {program.imageUrl ? (
            <div className="w-full h-[350px] relative rounded-[2rem] overflow-hidden mb-10 shadow-lg">
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

          <div className="grid md:grid-cols-2 gap-12">
             <div className="prose prose-lg max-w-none prose-p:text-slate-600 prose-p:leading-relaxed">
               <h3 className="text-2xl font-bold mb-6 text-slate-900 border-b border-border/50 pb-4">Tentang Program</h3>
               {program.description ? (
                 <p className="whitespace-pre-wrap">{program.description}</p>
               ) : (
                 <p className="italic text-muted-foreground">Tidak ada deskripsi detail untuk program ini.</p>
               )}
             </div>
             
             <div className="bg-slate-50 p-8 rounded-[2rem] border border-border">
                <h3 className="text-xl font-bold mb-6 text-slate-900 flex items-center gap-3">
                   <div className="h-8 w-2 bg-primary rounded-full" /> Prospek Lulusan
                </h3>
                <p className="text-slate-600 mb-6">Lulusan dari program keahlian {program.name} memiliki prospek masa depan yang cerah, antara lain:</p>
                <div className="space-y-4">
                   {prospectList.map((item: string, i: number) => (
                     <div key={i} className="bg-white p-4 rounded-xl shadow-sm border border-border/50 flex items-center gap-4">
                        <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary font-bold">{i + 1}</div>
                        <span className="font-medium text-slate-700">{item}</span>
                     </div>
                   ))}
                </div>
             </div>
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
