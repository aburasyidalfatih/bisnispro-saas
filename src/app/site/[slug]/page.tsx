import { notFound } from "next/navigation"

export const dynamicParams = true
import Link from "next/link"
import { ArrowRight, MapPin, Phone, Mail, MessageCircle, Image as ImageIcon } from "lucide-react"
import { HeroSlider } from "./_components/hero-slider"
import { StatsBar } from "./_components/stats-bar"
import { getPublicTenantBySlug } from "@/lib/services/tenant-public"
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

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const tenant = await getPublicTenantBySlug(slug)
  if (!tenant) return {}
  const title = tenant.seoTitle || tenant.name
  const description = tenant.seoDesc || tenant.description || tenant.tagline || `Website resmi ${tenant.name}`

  return {
    title,
    description,
    manifest: `/api/tenant/manifest?slug=${slug}`,
    alternates: {
      canonical: "/",
    }
  }
}

export default async function SitePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const tenant = await getPublicTenantBySlug(slug)

  if (!tenant) notFound()

  const base = await getPublicBasePath(slug)

  const rawGallery = Array.isArray(tenant.gallery) ? tenant.gallery : []
  const gallery = rawGallery.map((item: any) =>
    typeof item === "string" ? { url: item, caption: "" } : item
  )

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
    { value: programCount > 0 ? `${programCount}` : "0", label: "Program Keahlian", icon: "book" },
    { value: achievementCount > 0 ? `${achievementCount}+` : "0", label: "Prestasi Diraih", icon: "award" },
    { value: `${establishedYear}`, label: "Tahun Berdiri", icon: "clock" },
  ]

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
                  cta: { href: `/contact`, label: "Hubungi Kami" },
                  ctaSecondary: { href: `/profil`, label: "Tentang Kami" },
                },
              ]
        }
      />

      {/* ── 2. Stats Bar ── */}
      <StatsBar stats={stats} />

      {/* ── 3. Sambutan Kepala Sekolah ── */}
      {((tenant.settings as any)?.principalName || (tenant.settings as any)?.principalMessage || tenant.staff?.some((s: any) => s.role && s.role.toLowerCase().includes("kepala sekolah"))) && (
        <PrincipalWelcome tenantName={tenant.name} settings={tenant.settings} staff={tenant.staff} />
      )}

      {/* ── 4. Info Board (Agenda, Pengumuman, Artikel) ── */}
      <InfoBoard events={tenant.events || []} posts={tenant.posts || []} />



      {/* ── 6. Program Keahlian ── */}
      <ScrollReveal>
        <ProgramsSection programs={tenant.programs || []} />
      </ScrollReveal>

      {/* ── 7. Prestasi ── */}
      <ScrollReveal delay={0.1}>
        <AchievementsSection achievements={tenant.achievements || []} />
      </ScrollReveal>

      {/* ── 8. Fasilitas Sekolah ── */}
      <ScrollReveal delay={0.1}>
        <FacilitiesSection facilities={tenant.facilities || []} />
      </ScrollReveal>

      {/* ── 9. Ekstrakurikuler ── */}
      <ScrollReveal delay={0.2}>
        <ExtracurricularsSection extracurriculars={tenant.extracurriculars || []} />
      </ScrollReveal>

      {/* ── 10. Guru & Staff Highlight ── */}
      <ScrollReveal delay={0.1}>
        <StaffHighlight staff={tenant.staff || []} />
      </ScrollReveal>

      {/* ── 11. Galeri ── */}
      {gallery.length > 0 && (
        <ScrollReveal>
        <section className="py-10 md:py-16 bg-background">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-12">
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-500/10 text-slate-600 text-xs font-bold tracking-wider uppercase mb-4">
                  <ImageIcon className="h-3.5 w-3.5" />
                  Galeri
                </div>
                <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2 bg-clip-text text-transparent bg-gradient-to-r from-foreground to-primary">Dokumentasi Kami</h2>
                <p className="text-muted-foreground text-sm md:text-base max-w-xl">
                  Kumpulan momen dan kegiatan berharga yang telah kami abadikan.
                </p>
              </div>
              <Link href={`${base}/gallery`} className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline whitespace-nowrap">
                Lihat Semua <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {gallery.slice(0, 8).map((item: any, i: number) => (
                <Link key={i} href={`${base}/gallery`} className="group relative aspect-square rounded-2xl overflow-hidden border">
                  <img src={item.url} alt={item.caption || `Dokumentasi Galeri ${i + 1} - ${tenant.name}`}
                    loading="lazy"
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  {item.caption && (
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-white text-xs line-clamp-1">{item.caption}</p>
                    </div>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </section>
        </ScrollReveal>
      )}

      {/* ── 12. Testimonial Alumni ── */}
      <ScrollReveal>
        <AlumniTestimonials alumni={tenant.alumni || []} />
      </ScrollReveal>

      {/* ── 12.5. Kerjasama Lembaga ── */}
      <ScrollReveal delay={0.1}>
        <PartnershipsSection partnerships={tenant.partnerships || []} />
      </ScrollReveal>

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
                  <h2 className="text-2xl font-bold mb-2">Hubungi Kami</h2>
                  <p className="text-white/80 text-sm mb-6">Kami siap membantu Anda. Jangan ragu untuk menghubungi kami.</p>
                  <div className="space-y-3">
                    {tenant.phone && (
                      <a href={`tel:${tenant.phone}`} className="flex items-center gap-3 text-white/90 hover:text-white text-sm">
                        <Phone className="h-4 w-4 shrink-0" /> {tenant.phone}
                      </a>
                    )}
                    {tenant.email && (
                      <a href={`mailto:${tenant.email}`} className="flex items-center gap-3 text-white/90 hover:text-white text-sm">
                        <Mail className="h-4 w-4 shrink-0" /> {tenant.email}
                      </a>
                    )}
                    {tenant.address && (
                      <div className="flex items-start gap-3 text-white/90 text-sm">
                        <MapPin className="h-4 w-4 shrink-0 mt-0.5" /> {tenant.address}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link href={`${base}/contact`}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white text-primary font-semibold text-sm hover:bg-white/90 transition-colors">
                    Kirim Pesan <ArrowRight className="h-4 w-4" />
                  </Link>
                  {tenant.whatsapp && (
                    <a href={`https://wa.me/${tenant.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener"
                      className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border-2 border-white/40 text-white font-semibold text-sm hover:bg-white/10 transition-colors">
                      <MessageCircle className="h-4 w-4" /> WhatsApp
                    </a>
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
