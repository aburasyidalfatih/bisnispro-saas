import { PageHeader } from "@/app/site/[slug]/_components/page-header"
import { notFound } from "next/navigation"
import { getTenantLayoutData, getTenantExtracurriculars } from "@/features/tenant/services/tenant-modular.service"
import { getPublicBasePath } from "@/lib/utils/public-path"
import { normalizeImageUrl } from "@/lib/utils"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, Activity, Clock } from "lucide-react"
import { ShareButtons } from "../../berita/[id]/_components/share-buttons"
import DOMPurify from "isomorphic-dompurify"


export const dynamicParams = true

export async function generateMetadata({ params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await params
  const tenant = await getTenantLayoutData(slug)
  if (!tenant) return {}
  const ekskulData = await getTenantExtracurriculars(slug)
  const extra = (ekskulData?.extracurriculars || []).find((e: any) => e.id === id || e.slug === id)
  if (!extra) return {}
  return {
    title: `${extra.name} - ${tenant.name}`,
    description: (extra.description ? extra.description.replace(/<[^>]*>?/gm, '') : `Informasi Ekstrakurikuler ${extra.name}`),
    alternates: {
      canonical: `/ekstrakurikuler/${extra.slug || extra.id}`,
    },
  }
}

export default async function ExtracurricularDetailPage({ params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await params
  const tenant = await getTenantLayoutData(slug)
  if (!tenant) notFound()

  const ekskulData = await getTenantExtracurriculars(slug)
  const extra = (ekskulData?.extracurriculars || []).find((e: any) => e.id === id || e.slug === id)
  if (!extra) notFound()

  const base = await getPublicBasePath(slug)

  return (
    <div className="bg-background min-h-screen pb-16">
      {/* ── HEADER SECTION ── */}
      <div className="bg-muted/30 pt-8 pb-12 border-b">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link 
            href={`${base}/ekstrakurikuler`}
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary mb-8 transition-colors"
          >
             <ArrowLeft className="h-4 w-4" /> Kembali
          </Link>
          
          <div className="flex items-center gap-3 mb-4">
             <div className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold uppercase tracking-widest flex items-center gap-1.5">
               <Activity className="h-3.5 w-3.5" /> Ekstrakurikuler
             </div>
          </div>
          
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-foreground leading-tight tracking-tight">
             {extra.name}
          </h1>
        </div>
      </div>

      <article className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-10 md:mt-12">
        <div className="grid md:grid-cols-3 gap-8 items-start">
           
           {/* Visual & Main Description */}
           <div className="md:col-span-2">
              {extra.imageUrl ? (
                <div className="w-full aspect-video md:aspect-[21/9] relative rounded-3xl overflow-hidden mb-10 shadow-sm border border-border/50 bg-muted">
                  <Image 
                    src={normalizeImageUrl(extra.imageUrl) || extra.imageUrl} 
                    alt={extra.name} 
                    fill 
                    className="object-cover"
                    priority
                  />
                </div>
              ) : (
                <div className="w-full aspect-[21/9] bg-gradient-to-br from-primary/5 to-primary/10 rounded-3xl flex items-center justify-center mb-10 border border-primary/10">
                  <Activity className="h-16 w-16 text-primary/20" />
                </div>
              )}

              <div className="prose prose-lg max-w-none text-muted-foreground leading-relaxed">
                <h3 className="text-xl font-bold mb-4 text-foreground">Mengenal {extra.name}</h3>
                {extra.description ? (
                  <div className="whitespace-pre-wrap prose prose-slate max-w-none" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(extra.description) }} />
                ) : (
                  <p className="italic">Tidak ada deskripsi detail untuk ekstrakurikuler ini.</p>
                )}
              </div>
           </div>

           {/* Info Panel Side */}
           <div className="space-y-6 sticky top-10">
              {extra.schedule && (
                <div className="bg-background rounded-3xl p-6 shadow-sm border border-border/50">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-primary/10 h-10 w-10 rounded-xl flex items-center justify-center text-primary shrink-0">
                      <Clock className="h-5 w-5" />
                    </div>
                    <h4 className="font-bold text-lg text-foreground">Jadwal Latihan</h4>
                  </div>
                  <p className="text-primary font-bold text-lg mb-2">{extra.schedule}</p>
                  <p className="text-sm text-muted-foreground">Diharapkan hadir tepat waktu sebelum sesi dimulai.</p>
                </div>
              )}

              <div className="bg-muted/30 rounded-3xl p-6 border border-border/50">
                 <h4 className="font-bold text-lg mb-2 text-foreground">Tertarik Bergabung?</h4>
                 <p className="text-muted-foreground text-sm mb-6">
                   {extra.contactPerson 
                     ? `Hubungi pembina ekstrakurikuler: ${extra.contactPerson}`
                     : "Hubungi pembina atau pengurus OSIS untuk pendaftaran."}
                 </p>
                 {extra.registrationUrl ? (
                   <a 
                     href={extra.registrationUrl.startsWith('http') ? extra.registrationUrl : `https://${extra.registrationUrl}`}
                     target="_blank" 
                     rel="noopener noreferrer"
                     className="flex items-center justify-center w-full py-2.5 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors text-sm"
                   >
                      Daftar Sekarang
                   </a>
                 ) : (
                   <button disabled className="w-full py-2.5 bg-muted text-muted-foreground rounded-xl font-medium cursor-not-allowed text-sm">
                      Daftar Offline
                   </button>
                 )}
              </div>
           </div>
        </div>

        {/* Share Buttons */}
        <ShareButtons 
          url={`https://${tenant.domain || tenant.slug + '.schoolpro.id'}/ekstrakurikuler/${extra.slug || extra.id}`} 
          title={extra.name}
          tenantId={tenant.id}
        />
      </article>
    </div>
  )
}
