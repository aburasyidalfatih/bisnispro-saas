import { headers } from "next/headers"
import { notFound } from "next/navigation"
import { unstable_cache } from "next/cache"

import Link from "next/link"
import { ArrowRight, MapPin, Phone, Mail, MessageCircle, Image as ImageIcon } from "lucide-react"
import parse from "html-react-parser"
import { db } from "@/lib/db"
import { renderCustomTheme } from "./_themes/custom-renderer"
import { HeroSlider } from "./_components/hero-slider"
import { StatsBar } from "./_components/stats-bar"
import { getTenantHomeData, getTenantLayoutData } from "@/features/tenant/services/tenant-modular.service"
import { getPublicBasePath } from "@/lib/utils/public-path"
import { FounderWelcome } from "./_components/founder-welcome"
import dynamic from "next/dynamic"

const LatestUpdates = dynamic(() => import("./_components/latest-updates").then((mod) => mod.LatestUpdates))
const ServicesSection = dynamic(() => import("./_components/services-section").then((mod) => mod.ServicesSection))
const PortfolioSection = dynamic(() => import("./_components/portfolio-section").then((mod) => mod.PortfolioSection))
const OfficesSection = dynamic(() => import("./_components/offices-section").then((mod) => mod.OfficesSection))
const TeamHighlight = dynamic(() => import("./_components/team-highlight").then((mod) => mod.TeamHighlight))
const ClientTestimonials = dynamic(() => import("./_components/client-testimonials").then((mod) => mod.ClientTestimonials))
const PartnershipsSection = dynamic(() => import("./_components/partnerships-section").then((mod) => mod.PartnershipsSection))
import { ScrollReveal } from "@/components/ui/scroll-reveal"
import { DefaultTheme } from "./_themes/default"
import { ModernTheme } from "./_themes/modern"



export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const headerList = await headers();
  const rootDomain = headerList.get('x-root-domain') || process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'bisnispro.id';
  const { slug } = await params
  const tenant = await getTenantLayoutData(slug)
  if (!tenant) return {}
  const title = tenant.seoTitle || tenant.name
  const description = tenant.seoDesc || tenant.description || tenant.tagline || `Website resmi ${tenant.name}`

  let imageUrl = tenant.logo || "/logo-bisnispro.png"
  if (imageUrl.startsWith("/")) {
    const domain = tenant.domain ? `https://${tenant.domain}` : `https://${tenant.slug}.${rootDomain}`
    imageUrl = `${domain}${imageUrl}`
  }

  return {
    description,
    keywords: [tenant.name, tenant.slug, "Website Resmi", "Perusahaan", "Website Perusahaan", "Layanan Bisnis", "Portofolio", tenant.address || "Indonesia"].filter(Boolean),
    manifest: `/api/tenant/manifest?slug=${slug}`,
    alternates: {},
    openGraph: {
      description,
      url: `https://${tenant.domain || tenant.slug + '.' + rootDomain}`,
      siteName: tenant.name,
      images: [{ url: imageUrl, width: 1200, height: 630 }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      description,
      images: [imageUrl],
    },
  }
}

export default async function SitePage({ params }: { params: Promise<{ slug: string }> }) {
  const headerList = await headers();
  const rootDomain = headerList.get('x-root-domain') || process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'bisnispro.id';
  const { slug } = await params

  const [tenant, tenantLayout] = await Promise.all([
    getTenantHomeData(slug),
    getTenantLayoutData(slug)
  ])

  if (!tenant) notFound()

  const base = await getPublicBasePath(slug)
  const tenantForRender = tenantLayout ? { ...tenant, ...tenantLayout } : tenant

  const rawGallery = Array.isArray(tenantForRender.gallery) ? tenantForRender.gallery : []
  const gallery = rawGallery
    .map((item: any) => typeof item === "string" ? { url: item, caption: "" } : item)
    .filter((item: any) => item && typeof item === "object")

  const t = tenantForRender as any
  // Build stats from tenant data
  const staffCount = t._count?.staff || t.staff?.length || 0
  const programCount = t._count?.programs || t.programs?.length || 0
  const achievementCount = t._count?.achievements || t.achievements?.length || 0

  let establishedYear = new Date().getFullYear()
  if ((tenantForRender.settings as any)?.establishedYear) {
    establishedYear = parseInt((tenantForRender.settings as any).establishedYear, 10)
  } else if (tenantForRender.createdAt) {
    establishedYear = new Date(tenantForRender.createdAt).getFullYear()
  }

  let stats = []
  if (t.settings?.customStats && Array.isArray(t.settings.customStats) && t.settings.customStats.length > 0) {
    stats = t.settings.customStats
  } else {
    // Calculate real stats from database based on user requirements
    const getCachedStats = unstable_cache(
      async (tenantId: string) => {
        const klien = await db.portfolio.count({ where: { tenantId } })
        const staf = await db.testimonial.count({ where: { tenantId } })
        const services = await db.service.count({ where: { tenantId } })
        const total = await db.teamMember.count({ where: { tenantId } })
        return { klien, staf, services, total }
      },
      [`tenant-stats-${tenantForRender.id}`],
      { tags: [`tenant-${tenantForRender.slug}`, `tenant-${tenantForRender.slug}-stats`], revalidate: 3600 }
    )

    const cachedCounts = await getCachedStats(tenantForRender.id)
    const klienAchievementsCount = cachedCounts.klien
    const stafAchievementsCount = cachedCounts.staf
    const servicesCount = cachedCounts.services
    const totalStaffCount = cachedCounts.total
    const yearsExperience = new Date().getFullYear() - establishedYear

    stats = [
      { value: klienAchievementsCount > 0 ? `${klienAchievementsCount}+` : "0", label: "Proyek Selesai", icon: "CheckCircle" },
      { value: stafAchievementsCount > 0 ? `${stafAchievementsCount}+` : "0", label: "Klien Puas", icon: "Smile" },
      { value: yearsExperience > 0 ? `${yearsExperience}` : "1", label: "Tahun Pengalaman", icon: "Calendar" },
      { value: totalStaffCount > 0 ? `${totalStaffCount}` : "0", label: "Tim Profesional", icon: "Users" },
    ]
  }
  const themeProps = { tenant: tenantForRender, base, gallery, stats }

  // Jika perusahaan menggunakan Custom Theme dari Super Admin
  if (tenantForRender.customThemeId && t.customTheme) {
    const rendered = renderCustomTheme({
      templateHtml: t.customTheme.indexHtml,
      layoutHtml: t.customTheme.layoutHtml,
      customCss: t.customTheme.customCss,
      customJs: t.customTheme.customJs,
      context: { tenant: tenantForRender, base, gallery, stats, settings: tenantForRender.settings || {} },
    })
    if (rendered) return rendered
  }

  // Router Tema Bawaan React
  // JSON-LD LocalBusiness Schema moved to layout.tsx to avoid duplication

  switch (tenantForRender.template) {
    case "modern":
      return <ModernTheme {...(themeProps as any)} />
    case "default":
    default:
      return <DefaultTheme {...(themeProps as any)} />
  }
}
