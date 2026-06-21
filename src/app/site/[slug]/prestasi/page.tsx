import { PageHeader } from "@/app/site/[slug]/_components/page-header"
import { notFound } from "next/navigation"
import { Trophy, Calendar, Medal, Award, Star } from "lucide-react"
import { getTenantLayoutData, getTenantAchievements } from "@/features/tenant/services/tenant-modular.service"
import { OptimizedImage } from "@/components/ui/optimized-image"
import { cn } from "@/lib/utils"
import { id } from "date-fns/locale"
import Link from "next/link"
import { getPublicBasePath } from "@/lib/utils/public-path"
import { renderCustomTheme } from "@/app/site/[slug]/_themes/custom-renderer"
import { PrestasiList } from "./prestasi-list"


export default async function PrestasiPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const tenant = await getTenantLayoutData(slug)
  
  if (!tenant) notFound()

  const achievementsData = await getTenantAchievements(slug)
  const achievements = achievementsData?.achievements || []
  const base = await getPublicBasePath(slug)

  // Custom Theme rendering
  if (tenant.customThemeId && tenant.customTheme?.achievementHtml) {
    const rendered = renderCustomTheme({
      templateHtml: tenant.customTheme.achievementHtml,
      layoutHtml: tenant.customTheme.layoutHtml,
      customCss: tenant.customTheme.customCss,
      customJs: tenant.customTheme.customJs,
      context: { tenant: { ...tenant, achievements }, base, settings: tenant.settings || {} },
    })
    if (rendered) return rendered
  }

  return (
    <div className="bg-background min-h-screen">
      {/* ── HERO SECTION ── */}
      <PageHeader
        title={(tenant.settings as any)?.labels?.achievements?.sectionTitle || "Prestasi & Penghargaan"}
        description={(tenant.settings as any)?.labels?.achievements?.sectionSubtitle || "Membanggakan dan Inspiratif. Catatan perjalanan siswa dan institusi dalam meraih keunggulan di berbagai bidang."}
        breadcrumbs={[
          { label: "Galeri & Alumni" },
          { label: "School Hall of Fame" }
        ]}
      />

      {/* ── MAIN CONTENT ── */}
      <section className="py-20 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <PrestasiList achievements={achievements} base={base} />
      </section>

      {/* ── MOTIVATIONAL FOOTER ── */}
      <section className="py-24 bg-dark text-white relative overflow-hidden bg-slate-900">
         <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20" />
         <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
            <QuoteIcon className="h-12 w-12 text-primary mx-auto mb-8 opacity-50" />
            <h2 className="text-3xl md:text-4xl font-extrabold italic leading-tight mb-8">
               "Prestasi bukanlah akhir, melainkan awal dari tanggung jawab yang lebih besar untuk terus berkarya."
            </h2>
            <div className="h-1 w-20 bg-primary mx-auto mb-8" />
            <p className="text-primary font-black uppercase tracking-[0.3em] text-sm">Visi Unggul SchoolPro</p>
         </div>
      </section>
    </div>
  )
}

function QuoteIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="currentColor"
        >
            <path d="M14.017 21L14.017 18C14.017 16.8954 14.9124 16 16.017 16H19.017C19.5693 16 20.017 15.5523 20.017 15V9C20.017 8.44772 19.5693 8 19.017 8H16.017C14.9124 8 14.017 7.10457 14.017 6V3L22.017 3V15C22.017 18.3137 19.3307 21 16.017 21H14.017ZM3.01693 21L3.01693 18C3.01693 16.8954 3.91236 16 5.01693 16H8.01693C8.56921 16 9.01693 15.5523 9.01693 15V9C9.01693 8.44772 8.56921 8 8.01693 8H5.01693C3.91236 8 3.01693 7.10457 3.01693 6V3L11.0169 3V15C11.0169 18.3137 8.33066 21 5.01693 21H3.01693Z" />
        </svg>
    )
}
