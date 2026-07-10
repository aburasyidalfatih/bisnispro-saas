import { db } from "@/lib/db"
import { FloatingWhatsApp } from "@/components/shared/floating-whatsapp"
import { SocialProofPopup } from "@/components/shared/social-proof-popup"
import { LandingNavbar } from "./_components/landing-navbar"
import { HeroSection } from "./_components/hero-section"
import { SchoolsMarquee } from "./_components/schools-marquee"
import { SolutionsSection } from "./_components/solutions-section"
import { FeaturesSection } from "./_components/features-section"
import { CtaSection } from "./_components/cta-section"
import { TestimonialsSection } from "./_components/testimonials-section"
import { LandingFooter } from "./_components/landing-footer"

export const revalidate = 60; // Cache halaman selama 60 detik agar tidak membebani database setiap kali di-refresh

export default async function LandingPage() {
  const settings = await db.platformSetting.findMany({
    where: { key: { in: ["app_logo", "platform_name", "platform_tagline", "SUPPORT_WA_NUMBERS"] } },
  })

  let appLogo = "/logo-schoolpro.png"
  let platformName = "SchoolPro"
  let platformTagline = "Solusi Manajemen Sekolah Digital"
  let supportWaNumbers: any[] = []

  settings.forEach((s) => {
    if (s.key === "app_logo" && s.value) appLogo = s.value
    if (s.key === "platform_name" && s.value) platformName = s.value
    if (s.key === "platform_tagline" && s.value) platformTagline = s.value
    if (s.key === "SUPPORT_WA_NUMBERS" && s.value) {
      try {
        supportWaNumbers = JSON.parse(s.value)
      } catch {}
    }
  })

  const activeTenants = await db.tenant.findMany({
    where: { isActive: true },
    select: { id: true, name: true, address: true, logo: true },
    orderBy: { createdAt: "desc" },
    take: 20, // Batasi untuk mencegah browser crash & memory leak
  })

  const totalTenants = await db.tenant.count({
    where: { isActive: true }
  })

  const testimonials = await db.systemFeedback.findMany({
    where: { 
      type: "TESTIMONIAL", 
      status: "RESOLVED",
      tenantId: { not: null }
    },
    include: {
      tenant: { select: { name: true, logo: true, slug: true, domain: true } },
      user: { 
        select: { 
          name: true, 
          tenants: { select: { role: true }, take: 1 } 
        } 
      }
    },
    orderBy: { createdAt: "desc" },
    take: 9
  })

  return (
    <div className="min-h-screen bg-mesh">
      <FloatingWhatsApp supportNumbers={supportWaNumbers} />
      <SocialProofPopup />
      
      <LandingNavbar appLogo={appLogo} platformName={platformName} />
      
      <HeroSection />
      
      <SchoolsMarquee activeTenants={activeTenants} totalTenants={totalTenants} />
      
      <SolutionsSection />
      
      <FeaturesSection />
      
      <TestimonialsSection testimonials={JSON.parse(JSON.stringify(testimonials))} />
      
      <CtaSection />
      
      <LandingFooter platformName={platformName} />
    </div>
  )
}
