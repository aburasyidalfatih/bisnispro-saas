import { headers } from "next/headers"
import { notFound } from "next/navigation"




import Link from "next/link"
import { ArrowRight, MapPin, Phone, Mail, MessageCircle, Image as ImageIcon } from "lucide-react"
import parse from "html-react-parser"
import { renderCustomTheme } from "./_themes/custom-renderer"
import { HeroSlider } from "./_components/hero-slider"
import { StatsBar } from "./_components/stats-bar"
import { getTenantHomeData, getTenantLayoutData } from "@/features/tenant/services/tenant-modular.service"
import { getPublicBasePath } from "@/lib/utils/public-path"
import { PrincipalWelcome } from "./_components/principal-welcome"
import { InfoBoard } from "./_components/info-board"
import { ProgramsSection } from "./_components/programs-section"
import { AchievementsSection } from "./_components/achievements-section"

import { FacilitiesSection } from "./_components/facilities-section"
import { ExtracurricularsSection } from "./_components/extracurriculars-section"
import { StaffHighlight } from "./_components/staff-highlight"
import { AlumniTestimonials } from "./_components/alumni-testimonials"
import { PartnershipsSection } from "./_components/partnerships-section"
import { ScrollReveal } from "@/components/ui/scroll-reveal"
import { DefaultTheme } from "./_themes/default"

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const headerList = await headers();
  const rootDomain = headerList.get('x-root-domain') || process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'schoolpro.id';
  const { slug } = await params
  const tenant = await getTenantLayoutData(slug)
  if (!tenant) return {}
  const title = tenant.seoTitle || tenant.name
  const description = tenant.seoDesc || tenant.description || tenant.tagline || `Website resmi ${tenant.name}`

  let imageUrl = tenant.logo || "https://schoolpro.id/default-og.jpg"
  if (imageUrl.startsWith("/")) {
    const domain = tenant.domain ? `https://${tenant.domain}` : `https://${tenant.slug}.${rootDomain}`
    imageUrl = `${domain}${imageUrl}`
  }

  return {
    title,
    description,
    manifest: `/api/tenant/manifest?slug=${slug}`,
    alternates: {
      canonical: "/",
    },
    openGraph: {
      title,
      description,
      url: `https://${tenant.domain || tenant.slug + '.' + rootDomain}`,
      siteName: tenant.name,
      images: [{ url: imageUrl, width: 1200, height: 630 }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
  }
}

export default async function SitePage({ params }: { params: Promise<{ slug: string }> }) {
  const headerList = await headers();
  const rootDomain = headerList.get('x-root-domain') || process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'schoolpro.id';
  const { slug } = await params

  const tenant = await getTenantHomeData(slug)
  const tenantLayout = await getTenantLayoutData(slug)

  if (!tenant) notFound()

  const base = await getPublicBasePath(slug)

  const rawGallery = Array.isArray(tenant.gallery) ? tenant.gallery : []
  const gallery = rawGallery
    .map((item: any) => typeof item === "string" ? { url: item, caption: "" } : item)
    .filter((item: any) => item && typeof item === "object")

  // Build stats from tenant data
  const staffCount = tenant._count?.staff || tenant.staff?.length || 0
  const programCount = tenant._count?.programs || tenant.programs?.length || 0
  const achievementCount = tenant._count?.achievements || tenant.achievements?.length || 0

  let establishedYear = new Date().getFullYear()
  if ((tenant.settings as any)?.establishedYear) {
    establishedYear = parseInt((tenant.settings as any).establishedYear, 10)
  } else if (tenant.createdAt) {
    establishedYear = new Date(tenant.createdAt).getFullYear()
  }

  const stats = [
    { value: staffCount > 0 ? `${staffCount}+` : "0", label: "Tenaga Pendidik", icon: "users" },
    { value: programCount > 0 ? `${programCount}` : "0", label: "Program Unggulan", icon: "book" },
    { value: achievementCount > 0 ? `${achievementCount}+` : "0", label: "Prestasi Diraih", icon: "award" },
    { value: `${establishedYear}`, label: "Tahun Berdiri", icon: "clock" },
  ]
  const themeProps = { tenant, base, gallery, stats }

  // Jika sekolah menggunakan Custom Theme dari Super Admin
  if (tenant.customThemeId && tenant.customTheme) {
    const rendered = renderCustomTheme({
      templateHtml: tenant.customTheme.indexHtml,
      layoutHtml: tenant.customTheme.layoutHtml,
      customCss: tenant.customTheme.customCss,
      customJs: tenant.customTheme.customJs,
      context: { tenant, base, gallery, stats, settings: tenant.settings || {} },
    })
    if (rendered) return rendered
  }

  // Router Tema Bawaan React
  
  // SEO EducationalOrganization Schema
  const educationalOrgSchema = {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    "name": tenantLayout?.name || tenant.name,
    "url": `https://${tenantLayout?.domain || tenant.slug + '.' + rootDomain}`,
    "logo": tenantLayout?.logo || "https://schoolpro.id/logo-schoolpro.png",
    "description": tenantLayout?.description || tenantLayout?.tagline || `Website resmi ${tenant.name}`,
    "telephone": tenantLayout?.phone || undefined,
    "email": tenantLayout?.email || undefined,
    "address": tenantLayout?.address ? {
      "@type": "PostalAddress",
      "streetAddress": tenantLayout.address
    } : undefined,
    "sameAs": [
      tenantLayout?.facebook?.startsWith('http') ? tenantLayout.facebook : (tenantLayout?.facebook ? `https://${tenantLayout.facebook}` : undefined),
      tenantLayout?.instagram?.startsWith('http') ? tenantLayout.instagram : (tenantLayout?.instagram ? `https://${tenantLayout.instagram}` : undefined),
      tenantLayout?.youtube?.startsWith('http') ? tenantLayout.youtube : (tenantLayout?.youtube ? `https://${tenantLayout.youtube}` : undefined),
      tenantLayout?.tiktok?.startsWith('http') ? tenantLayout.tiktok : (tenantLayout?.tiktok ? `https://${tenantLayout.tiktok}` : undefined)
    ].filter(Boolean)
  };

  switch (tenant.template) {
    case "default":
    default:
      return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(educationalOrgSchema) }} /><DefaultTheme {...(themeProps as any)} /></>
  }
}
