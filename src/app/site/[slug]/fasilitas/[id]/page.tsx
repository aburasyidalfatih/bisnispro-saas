import { PageHeader } from "@/app/site/[slug]/_components/page-header"
import { notFound } from "next/navigation"
import { getTenantLayoutData } from "@/features/tenant/services/tenant-modular.service"
import { getPublicBasePath } from "@/lib/utils/public-path"
import { normalizeImageUrl } from "@/lib/utils"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, Building2, Users, CheckCircle, Tag } from "lucide-react"
import { db } from "@/lib/db"
import DOMPurify from "isomorphic-dompurify"

export const revalidate = 60;





export async function generateMetadata({ params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await params
  const tenant = await getTenantLayoutData(slug)
  if (!tenant) return {}
  const facility = await db.facility.findFirst({ where: { OR: [{ id }, { slug: id }], tenantId: tenant.id } })
  if (!facility) return {}
  return {
    title: `${facility.name} - ${tenant.name}`,
    description: (facility.description ? facility.description.replace(/<[^>]*>?/gm, '') : `Fasilitas ${facility.name} di ${tenant.name}`),
    alternates: {
      canonical: `/fasilitas/${facility.slug || facility.id}`,
    },
  }
}

export default async function FacilityDetailPage({ params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await params
  const tenant = await getTenantLayoutData(slug)
  if (!tenant) notFound()

  const facility = await db.facility.findFirst({ where: { OR: [{ id }, { slug: id }], tenantId: tenant.id } })
  if (!facility) notFound()

  const base = await getPublicBasePath(slug)

  return (
    <div className="bg-background min-h-screen pb-16">
      {/* ── HEADER SECTION ── */}
      <div className="bg-muted/30 pt-8 pb-12 border-b">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link 
            href={`${base}/fasilitas`}
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary mb-8 transition-colors"
          >
             <ArrowLeft className="h-4 w-4" /> Kembali
          </Link>
          
          <div className="flex items-center gap-3 mb-4">
             <div className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold uppercase tracking-widest flex items-center gap-1.5">
               <Building2 className="h-3.5 w-3.5" /> Fasilitas Utama
             </div>
          </div>
          
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-foreground leading-tight tracking-tight">
             {facility.name}
          </h1>
        </div>
      </div>

      <article className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-10 md:mt-12">
        <div className="grid lg:grid-cols-3 gap-12 items-start">
           
           {/* Main Content */}
           <div className="lg:col-span-2">
              {facility.imageUrl ? (
                <div className="w-full aspect-video md:aspect-[21/9] relative rounded-3xl overflow-hidden mb-10 shadow-sm border border-border/50 bg-muted">
                   <Image 
                    src={normalizeImageUrl(facility.imageUrl) || facility.imageUrl} 
                    alt={facility.name} 
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 70vw, 50vw"
                    priority
                  />
                </div>
              ) : (
                <div className="w-full aspect-[21/9] bg-gradient-to-br from-primary/5 to-primary/10 rounded-3xl flex items-center justify-center mb-10 border border-primary/10">
                  <Building2 className="h-16 w-16 text-primary/20" />
                </div>
              )}
              
              <div className="prose prose-lg max-w-none text-muted-foreground leading-relaxed">
                 {facility.description ? (
                    <div className="whitespace-pre-wrap prose prose-slate max-w-none" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(facility.description) }} />
                 ) : (
                    <p className="italic">Tidak ada penjelasan lebih detail mengenai fasilitas ini.</p>
                 )}
              </div>
           </div>

           {/* Sidebar Specs */}
           <div className="bg-muted/30 rounded-3xl p-8 border border-border/50 sticky top-10">
              <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                 <div className="h-5 w-1.5 bg-primary rounded-full" />
                 Spesifikasi
              </h3>
              <ul className="space-y-6">
                 <li className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-xl bg-background shadow-sm border border-border/50 flex items-center justify-center text-primary shrink-0"><Tag className="h-5 w-5" /></div>
                     <div>
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Kategori</p>
                        <p className="font-semibold text-foreground mt-1">{facility.category || "Fasilitas Umum"}</p>
                     </div>
                  </li>
                  <li className="flex items-start gap-4">
                     <div className="h-10 w-10 rounded-xl bg-background shadow-sm border border-border/50 flex items-center justify-center text-emerald-500 shrink-0"><CheckCircle className="h-5 w-5" /></div>
                     <div>
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Kondisi</p>
                        <p className="font-semibold text-foreground mt-1">{facility.condition || "Baik"}</p>
                     </div>
                  </li>
                  <li className="flex items-start gap-4">
                     <div className="h-10 w-10 rounded-xl bg-background shadow-sm border border-border/50 flex items-center justify-center text-blue-500 shrink-0"><Users className="h-5 w-5" /></div>
                     <div>
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Hak Akses</p>
                        <p className="font-semibold text-foreground mt-1">{facility.access || "Umum"}</p>
                     </div>
                 </li>
              </ul>
           </div>

        </div>
      </article>
    </div>
  )
}
