import { headers } from "next/headers"
import { PageHeader } from "@/app/site/[slug]/_components/page-header"
import { notFound } from "next/navigation"
import { getTenantLayoutData, getTenantPrograms } from "@/features/tenant/services/tenant-modular.service"
import { getPublicBasePath } from "@/lib/utils/public-path"
import { normalizeImageUrl } from "@/lib/utils"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, BookOpen } from "lucide-react"
import { ShareButtons } from "../../berita/[id]/_components/share-buttons"
import DOMPurify from "isomorphic-dompurify"

export const revalidate = 60;





export async function generateMetadata({ params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await params
  const tenant = await getTenantLayoutData(slug)
  if (!tenant) return {}
  const programsData = await getTenantPrograms(slug)
  const program = (programsData?.programs || []).find((p: any) => p.id === id || p.slug === id)
  if (!program) return {}
  return {
    title: `${program.name} - ${tenant.name}`,
    description: (program.description ? program.description.replace(/<[^>]*>?/gm, '') : `Informasi program keahlian ${program.name}`),
    alternates: {
      canonical: `/program/${program.slug || program.id}`,
    },
  }
}

export default async function ProgramDetailPage({ params }: { params: Promise<{ slug: string; id: string }> }) {
  const headerList = await headers();
  const rootDomain = headerList.get('x-root-domain') || process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'schoolpro.id';
  const { slug, id } = await params
  const tenant = await getTenantLayoutData(slug)
  if (!tenant) notFound()

  const programsData = await getTenantPrograms(slug)
  const program = (programsData?.programs || []).find((p: any) => p.id === id || p.slug === id)
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
    <div className="bg-background min-h-screen pb-16">
      {/* JSON-LD for Course Rich Snippets */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Course",
            "name": program.name,
            "description": program.description ? program.description.replace(/<[^>]*>?/gm, '') : `Program keahlian ${program.name}`,
            "provider": {
              "@type": "Organization",
              "name": tenant.name,
              "url": `https://${tenant.domain || tenant.slug + '.' + rootDomain}`
            }
          })
        }}
      />
      {/* ── HEADER SECTION ── */}
      <div className="bg-muted/30 pt-8 pb-12 border-b">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link 
            href={`${base}/program`}
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary mb-8 transition-colors"
          >
             <ArrowLeft className="h-4 w-4" /> Kembali
          </Link>
          
          <div className="flex items-center gap-3 mb-4">
             <div className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold uppercase tracking-widest flex items-center gap-1.5">
               <BookOpen className="h-3.5 w-3.5" /> Program Keahlian
             </div>
          </div>
          
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-foreground leading-tight tracking-tight mb-4">
             {program.name}
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
             Mempersiapkan lulusan yang kompeten, profesional, dan berkarakter unggul siap bersaing di dunia kerja maupun jenjang pendidikan tinggi.
          </p>
        </div>
      </div>

      <article className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-10 md:mt-12">
        {program.imageUrl ? (
          <div className="w-full aspect-video md:aspect-[21/9] relative rounded-3xl overflow-hidden mb-12 shadow-sm border border-border/50 bg-muted">
            <Image 
              src={normalizeImageUrl(program.imageUrl) || program.imageUrl} 
              alt={program.name} 
              fill 
              className="object-cover"
              priority
            />
          </div>
        ) : (
          <div className="w-full aspect-[21/9] bg-gradient-to-br from-primary/5 to-primary/10 rounded-3xl flex items-center justify-center mb-12 border border-primary/10">
            <BookOpen className="h-16 w-16 text-primary/20" />
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-12 items-start">
           <div className="prose prose-lg max-w-none text-muted-foreground leading-relaxed">
             <h3 className="text-xl font-bold mb-4 text-foreground">Tentang Program</h3>
             {program.description ? (
               <div className="whitespace-pre-wrap prose prose-slate max-w-none" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(program.description) }} />
             ) : (
               <p className="italic">Tidak ada deskripsi detail untuk program ini.</p>
             )}
           </div>
           
           <div className="space-y-8">
              <div className="bg-background border border-border/50 p-6 rounded-3xl shadow-sm">
                 <h4 className="font-bold text-lg mb-4 text-foreground">Fokus Pembelajaran</h4>
                 <ul className="space-y-3">
                    {focusList.map((item: string, i: number) => (
                       <li key={i} className="flex items-center gap-3 text-sm text-muted-foreground">
                          <div className="h-2 w-2 rounded-full bg-primary" /> {item}
                       </li>
                    ))}
                 </ul>
              </div>

              <div className="bg-muted/30 p-6 rounded-3xl border border-border/50 shadow-sm">
                 <h3 className="text-lg font-bold mb-4 text-foreground flex items-center gap-2">
                    <div className="h-5 w-1.5 bg-primary rounded-full" /> Prospek Lulusan
                 </h3>
                 <div className="space-y-3">
                    {prospectList.map((item: string, i: number) => (
                      <div key={i} className="bg-background p-3 rounded-xl shadow-sm border border-border/50 flex items-center gap-3">
                         <div className="h-8 w-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary font-bold shrink-0 text-sm">{i + 1}</div>
                         <span className="font-medium text-foreground text-sm">{item}</span>
                      </div>
                    ))}
                 </div>
              </div>
           </div>
        </div>

        {/* Share Buttons */}
        <ShareButtons 
          url={`https://${tenant.domain || tenant.slug + '.' + rootDomain}/program/${program.id}`} 
          title={program.name}
          tenantId={tenant.id}
        />
      </article>
    </div>
  )
}
