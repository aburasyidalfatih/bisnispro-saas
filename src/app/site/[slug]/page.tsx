import { db } from "@/lib/db"
import { notFound } from "next/navigation"

export const dynamic = "force-dynamic"
import Link from "next/link"
import { ArrowRight, MapPin, Phone, Mail, MessageCircle, Calendar, Users, BookOpen, Award, Clock } from "lucide-react"
import { HeroSlider } from "./_components/hero-slider"
import { StatsBar } from "./_components/stats-bar"
import { getPublicTenantBySlug } from "@/lib/services/tenant-public"
import { format } from "date-fns"
import { id as idLocale } from "date-fns/locale"
import { PrincipalWelcome } from "./_components/principal-welcome"
import { InfoBoard } from "./_components/info-board"

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

  const services = Array.isArray(tenant.services) ? tenant.services : []
  const rawGallery = Array.isArray(tenant.gallery) ? tenant.gallery : []
  const gallery = rawGallery.map((item: any) =>
    typeof item === "string" ? { url: item, caption: "" } : item
  )
  const base = `/site/${slug}`

  // Build stats from tenant data
  const staffCount = tenant.staff?.length || 0
  const programCount = tenant.programs?.length || 0
  const stats = [
    { value: staffCount > 0 ? `${staffCount}+` : "20+", label: "Tenaga Pendidik", icon: "users" },
    { value: programCount > 0 ? `${programCount}` : "6+", label: "Program Keahlian", icon: "book" },
    { value: tenant.achievements?.length ? `${tenant.achievements.length}+` : "50+", label: "Prestasi Diraih", icon: "award" },
    { value: "15+", label: "Tahun Berdiri", icon: "clock" },
  ]

  // Get latest posts for "Berita Terbaru" section
  const posts = (tenant.posts || []).slice(0, 3)

  return (
    <main>
      {/* ── Hero ── */}
      <HeroSlider
        base={base}
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

      {/* ── Stats Bar ── */}
      <StatsBar stats={stats} />

      {/* ── Sambutan Kepala Sekolah ── */}
      {((tenant.settings as any)?.principalName || (tenant.settings as any)?.principalMessage) && (
        <PrincipalWelcome tenantName={tenant.name} settings={tenant.settings} />
      )}

      {/* ── Info Board (Agenda, Pengumuman, Artikel) ── */}
      <InfoBoard events={tenant.events || []} posts={tenant.posts || []} base={base} />

      {/* ── Tentang Singkat ── */}
      {tenant.about && (
        <section className="py-16 bg-background">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <span className="inline-block px-3 py-1 mb-4 rounded-full bg-secondary text-secondary-foreground text-xs font-bold tracking-wider uppercase">
                  Tentang Kami
                </span>
                <h2 className="text-3xl font-bold mb-4">{tenant.name}</h2>
                <p className="text-muted-foreground leading-relaxed line-clamp-6">{tenant.about}</p>
                <Link href={`${base}/about`}
                  className="inline-flex items-center gap-2 mt-6 text-sm font-semibold text-primary hover:underline">
                  Selengkapnya <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="rounded-2xl overflow-hidden aspect-video bg-secondary/30 flex items-center justify-center border border-border/50 shadow-sm">
                {tenant.heroImage ? (
                  <img src={tenant.heroImage} alt={tenant.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center p-8">
                    {tenant.logo
                      ? <img src={tenant.logo} alt={tenant.name} className="h-24 w-24 object-contain mx-auto mb-4" />
                      : <div className="text-6xl mb-4">🏢</div>
                    }
                    <p className="text-muted-foreground text-sm">{tenant.name}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── Layanan ── */}
      {services.length > 0 && (
        <section className="py-16 bg-secondary/10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <span className="inline-block px-3 py-1 mb-4 rounded-full bg-accent text-accent-foreground text-xs font-bold tracking-wider uppercase">
                Layanan
              </span>
              <h2 className="text-3xl font-bold">Layanan Kami</h2>
              <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
                Kami menyediakan berbagai layanan profesional untuk memenuhi kebutuhan Anda.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.slice(0, 6).map((svc: any, i: number) => (
                <div key={i} className="group rounded-2xl border bg-background p-6 hover:shadow-md hover:-translate-y-1 transition-all duration-300">
                  <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-primary/10 text-primary mb-5 shadow-sm">
                    <span className="text-2xl">{svc.icon || "⚡"}</span>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{svc.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{svc.description}</p>
                </div>
              ))}
            </div>
            {services.length > 6 && (
              <div className="text-center mt-8">
                <Link href={`${base}/services`}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border hover:bg-muted transition-colors text-sm font-medium">
                  Lihat Semua Layanan <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── Galeri ── */}
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
                <div key={i} className="group relative aspect-square rounded-2xl overflow-hidden border">
                  <img src={item.url} alt={item.caption || `Foto ${i + 1}`}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  {item.caption && (
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-white text-xs line-clamp-1">{item.caption}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Berita Terbaru ── */}
      {posts.length > 0 && (
        <section className="py-16 bg-background">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <span className="inline-block px-3 py-1 mb-3 rounded-full bg-accent text-accent-foreground text-xs font-bold tracking-wider uppercase">
                  Berita
                </span>
                <h2 className="text-2xl font-bold">Berita & Artikel Terbaru</h2>
              </div>
              <Link href={`${base}/berita`}
                className="text-sm font-medium text-primary hover:underline flex items-center gap-1">
                Lihat Semua <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {posts.map((post: any) => (
                <Link
                  key={post.id}
                  href={`${base}/berita/${post.id}`}
                  className="group flex flex-col bg-background rounded-2xl overflow-hidden border hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="aspect-[16/10] relative overflow-hidden bg-muted">
                    {post.image ? (
                      <img src={post.image} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="flex items-center justify-center h-full bg-primary/5">
                        <Calendar className="h-8 w-8 text-primary/20" />
                      </div>
                    )}
                  </div>
                  <div className="p-5 flex-1 flex flex-col">
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground mb-2">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(post.createdAt), 'dd MMM yyyy', { locale: idLocale })}
                    </div>
                    <h3 className="text-base font-bold mb-2 line-clamp-2 leading-snug group-hover:text-primary transition-colors">{post.title}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed flex-1">
                      {post.excerpt || post.content?.replace(/<[^>]*>/g, '').substring(0, 120) + "..."}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Kontak CTA ── */}
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
