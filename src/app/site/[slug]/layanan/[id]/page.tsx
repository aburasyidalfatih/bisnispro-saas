import { headers } from "next/headers"
import Script from "next/script"
import { PageHeader } from "@/app/site/[slug]/_components/page-header"
import { notFound } from "next/navigation"
import { getTenantLayoutData } from "@/features/tenant/services/tenant-modular.service"
import { db } from "@/lib/db"
import { getPublicBasePath } from "@/lib/utils/public-path"
import { normalizeImageUrl } from "@/lib/utils"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, BookOpen } from "lucide-react"
import { ShareButtons } from "../../blog/[id]/_components/share-buttons"
import DOMPurify from "isomorphic-dompurify"
import { SiteBreadcrumbs } from "@/app/site/[slug]/_components/site-breadcrumbs"



export async function generateMetadata({ params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await params
  const tenant = await getTenantLayoutData(slug)
  if (!tenant) return {}
  const service = await db.service.findFirst({
    where: {
      tenant: { slug },
      OR: [{ id }, { slug: id }]
    }
  })
  if (!service) return {}
  return {
    title: `${service.name} - ${tenant.name}`,
    description: (service.description ? service.description.replace(/<[^>]*>?/gm, '') : `Informasi layanan ${service.name}`),
    alternates: {
      canonical: `/layanan/${service.slug || service.id}`,
    },
  }
}

export default async function ProgramDetailPage({ params }: { params: Promise<{ slug: string; id: string }> }) {
  const headerList = await headers();
  const rootDomain = headerList.get('x-root-domain') || process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'bisnispro.id';
  const { slug, id } = await params
  const tenant = await getTenantLayoutData(slug)
  if (!tenant) notFound()

  const service = await db.service.findFirst({
    where: {
      tenant: { slug },
      OR: [{ id }, { slug: id }]
    }
  })
  if (!service) notFound()

  const base = await getPublicBasePath(slug)
  
  const focusList = [
    "Teori & Praktik Intensif",
    "Sertifikasi Kompetensi",
    "Kemitraan Industri",
    "Pengembangan Karakter"
  ]

  const prospectList = [
    "Terserap di Industri/Perusahaan Mitra",
    "Melanjutkan ke Perstafan Tinggi Terkemuka",
    "Menjadi Wirausaha Muda Profesional"
  ]

  return (
    <div className="bg-background min-h-screen pb-16">
      {/* JSON-LD for Course Rich Snippets */}
      <Script
        id="service-detail-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Course",
            "name": service.name,
            "description": service.description ? service.description.replace(/<[^>]*>?/gm, '') : `Program keahlian ${service.name}`,
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
          <SiteBreadcrumbs 
            tenant={tenant}
            basePath={base}
            targetUrl="/layanan"
            fallbackLabel={(tenant.settings as any)?.labels?.programs?.sectionTitle || "Layanan"}
            currentItemName={service.name}
            currentItemUrl={`/layanan/${service.slug || service.id}`}
          />
          
          <div className="flex items-center gap-3 mb-4 mt-6">
             <div className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold uppercase tracking-widest flex items-center gap-1.5">
               <BookOpen className="h-3.5 w-3.5" /> Layanan
             </div>
          </div>
          
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-foreground leading-tight tracking-tight mb-4">
             {service.name}
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
             Mempersiapkan proyek selesai yang kompeten, profesional, dan berkarakter unggul siap bersaing di dunia kerja maupun jenjang pendidikan tinggi.
          </p>
        </div>
      </div>

      <article className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-10 md:mt-12">
        {service.imageUrl ? (
          <div className="w-full aspect-video relative rounded-3xl overflow-hidden mb-12 shadow-sm border border-border/50 bg-muted">
            <Image 
              src={normalizeImageUrl(service.imageUrl) || service.imageUrl} 
              alt={service.name} 
              fill 
              className="object-cover"
              priority
            />
          </div>
        ) : (
          <div className="w-full aspect-video bg-gradient-to-br from-primary/5 to-primary/10 rounded-3xl flex items-center justify-center mb-12 border border-primary/10">
            <BookOpen className="h-16 w-16 text-primary/20" />
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-12 items-start">
           <div className="prose prose-lg max-w-none text-muted-foreground leading-relaxed">
             <h3 className="text-xl font-bold mb-4 text-foreground">Tentang Program</h3>
             {service.description ? (
               <div className="whitespace-pre-wrap prose prose-slate max-w-none" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(service.description, { ADD_TAGS: ["iframe", "video", "source"], ADD_ATTR: ["allow", "allowfullscreen", "frameborder", "scrolling", "controls"] }) }} />
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
                    <div className="h-5 w-1.5 bg-primary rounded-full" /> Prospek Proyek Selesai
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
          url={`https://${tenant.domain || tenant.slug + '.' + rootDomain}/layanan/${service.id}`} 
          title={service.name}
          tenantId={tenant.id}
        />
      </article>
    </div>
  )
}
