import { notFound } from "next/navigation"

export const dynamic = "force-dynamic"
import Link from "next/link"
import { ArrowRight, MapPin, Phone, Mail, MessageCircle } from "lucide-react"
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

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const tenant = await getPublicTenantBySlug(slug)
  if (!tenant) return {}
  return {
    title: tenant.seoTitle || tenant.name,
    description: tenant.seoDesc || tenant.description || tenant.tagline || `Website ${tenant.name}`,
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
  const staffCount = tenant.staff?.length || 0
  const programCount = tenant.programs?.length || 0
  const stats = [
    { value: staffCount > 0 ? `${staffCount}+` : "20+", label: "Tenaga Pendidik", icon: "users" },
    { value: programCount > 0 ? `${programCount}` : "6+", label: "Program Keahlian", icon: "book" },
    { value: tenant.achievements?.length ? `${tenant.achievements.length}+` : "50+", label: "Prestasi Diraih", icon: "award" },
    { value: "15+", label: "Tahun Berdiri", icon: "clock" },
  ]

  return (
    <main>
      {/* ── 1. Hero Slider ── */}
      <HeroSlider
        slides={
          tenant.sliders && tenant.sliders.length > 0
            ? tenant.sliders.map((s: any) => ({
                subtitle: "",
                title: s.title || tenant.tagline || `Selamat Datang di\n${tenant.name}`,
                description: s.subtitle || "",
                image: s.imageUrl,
                cta: s.buttonText
                  ? { label: s.buttonText, href: s.buttonLink || "/contact" }
                  : { href: `/contact`, label: "Hubungi Kami" },
              }))
            : [
                {
                  subtitle: tenant.name,
                  title: tenant.tagline || `Selamat Datang di\n${tenant.name}`,
                  description: tenant.description || "Kami berkomitmen memberikan layanan terbaik untuk Anda.",
                  cta: { href: `/contact`, label: "Hubungi Kami" },
                  ctaSecondary: { href: `/about`, label: "Tentang Kami" },
                },
              ]
        }
      />

      {/* ── 2. Stats Bar ── */}
      <StatsBar stats={stats} />

      {/* ── 3. Sambutan Kepala Sekolah ── */}
      {((tenant.settings as any)?.principalName || (tenant.settings as any)?.principalMessage) && (
        <PrincipalWelcome tenantName={tenant.name} settings={tenant.settings} />
      )}

      {/* ── 4. Info Board (Agenda, Pengumuman, Artikel) ── */}
      <InfoBoard events={tenant.events || []} posts={tenant.posts || []} />



      {/* ── 6. Program Keahlian ── */}
      <ProgramsSection programs={tenant.programs || []} />

      {/* ── 7. Prestasi ── */}
      <AchievementsSection achievements={tenant.achievements || []} />

      {/* ── 8. Fasilitas Sekolah ── */}
      <FacilitiesSection facilities={tenant.facilities || []} />

      {/* ── 9. Ekstrakurikuler ── */}
      <ExtracurricularsSection extracurriculars={tenant.extracurriculars || []} />

      {/* ── 10. Guru & Staff Highlight ── */}
      <StaffHighlight staff={tenant.staff || []} />

      {/* ── 11. Galeri ── */}
      {gallery.length > 0 && (
        <section className="py-16 bg-background">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <span className="inline-block px-3 py-1 mb-3 rounded-full bg-secondary text-secondary-foreground text-xs font-bold tracking-wider uppercase">
                  Galeri
                </span>
                <h2 className="text-2xl font-bold">Dokumentasi Kami</h2>
              </div>
              <Link href={`${base}/gallery`}
                className="text-sm font-medium text-primary hover:underline flex items-center gap-1">
                Lihat Semua <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {gallery.slice(0, 8).map((item: any, i: number) => (
                <Link key={i} href={`${base}/gallery`} className="group relative aspect-square rounded-2xl overflow-hidden border">
                  <img src={item.url} alt={item.caption || `Foto ${i + 1}`}
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
      )}

      {/* ── 12. Testimonial Alumni ── */}
      <AlumniTestimonials alumni={tenant.alumni || []} />

      {/* ── 13. Kontak CTA ── */}
      {(tenant.phone || tenant.email || tenant.whatsapp || tenant.address) && (
        <section className="py-16 bg-muted/30">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="rounded-3xl bg-primary p-12 text-white relative overflow-hidden">
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
      )}
    </main>
  )
}
