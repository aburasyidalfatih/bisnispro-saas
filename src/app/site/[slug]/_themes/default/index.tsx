import Link from "next/link"
import NextImage from "next/image"
import { normalizeImageUrl } from "@/lib/utils"
import { ArrowRight, MapPin, Phone, Mail, MessageCircle, Image as ImageIcon, GraduationCap, Building, Award, TreePine, CheckCircle2 } from "lucide-react"
import dynamic from "next/dynamic"

const HeroSlider = dynamic(() => import("../../_components/hero-slider").then(mod => mod.HeroSlider), { ssr: true })
const StatsBar = dynamic(() => import("../../_components/stats-bar").then(mod => mod.StatsBar), { ssr: true })
import { PrincipalWelcome } from "../../_components/principal-welcome"
import { InfoBoard } from "../../_components/info-board"
import { ProgramsSection } from "../../_components/programs-section"
import { AchievementsSection } from "../../_components/achievements-section"
import { FacilitiesSection } from "../../_components/facilities-section"
import { ExtracurricularsSection } from "../../_components/extracurriculars-section"
import { StaffHighlight } from "../../_components/staff-highlight"
import { AlumniTestimonials } from "../../_components/alumni-testimonials"
import { PartnershipsSection } from "../../_components/partnerships-section"
import { FaqSection } from "../../_components/faq-section"
import { ScrollReveal } from "@/components/ui/scroll-reveal"
import { ThemeProps } from "../types"

export function DefaultTheme({ tenant, base, gallery, stats }: ThemeProps) {
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

  const alumni = (tenant.alumni || []).map((al) => ({
    id: al.id,
    name: al.name,
    graduationYear: al.graduationYear,
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

  const labels = (tenant.settings as any)?.labels || {}

  return (
    <main>
      {/* ── 1. Hero Slider ── */}
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
                  cta: { href: `/contact`, label: labels?.hero?.cta1 || "Hubungi Kami" },
                  ctaSecondary: { href: `/profil`, label: labels?.hero?.cta2 || "Tentang Kami" },
                },
              ]
        }
      />

      {/* ── 2. Stats Bar ── */}
      <StatsBar stats={stats} />

      {/* ── 3. Sambutan Pimpinan ── */}
      {((tenant.settings as any)?.principalName || (tenant.settings as any)?.principalMessage || tenant.staff?.some((s: any) => s.role && (s.role.toLowerCase().includes("kepala") || s.role.toLowerCase().includes("pimpinan") || s.role.toLowerCase().includes("direktur") || s.role.toLowerCase().includes("ketua")))) && (
        <PrincipalWelcome tenantName={tenant.name} settings={tenant.settings} staff={tenant.staff} />
      )}

      {/* ── 4. Info Board (Agenda, Pengumuman, Artikel) ── */}
      <InfoBoard events={tenant.events || []} posts={tenant.posts || []} basePath={base} />

      {/* ── 6. Program Keahlian ── */}
      <ScrollReveal>
        <ProgramsSection programs={tenant.programs || []} labels={labels} basePath={base} />
      </ScrollReveal>


      {/* ── 7. Prestasi ── */}
      <ScrollReveal delay={0.1}>
        <AchievementsSection achievements={achievements} labels={labels} basePath={base} />
      </ScrollReveal>

      {/* ── 8. Fasilitas Sekolah ── */}
      <ScrollReveal delay={0.1}>
        <FacilitiesSection facilities={tenant.facilities || []} labels={labels} basePath={base} />
      </ScrollReveal>

      {/* ── 9. Ekstrakurikuler ── */}
      <ScrollReveal delay={0.2}>
        <ExtracurricularsSection extracurriculars={tenant.extracurriculars || []} labels={labels} basePath={base} />
      </ScrollReveal>

      {/* ── 10. Guru & Staff Highlight ── */}
      <ScrollReveal delay={0.1}>
        <StaffHighlight staff={staff} labels={labels} basePath={base} />
      </ScrollReveal>

      {/* ── 11. Galeri ── */}
      {gallery.length > 0 && (
        <ScrollReveal>
        <section className="py-10 md:py-16 bg-background">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-12">
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-muted text-muted-foreground text-xs font-bold tracking-wider uppercase mb-4">
                  <ImageIcon className="h-3.5 w-3.5" />
                  {labels?.gallery?.sectionTitle || "Galeri"}
                </div>
                <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2 bg-clip-text text-transparent bg-gradient-to-r from-foreground to-primary">
                  {labels?.gallery?.sectionTitle || "Dokumentasi Kami"}
                </h2>
                <p className="text-muted-foreground text-sm md:text-base max-w-xl">
                  {labels?.gallery?.sectionSubtitle || "Kumpulan momen dan kegiatan berharga yang telah kami abadikan."}
                </p>
              </div>
              <Link href={`${base}/gallery`} className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline whitespace-nowrap">
                {labels?.gallery?.buttonText || "Lihat Semua"} <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {gallery.slice(0, 8).map((item: any, i: number) => {
                const isVideo = item.url?.includes("youtube.com") || item.url?.includes("youtu.be");
                const videoId = isVideo ? item.url?.split("v=")[1]?.split("&")[0] || item.url?.split("youtu.be/")[1]?.split("?")[0] : null;
                const thumbnailUrl = isVideo && videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : (normalizeImageUrl(item.url) || item.url);

                return (
                  <Link key={i} href={`${base}/gallery`} className="group relative aspect-square rounded-2xl overflow-hidden border">
                    <NextImage src={thumbnailUrl || '/placeholder.png'} alt={item.imageAlt || item.caption || `Dokumentasi Galeri ${i + 1} - ${tenant.name}`}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-300" />
                    {isVideo && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-black/50 flex items-center justify-center backdrop-blur-sm group-hover:bg-primary transition-colors">
                          <svg className="w-6 h-6 text-white translate-x-0.5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </div>
                      </div>
                    )}
                    {item.caption && (
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="text-white text-xs line-clamp-1">{item.caption}</p>
                      </div>
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        </section>
        </ScrollReveal>
      )}

      {/* ── 12. Testimonial Alumni ── */}
      <ScrollReveal>
        <AlumniTestimonials alumni={alumni} labels={labels} basePath={base} />
      </ScrollReveal>


      {/* ── 13. Kerjasama Lembaga ── */}
      <ScrollReveal delay={0.1}>
        <PartnershipsSection partnerships={partnerships} labels={labels} basePath={base} />
      </ScrollReveal>

      {/* ── 14. Tanya Jawab (FAQ) ── */}
      {tenant.faqs && tenant.faqs.length > 0 && (
        <FaqSection faqs={tenant.faqs} />
      )}

      {/* ── 13. Kontak CTA ── */}
      {(tenant.phone || tenant.email || tenant.whatsapp || tenant.address) && (
        <ScrollReveal delay={0.2}>
        <section className="py-10 md:py-16 bg-muted/30">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="rounded-3xl bg-primary p-8 md:p-12 text-white relative overflow-hidden">
              <div className="absolute inset-0 opacity-10"
                style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "20px 20px" }} />
              <div className="relative grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <h2 className="text-2xl font-bold mb-2">{labels?.contact?.sectionTitle || "Hubungi Kami"}</h2>
                  <p className="text-white/80 text-sm mb-6">{labels?.contact?.sectionSubtitle || "Kami siap membantu Anda. Jangan ragu untuk menghubungi kami."}</p>
                  <div className="space-y-3">
                    {tenant.phone && (
                      <div className="flex items-center gap-3">
                        <div className="bg-white/20 p-2 rounded-lg"><Phone className="h-4 w-4" /></div>
                        <span className="text-sm font-medium">{tenant.phone}</span>
                      </div>
                    )}
                    {tenant.email && (
                      <div className="flex items-center gap-3">
                        <div className="bg-white/20 p-2 rounded-lg"><Mail className="h-4 w-4" /></div>
                        <span className="text-sm font-medium">{tenant.email}</span>
                      </div>
                    )}
                    {tenant.address && (
                      <div className="flex items-center gap-3">
                        <div className="bg-white/20 p-2 rounded-lg"><MapPin className="h-4 w-4" /></div>
                        <span className="text-sm font-medium">{tenant.address}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex md:justify-end gap-3">
                  {tenant.whatsapp && (
                    <a href={`https://wa.me/${tenant.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener"
                       className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#25D366] px-6 py-3 text-sm font-bold text-white shadow-lg hover:bg-[#20bd5a] transition-all hover:scale-105 active:scale-95">
                      <MessageCircle className="h-5 w-5" />
                      {labels?.contact?.btnWa || "Chat WhatsApp"}
                    </a>
                  )}
                  <Link href={`${base}/contact`}
                    className="inline-flex items-center justify-center rounded-xl bg-white text-primary px-6 py-3 text-sm font-bold shadow-lg hover:bg-slate-50 transition-all hover:scale-105 active:scale-95">
                    {labels?.contact?.btnEmail || "Kirim Pesan"}
                  </Link>
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
