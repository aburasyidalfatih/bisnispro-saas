import Link from "next/link"
import { ArrowRight, MapPin, Phone, Mail, MessageCircle, Image as ImageIcon } from "lucide-react"
import { HeroSlider } from "../../_components/hero-slider"
import { StatsBar } from "../../_components/stats-bar"
import { PrincipalWelcome } from "../../_components/principal-welcome"
import { InfoBoard } from "../../_components/info-board"
import { ProgramsSection } from "../../_components/programs-section"
import { AchievementsSection } from "../../_components/achievements-section"
import { FacilitiesSection } from "../../_components/facilities-section"
import { ExtracurricularsSection } from "../../_components/extracurriculars-section"
import { StaffHighlight } from "../../_components/staff-highlight"
import { AlumniTestimonials } from "../../_components/alumni-testimonials"
import { PartnershipsSection } from "../../_components/partnerships-section"
import { ScrollReveal } from "@/components/ui/scroll-reveal"
import { ThemeProps } from "../types"

export function ModernTheme({ tenant, base, gallery, stats }: ThemeProps) {
  return (
    <main className="bg-slate-50">
      {/* ── 1. Hero Slider (Same but wrapping might differ in future) ── */}
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
                  ctaSecondary: { href: `/profil`, label: "Tentang Kami" },
                },
              ]
        }
      />

      {/* ── 2. Sambutan Pimpinan (Moved up for modern corporate feel) ── */}
      <div className="-mt-10 relative z-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
            {((tenant.settings as any)?.principalName || (tenant.settings as any)?.principalMessage || tenant.staff?.some((s: any) => s.role && (s.role.toLowerCase().includes("kepala") || s.role.toLowerCase().includes("pimpinan") || s.role.toLowerCase().includes("direktur") || s.role.toLowerCase().includes("ketua")))) && (
              <PrincipalWelcome tenantName={tenant.name} settings={tenant.settings} staff={tenant.staff} />
            )}
            
            {/* Stats Bar integrated into the bottom of welcome */}
            <div className="bg-slate-900 text-white rounded-b-3xl">
              <StatsBar stats={stats} />
            </div>
          </div>
        </div>
      </div>

      <div className="py-12"></div>

      {/* ── 3. Program Keahlian ── */}
      <ScrollReveal>
        <ProgramsSection programs={tenant.programs || []} />
      </ScrollReveal>

      {/* ── 4. Fasilitas Sekolah (Moved up) ── */}
      <ScrollReveal delay={0.1}>
        <div className="bg-white py-10">
          <FacilitiesSection facilities={tenant.facilities || []} />
        </div>
      </ScrollReveal>

      {/* ── 5. Info Board (Agenda, Pengumuman, Artikel) ── */}
      <InfoBoard events={tenant.events || []} posts={tenant.posts || []} />

      {/* ── 6. Prestasi & Ekstrakurikuler ── */}
      <div className="bg-white py-12">
        <ScrollReveal delay={0.1}>
          <AchievementsSection achievements={tenant.achievements || []} />
        </ScrollReveal>
        <div className="my-10" />
        <ScrollReveal delay={0.2}>
          <ExtracurricularsSection extracurriculars={tenant.extracurriculars || []} />
        </ScrollReveal>
      </div>

      {/* ── 7. Guru & Staff Highlight ── */}
      <ScrollReveal delay={0.1}>
        <StaffHighlight staff={tenant.staff || []} />
      </ScrollReveal>

      {/* ── 8. Galeri ── */}
      {gallery.length > 0 && (
        <ScrollReveal>
        <section className="py-10 md:py-16 bg-slate-900 text-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-white/80 text-xs font-bold tracking-wider uppercase mb-4">
                <ImageIcon className="h-3.5 w-3.5" />
                Galeri
              </div>
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4">Dokumentasi Kami</h2>
              <p className="text-white/60 text-sm md:text-base max-w-xl mx-auto mb-6">
                Kumpulan momen dan kegiatan berharga yang telah kami abadikan.
              </p>
              <Link href={`${base}/gallery`} className="inline-flex items-center gap-2 text-sm font-semibold text-white hover:text-primary transition-colors">
                Lihat Semua <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            
            {/* Modern Masonry-like grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {gallery.slice(0, 8).map((item: any, i: number) => (
                <div key={i} className={`group relative rounded-2xl overflow-hidden ${i === 0 || i === 3 ? 'md:col-span-2 md:row-span-2' : ''} aspect-square`}>
                  <img src={item.url} alt={item.caption || `Galeri ${i + 1}`}
                    loading="lazy"
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  {item.caption && (
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity flex items-end">
                      <p className="text-white text-sm font-medium">{item.caption}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
        </ScrollReveal>
      )}

      {/* ── 9. Testimonial Alumni ── */}
      <ScrollReveal>
        <AlumniTestimonials alumni={tenant.alumni || []} />
      </ScrollReveal>

      {/* ── 10. Kerjasama Lembaga ── */}
      <ScrollReveal delay={0.1}>
        <div className="bg-white py-8">
          <PartnershipsSection partnerships={tenant.partnerships || []} />
        </div>
      </ScrollReveal>

      {/* ── 11. Kontak CTA (Modern Layout) ── */}
      {(tenant.phone || tenant.email || tenant.whatsapp || tenant.address) && (
        <ScrollReveal delay={0.2}>
        <section className="py-16 md:py-24 bg-background">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="rounded-3xl border border-slate-200 bg-white shadow-2xl p-8 md:p-16 relative overflow-hidden">
              <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-primary/5 blur-3xl" />
              <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 rounded-full bg-blue-500/5 blur-3xl" />
              
              <div className="relative text-center max-w-2xl mx-auto">
                <h2 className="text-3xl md:text-4xl font-extrabold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600">
                  Siap Bergabung Bersama Kami?
                </h2>
                <p className="text-slate-500 mb-10">
                  Kami selalu terbuka untuk menjawab pertanyaan Anda. Jangan ragu untuk menghubungi layanan informasi kami.
                </p>
                
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
                  {tenant.whatsapp && (
                    <a href={`https://wa.me/${tenant.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener"
                       className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#25D366] px-8 py-4 text-sm font-bold text-white shadow-lg shadow-[#25D366]/20 hover:bg-[#20bd5a] transition-all hover:-translate-y-1">
                      <MessageCircle className="h-5 w-5" />
                      Chat via WhatsApp
                    </a>
                  )}
                  <Link href={`${base}/contact`}
                    className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl bg-primary text-white px-8 py-4 text-sm font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all hover:-translate-y-1">
                    Halaman Kontak <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8 border-t border-slate-100">
                  {tenant.phone && (
                    <div className="flex flex-col items-center">
                      <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-3">
                        <Phone className="h-4 w-4" />
                      </div>
                      <span className="text-sm font-medium text-slate-700">{tenant.phone}</span>
                    </div>
                  )}
                  {tenant.email && (
                    <div className="flex flex-col items-center">
                      <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-3">
                        <Mail className="h-4 w-4" />
                      </div>
                      <span className="text-sm font-medium text-slate-700">{tenant.email}</span>
                    </div>
                  )}
                  {tenant.address && (
                    <div className="flex flex-col items-center">
                      <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-3">
                        <MapPin className="h-4 w-4" />
                      </div>
                      <span className="text-sm font-medium text-slate-700 text-center line-clamp-2">{tenant.address}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
        </ScrollReveal>
      )}
    </main>
  )
}
