import { db } from "@/lib/db"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Buat Website Sekolah Gratis & Platform Manajemen - SchoolPro",
  description: "Buat website sekolah gratis secara otomatis dan instan dengan SchoolPro. Platform terbaik untuk digitalisasi sekolah yang dilengkapi fitur PPDB Online dan sistem manajemen terpadu.",
}
import { FloatingWhatsApp } from "@/components/shared/floating-whatsapp"
import { SocialProofPopup } from "@/components/shared/social-proof-popup"
import { HeroSection } from "./_components/hero-section"
import { SchoolsMarquee } from "./_components/schools-marquee"
import { SolutionsSection } from "./_components/solutions-section"
import { FeaturesSection } from "./_components/features-section"
import { CtaSection } from "./_components/cta-section"
import { TestimonialsSection } from "./_components/testimonials-section"

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
    <div className="bg-background min-h-screen">
      <FloatingWhatsApp supportNumbers={supportWaNumbers} />
      <SocialProofPopup />
      
      <main>
        <HeroSection />
        
        <SchoolsMarquee activeTenants={activeTenants} totalTenants={totalTenants} />
        
        <SolutionsSection />
        
        <FeaturesSection />
        
        <TestimonialsSection testimonials={JSON.parse(JSON.stringify(testimonials))} />
        
        <CtaSection />
      </main>
    </div>
  )
}
