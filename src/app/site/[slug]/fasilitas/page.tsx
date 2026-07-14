import { headers } from "next/headers"
import { PageHeader } from "@/app/site/[slug]/_components/page-header"
import { notFound } from "next/navigation"
import { Building2, Info, MapPin } from "lucide-react"
import { getTenantLayoutData, getTenantFacilities } from "@/features/tenant/services/tenant-modular.service"
import { getPublicBasePath } from "@/lib/utils/public-path"
import { OptimizedImage } from "@/components/ui/optimized-image"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { db } from "@/lib/db"
import { renderCustomTheme } from "@/app/site/[slug]/_themes/custom-renderer"
import { buildDynamicBreadcrumbs } from "@/lib/utils/breadcrumbs"


export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const headerList = await headers();
  const rootDomain = headerList.get('x-root-domain') || process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'schoolpro.id';
  const { slug } = await params
  const tenant = await getTenantLayoutData(slug)
  if (!tenant) return {}
  
  const title = `Fasilitas Sekolah`
  const description = `Sarana dan prasarana pendukung pendidikan berkualitas di ${tenant.name}`
  const domainUrl = tenant.domain ? `https://${tenant.domain}` : `https://${tenant.slug}.${rootDomain}`
  
  return {
    title,
    description,
    alternates: { canonical: "/fasilitas" },
    openGraph: {
      title,
      description,
      url: `${domainUrl}/fasilitas`,
    }
  }
}

export default async function FasilitasPage({ params }: { params: Promise<{ slug: string }> }) {
  const headerList = await headers();
  const rootDomain = headerList.get('x-root-domain') || process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'schoolpro.id';
  const { slug } = await params
  const tenant = await getTenantLayoutData(slug)
  
  if (!tenant) notFound()

  const facilitiesData = await getTenantFacilities(slug)
  const facilities = facilitiesData?.facilities || []
  const base = await getPublicBasePath(slug)

  // Jika sekolah menggunakan Custom Theme dan menyediakan template fasilitas
  if (tenant.customThemeId && tenant.customTheme?.facilityHtml) {
    const rendered = renderCustomTheme({
      templateHtml: tenant.customTheme.facilityHtml,
      layoutHtml: tenant.customTheme.layoutHtml,
      customCss: tenant.customTheme.customCss,
      customJs: tenant.customTheme.customJs,
      context: { tenant: { ...tenant, facilities }, base, settings: tenant.settings || {} },
    })
    if (rendered) return rendered
  }

  // Generate perfect asymmetric spans for a 12-column grid
  const getSpansArray = (total: number): number[] => {
    if (total <= 0) return []
    if (total === 1) return [12]
    if (total === 2) return [6, 6]
    if (total === 3) return [4, 4, 4]
    
    const spans: number[] = []
    let remaining = total
    while (remaining > 0) {
      if (remaining === 1) {
        spans.push(12)
        remaining -= 1
      } else if (remaining === 2) {
        spans.push(6, 6)
        remaining -= 2
      } else if (remaining === 3) {
        spans.push(4, 4, 4)
        remaining -= 3
      } else if (remaining === 4) {
        spans.push(8, 4, 4, 8)
        remaining -= 4
      } else {
        if (spans.length % 2 === 0) {
          spans.push(8, 4)
          remaining -= 2
        } else {
          spans.push(4, 4, 4)
          remaining -= 3
        }
      }
    }
    return spans
  }

  const spans = getSpansArray(facilities.length)

  return (
    <div className="bg-background min-h-screen">
      {/* ── HERO SECTION ── */}
      <PageHeader
        title={(tenant.settings as any)?.labels?.facilities?.sectionTitle || "Fasilitas Sekolah"}
        description={(tenant.settings as any)?.labels?.facilities?.sectionSubtitle || "Sarana dan prasarana pendukung pendidikan berkualitas untuk kenyamanan seluruh siswa."}
        breadcrumbs={buildDynamicBreadcrumbs(tenant.websiteMenus || [], "/fasilitas", (tenant.settings as any)?.labels?.facilities?.sectionTitle || "Fasilitas Sekolah")}
      />

      {/* ── MAIN CONTENT ── */}
      <section className="py-16 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {facilities.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            {facilities.map((facility: any, index: number) => {
              const span = spans[index] || 4
              const spanClass = span === 12 
                ? "md:col-span-12 h-[450px]" 
                : span === 8 
                  ? "md:col-span-8 h-[400px]" 
                  : span === 6 
                    ? "md:col-span-6 h-[380px]" 
                    : "md:col-span-4 h-[350px]"

              return (
                <Link 
                  key={facility.id} 
                  href={`${base}/fasilitas/${facility.slug || facility.id}`}
                  className={cn(
                    "group relative overflow-hidden rounded-[2.5rem] flex flex-col shadow-sm hover:shadow-2xl transition-all duration-700 hover:-translate-y-2 border border-border/40",
                    spanClass
                  )}
                >
                  <div className="absolute inset-0 bg-muted">
                    <OptimizedImage
                      src={facility.imageUrl || "https://images.unsplash.com/photo-1541339907198-e08756ebafe3?q=80&w=2070"}
                      alt={facility.name}
                      fill
                      className="object-cover transition-transform duration-1000 group-hover:scale-110"
                    />
                    {/* Glowing color gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent opacity-85 group-hover:opacity-95 transition-all duration-500" />
                    <div className="absolute inset-0 bg-primary/10 mix-blend-overlay opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                  </div>
                  
                  {/* Floating Glassmorphism Specs Badge */}
                  <div className="absolute top-6 right-6 flex gap-2 z-20">
                    <span className="px-3 py-1.5 backdrop-blur-md bg-white/10 text-white rounded-full text-[10px] font-bold uppercase tracking-widest border border-white/20 shadow-sm">
                      {facility.category || "UMUM"}
                    </span>
                  </div>

                  <div className="relative mt-auto p-8 flex flex-col justify-end text-white z-10">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="bg-primary/95 text-primary-foreground px-3.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg">
                        Fasilitas
                      </div>
                      {facility.condition && (
                        <div className="backdrop-blur-md bg-white/10 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest shadow-sm">
                          {facility.condition}
                        </div>
                      )}
                    </div>
                    <h3 className="text-2xl md:text-3xl font-black mb-2 group-hover:text-primary-foreground transition-colors leading-tight">
                      {facility.name}
                    </h3>
                    <p className="text-white/80 text-sm leading-relaxed mb-0 line-clamp-2 transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                      {facility.description ? facility.description.replace(/<[^>]*>?/gm, '') : "Klik untuk melihat informasi selengkapnya mengenai sarana prasarana sekolah ini."}
                    </p>
                  </div>
                </Link>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-20 bg-muted/20 rounded-3xl border border-dashed border-border">
            <div className="bg-primary/10 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Building2 className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-bold">Data Fasilitas Belum Tersedia</h3>
            <p className="text-muted-foreground mt-2 max-w-sm mx-auto">
              Maaf, saat ini kami belum memperbarui daftar fasilitas sekolah secara detail di website ini.
            </p>
          </div>
        )}
      </section>

      {/* ── CALL TO ACTION ── */}
      <section className="py-20 bg-primary/5 border-y border-primary/10">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Ingin Melihat Langsung?</h2>
          <p className="text-muted-foreground mb-8 text-lg">
            Kami mengundang Anda untuk berkunjung dan melihat langsung sarana pendidikan yang kami miliki. Jadwalkan kunjungan Anda sekarang.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link 
              href={`${base}/contact`} 
              className="px-8 py-3 bg-primary text-white rounded-full font-bold hover:shadow-lg transition-all"
            >
              Hubungi Kami
            </Link>
            <Link 
              href={base} 
              className="px-8 py-3 bg-background border border-border rounded-full font-bold hover:bg-muted transition-all"
            >
              Kembali ke Beranda
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
