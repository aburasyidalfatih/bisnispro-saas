import Link from "next/link"
import NextImage from "next/image"
import { ArrowRight, MapPin, Phone, Mail, MessageCircle, Image as ImageIcon, GraduationCap, Building, Award, TreePine, ChevronLeft, ChevronRight, CheckCircle2 } from "lucide-react"
import { normalizeImageUrl } from "@/lib/utils"
import { HeroSlider } from "../../_components/hero-slider"
import { StatsBar } from "../../_components/stats-bar"
import { FounderWelcome } from "../../_components/founder-welcome"
import { LatestUpdates } from "../../_components/latest-updates"
import { ServicesSection } from "../../_components/services-section"
import { PortfolioSection } from "../../_components/portfolio-section"
import { OfficesSection } from "../../_components/offices-section"
import { TeamHighlight } from "../../_components/team-highlight"
import { ClientTestimonials } from "../../_components/client-testimonials"
import { PartnershipsSection } from "../../_components/partnerships-section"
import { FaqSection } from "../../_components/faq-section"
import { BusinessCta } from "../../_components/business-cta"
import { ExportCapability } from "../../_components/export-capability"
import { ScrollReveal } from "@/components/ui/scroll-reveal"
import { ThemeProps } from "../types"

export function ModernTheme({ tenant, base, gallery, stats }: ThemeProps) {
  const hasPrincipal = (tenant.settings as any)?.principalName 
    || (tenant.settings as any)?.principalMessage 
    || tenant.staff?.some((s: any) => s.role && (
      s.role.toLowerCase().includes("kepala") 
      || s.role.toLowerCase().includes("pimpinan") 
      || s.role.toLowerCase().includes("direktur") 
      || s.role.toLowerCase().includes("ketua")
    ))

  const achievements = (tenant.achievements || []).map((a) => ({
    id: a.id,
    title: a.title,
    description: a.description,
    date: a.createdAt,
    level: a.level || "LOKAL",
    imageUrl: a.imageUrl,
  }))

  const staff = (tenant.staff || []).map((s) => ({
    id: s.id,
    name: s.name,
    role: s.role || "Staff",
    imageUrl: s.imageUrl,
  }))

  const klien = (tenant.klien || []).map((al) => ({
    id: al.id,
    name: al.name,
    currentStatus: (al as any).currentStatus || al.currentPosition || "LAINNYA",
    testimonial: al.testimonial,
    imageUrl: al.imageUrl,
  }))

  const partnerships = (tenant.partnerships || []).map((p: any) => ({
    id: p.id,
    name: p.name,
    imageUrl: p.imageUrl || "",
    websiteUrl: p.websiteUrl,
  }))

  return (
    <main className="bg-muted/30">
      {/* ══════════════════════════════════════════════════════════════
          1. HERO SLIDER
      ══════════════════════════════════════════════════════════════ */}
      <HeroSlider
        slides={
          tenant.sliders && tenant.sliders.length > 0
            ? tenant.sliders.map((s: any) => ({
                subtitle: "",
                title: s.title || "",
                description: s.subtitle || "",
                image: s.imageUrl,
                cta: s.buttonText
                  ? { label: s.buttonText, href: s.buttonLink || "/contact" }
                  : s.buttonLink 
                    ? { href: s.buttonLink, label: "Selengkapnya" } 
                    : null,
              }))
            : [
                {
                  subtitle: tenant.name,
                  title: tenant.tagline || `Selamat Datang di\n${tenant.name}`,
                  description: tenant.description || "Kami berkomitmen memberikan layanan terbaik untuk Anda.",
                  cta: { href: `/contact`, label: "Hubungi Kami" },
                  ctaSecondary: { href: `/tentang`, label: "Tentang Kami" },
                },
              ]
        }
      />

      {/* ══════════════════════════════════════════════════════════════
          2. FLOATING STATS BAR
      ══════════════════════════════════════════════════════════════ */}
      <div className="-mt-8 relative z-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="bg-primary text-primary-foreground rounded-2xl shadow-xl overflow-hidden">
            <StatsBar stats={stats} />
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          3. SAMBUTAN PIMPINAN + INFO BOARD (Combined Row)
             Layout: [Sambutan | Agenda + Pengumuman + Berita]
      ══════════════════════════════════════════════════════════════ */}
      <section className="py-12 md:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-8 items-start">
            {/* Left: Sambutan Pimpinan (compact version) */}
            {hasPrincipal && (
              <div className="bg-card rounded-2xl border shadow-sm overflow-hidden">
                <FounderWelcome tenantName={tenant.name} settings={tenant.settings} staff={tenant.staff} />
              </div>
            )}

            {/* Right: Info Board (Agenda, Pengumuman, Berita stacked) */}
            <div className="space-y-0">
              <LatestUpdates events={tenant.events || []} posts={tenant.posts || []} basePath={base} />
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          4. LAYANAN UNGGULAN
      ══════════════════════════════════════════════════════════════ */}
      <ScrollReveal>
        <ServicesSection programs={tenant.programs || []} basePath={base} />
      </ScrollReveal>


      {/* ══════════════════════════════════════════════════════════════
          6. FASILITAS PERUSAHAAN
      ══════════════════════════════════════════════════════════════ */}
      {(tenant.facilities?.length ?? 0) > 0 && (
        <ScrollReveal delay={0.1}>
          <div className="bg-card py-10 mt-8">
            <OfficesSection facilities={tenant.facilities || []} basePath={base} />
          </div>
        </ScrollReveal>
      )}

      {/* ══════════════════════════════════════════════════════════════
          7. PORTOFOLIO TERPILIH
      ══════════════════════════════════════════════════════════════ */}
      {(tenant.achievements?.length ?? 0) > 0 && (
        <ScrollReveal delay={0.1}>
          <PortfolioSection achievements={achievements} basePath={base} />
        </ScrollReveal>
      )}

      {/* ══════════════════════════════════════════════════════════════
          8. LAYANAN
      ══════════════════════════════════════════════════════════════ */}
      {(tenant.extracurriculars?.length ?? 0) > 0 && (
        <ScrollReveal delay={0.2}>
          <div className="bg-card py-10">
            
          </div>
        </ScrollReveal>
      )}

      {/* ══════════════════════════════════════════════════════════════
          9. TIM & KARYAWAN
      ══════════════════════════════════════════════════════════════ */}
      {(tenant.staff?.length ?? 0) > 0 && (
        <ScrollReveal delay={0.1}>
          <TeamHighlight staff={staff} basePath={base} />
        </ScrollReveal>
      )}

      {/* ══════════════════════════════════════════════════════════════
          10. GALERI PERUSAHAAN (Horizontal Scroll)
      ══════════════════════════════════════════════════════════════ */}
      {gallery.length > 0 && (
        <ScrollReveal>
        <section className="py-10 md:py-16 bg-card">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-8">
              <div>
                <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-1">Galeri Perusahaan</h2>
                <p className="text-muted-foreground text-sm">Dokumentasi karya, aktivitas, dan perjalanan bisnis kami</p>
              </div>
              <Link href={`${base}/gallery`} className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline whitespace-nowrap">
                Lihat Semua <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            
            {/* Horizontal scrollable gallery */}
            <div className="relative group/gallery">
              <div className="flex gap-4 overflow-x-auto pb-4 scroll-smooth snap-x snap-mandatory scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                {gallery.slice(0, 12).map((item: any, i: number) => {
                  const isVideo = item.url?.includes("youtube.com") || item.url?.includes("youtu.be");
                  const videoId = isVideo ? item.url?.split("v=")[1]?.split("&")[0] || item.url?.split("youtu.be/")[1]?.split("?")[0] : null;
                  const thumbnailUrl = isVideo && videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : (normalizeImageUrl(item.url) || item.url);

                  return (
                    <div key={i} className="snap-start shrink-0 w-64 md:w-72 aspect-video relative rounded-2xl overflow-hidden group/item border shadow-sm bg-muted">
                      <NextImage src={thumbnailUrl || '/placeholder.svg'} alt={item.imageAlt || item.caption || `Galeri ${i + 1}`}
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        className="object-cover group-hover/item:scale-105 transition-transform duration-500" />
                      {isVideo && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-12 h-12 rounded-full bg-black/50 flex items-center justify-center backdrop-blur-sm group-hover/item:bg-primary transition-colors">
                            <svg className="w-6 h-6 text-white translate-x-0.5" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z" />
                            </svg>
                          </div>
                        </div>
                      )}
                      {item.caption && (
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent p-4 opacity-0 group-hover/item:opacity-100 transition-opacity flex items-end">
                          <p className="text-white text-sm font-medium">{item.caption}</p>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </section>
        </ScrollReveal>
      )}

      {/* ══════════════════════════════════════════════════════════════
          11. TESTIMONI MITRA
      ══════════════════════════════════════════════════════════════ */}
      {((tenant.klien?.length ?? 0) > 0) && (
        <section className="py-10 md:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-8">
              {/* Klien Testimonial */}
              <div>
                <ClientTestimonials klien={klien} basePath={base} />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════════════
          12. KERJASAMA & DUKUNGAN
      ══════════════════════════════════════════════════════════════ */}
      {(tenant.partnerships?.length ?? 0) > 0 && (
        <ScrollReveal delay={0.1}>
          <div className="bg-card py-8">
            <PartnershipsSection partnerships={partnerships} basePath={base} />
          </div>
        </ScrollReveal>
      )}

      {/* ══════════════════════════════════════════════════════════════
          13. FAQ (Tanya Jawab)
      ══════════════════════════════════════════════════════════════ */}
      {tenant.faqs && tenant.faqs.length > 0 && (
        <FaqSection faqs={tenant.faqs} />
      )}

      <ExportCapability tenant={tenant} base={base} />

      {/* ══════════════════════════════════════════════════════════════
          14. KONTAK CTA FOOTER
      ══════════════════════════════════════════════════════════════ */}
      <ScrollReveal delay={0.2}>
        <BusinessCta tenant={tenant} base={base} />
      </ScrollReveal>
    </main>
  )
}
