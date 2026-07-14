import { headers } from "next/headers"
import { PageHeader } from "@/app/site/[slug]/_components/page-header"
import { notFound } from "next/navigation"
import { BookOpen, Target, ArrowRight, Star, CheckCircle2, Award } from "lucide-react"
import { getTenantLayoutData, getTenantPrograms } from "@/features/tenant/services/tenant-modular.service"
import { OptimizedImage } from "@/components/ui/optimized-image"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { getPublicBasePath } from "@/lib/utils/public-path"
import { renderCustomTheme } from "@/app/site/[slug]/_themes/custom-renderer"
import { buildDynamicBreadcrumbs } from "@/lib/utils/breadcrumbs"


export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const headerList = await headers();
  const rootDomain = headerList.get('x-root-domain') || process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'schoolpro.id';
  const { slug } = await params
  const tenant = await getTenantLayoutData(slug)
  if (!tenant) return {}
  const programData = await getTenantPrograms(slug)
  const programs = programData?.programs || []
  
  const title = `Program Unggulan`
  const description = `Daftar program keahlian dan akademik unggulan di ${tenant.name}`
  const domainUrl = tenant.domain ? `https://${tenant.domain}` : `https://${tenant.slug}.${rootDomain}`
  
  return {
    title,
    description,
    alternates: { canonical: "/program" },
    openGraph: {
      title,
      description,
      url: `${domainUrl}/program`,
    }
  }
}

export default async function ProgramPage({ params }: { params: Promise<{ slug: string }> }) {
  const headerList = await headers();
  const rootDomain = headerList.get('x-root-domain') || process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'schoolpro.id';
  const { slug } = await params
  const tenant = await getTenantLayoutData(slug)
  
  if (!tenant) notFound()

  const programData = await getTenantPrograms(slug)
  const programs = programData?.programs || []
  const base = await getPublicBasePath(slug)

  // Custom Theme rendering
  if (tenant.customThemeId && tenant.customTheme?.programHtml) {
    const rendered = renderCustomTheme({
      templateHtml: tenant.customTheme.programHtml,
      layoutHtml: tenant.customTheme.layoutHtml,
      customCss: tenant.customTheme.customCss,
      customJs: tenant.customTheme.customJs,
      context: { tenant: { ...tenant, programs }, base, settings: tenant.settings || {} },
    })
    if (rendered) return rendered
  }

  return (
    <div className="bg-background min-h-screen">
      {/* ── HERO SECTION ── */}
      <PageHeader
        title={(tenant.settings as any)?.labels?.programs?.sectionTitle || "Program Unggulan"}
        description={(tenant.settings as any)?.labels?.programs?.sectionSubtitle || "Membangun keunggulan akademik melalui program yang terintegrasi dan inovatif."}
        breadcrumbs={buildDynamicBreadcrumbs(tenant.websiteMenus || [], "/program", (tenant.settings as any)?.labels?.programs?.sectionTitle || "Program Unggulan")}
      />

      {/* ── ACADEMIC PROGRAMS ── */}
      <section id="academic" className="py-12 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">


        {programs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {programs.map((prog: any, index: number) => (
              <div 
                key={prog.id} 
                className="group relative bg-white rounded-[2.5rem] overflow-hidden border border-border/60 hover:border-primary/40 transition-all duration-500 hover:shadow-2xl flex flex-col"
              >
                <div className="relative h-64 sm:h-72 w-full shrink-0 overflow-hidden">
                  <OptimizedImage 
                    src={prog.imageUrl || "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=2022"} 
                    alt={prog.name} 
                    fill 
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-all" />
                </div>
                <div className="p-8 md:p-10 flex-1 flex flex-col">
                  <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6">
                    <BookOpen className="h-6 w-6" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4 group-hover:text-primary transition-colors">{prog.name}</h3>
                  <p className="text-muted-foreground line-clamp-2">
                    {prog.description ? prog.description.replace(/<[^>]*>?/gm, '') : "Program pendidikan yang dirancang khusus untuk mengoptimalkan potensi intelektual dan keterampilan siswa secara komprehensif."}
                  </p>
                  <Link href={`${base}/program/${prog.slug || prog.id}`} className="flex items-center gap-2 text-primary font-bold text-sm">
                    Pelajari Selengkapnya <ArrowRight className="h-4 w-4 group-hover:translate-x-2 transition-transform" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-muted/20 rounded-3xl border border-dashed border-border">
             <h3 className="text-xl font-bold">Data Program Belum Tersedia</h3>
             <p className="text-muted-foreground mt-2">Daftar program akademik sedang dalam proses sinkronisasi.</p>
          </div>
        )}
      </section>


    </div>
  )
}
