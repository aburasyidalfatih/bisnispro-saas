import { PageHeader } from "@/app/site/[slug]/_components/page-header"
import { notFound } from "next/navigation"
import { MapPin, Phone, Mail, MessageCircle } from "lucide-react"
import { ContactForm } from "./contact-form"
import { getTenantLayoutData } from "@/features/tenant/services/tenant-modular.service"
import { getPublicBasePath } from "@/lib/utils/public-path"
import { formatSocialUrl } from "@/lib/utils"
import { renderCustomTheme } from "@/app/site/[slug]/_themes/custom-renderer"
import { buildDynamicBreadcrumbs } from "@/lib/utils/breadcrumbs"


export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const tenant = await getTenantLayoutData(slug)
  if (!tenant) return {}
  return {
    title: `Kontak | ${tenant.seoTitle || tenant.name}`,
    description: tenant.seoDesc || tenant.description || `Hubungi ${tenant.name}`,
  }
}

export default async function ContactPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const tenant = await getTenantLayoutData(slug)
  if (!tenant) notFound()

  const base = await getPublicBasePath(slug)

  // Custom Theme rendering
  if (tenant.customThemeId && tenant.customTheme?.contactHtml) {
    const rendered = renderCustomTheme({
      templateHtml: tenant.customTheme.contactHtml,
      layoutHtml: tenant.customTheme.layoutHtml,
      customCss: tenant.customTheme.customCss,
      customJs: tenant.customTheme.customJs,
      context: { tenant, base, settings: tenant.settings || {} },
    })
    if (rendered) return rendered
  }

  const hasContact = tenant.address || tenant.phone || tenant.email || tenant.whatsapp

  // Server-side map resolving
  let finalEmbedUrl = `https://maps.google.com/maps?q=${encodeURIComponent((tenant.name || "") + " " + (tenant.address || ""))}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
  const mapUrl = (tenant.settings as any)?.mapUrl;

  if (mapUrl) {
    if (mapUrl.includes("<iframe") && mapUrl.includes("src=")) {
      const match = mapUrl.match(/src="([^"]+)"/);
      if (match && match[1]) finalEmbedUrl = match[1];
    } else if (mapUrl.includes("/embed/")) {
      finalEmbedUrl = mapUrl;
    } else if (mapUrl.startsWith("http")) {
      try {
        const res = await fetch(mapUrl, { redirect: "manual", headers: { "User-Agent": "Mozilla/5.0" }, next: { revalidate: 86400 } });
        const finalUrl = res.headers.get("location") || res.url;
        
        let lat, lng;
        const exactMatch = finalUrl.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
        if (exactMatch) {
          lat = exactMatch[1];
          lng = exactMatch[2];
        } else {
          const coordsMatch = finalUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
          if (coordsMatch) {
            lat = coordsMatch[1];
            lng = coordsMatch[2];
          }
        }
        
        if (lat && lng) {
          finalEmbedUrl = `https://maps.google.com/maps?q=${lat},${lng}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
        }
      } catch (e) {
        console.error("Map resolution failed", e);
      }
    }
  }

  return (
    <>
      <PageHeader
        title="Hubungi Kami"
        description="Kami senang mendengar dari Anda. Silakan hubungi kami melalui salah satu cara di bawah ini."
        breadcrumbs={buildDynamicBreadcrumbs(tenant.websiteMenus || [], "/contact", "Contact")}
      />

      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        {/* Map Section */}
        {(tenant.address || mapUrl) && (
          <div className="mb-12 relative w-full h-[400px] rounded-2xl overflow-hidden border bg-muted shadow-sm group">
            <iframe
              title="Lokasi Sekolah"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              loading="lazy"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
              src={finalEmbedUrl}
            />
            {mapUrl && mapUrl.startsWith("http") && !mapUrl.includes("<iframe") && !mapUrl.includes("/embed/") && (
              <div className="absolute bottom-4 left-4 z-10 transition-transform duration-300 group-hover:-translate-y-1">
                <a href={mapUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-white text-slate-800 px-4 py-2.5 rounded-xl shadow-lg border hover:bg-slate-50 font-medium text-sm transition-colors">
                  <MapPin className="h-4 w-4 text-primary" />
                  Buka di Google Maps
                </a>
              </div>
            )}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-12">
          {/* Contact Info */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Informasi Kontak</h2>

            {hasContact ? (
              <div className="space-y-3">
                {tenant.address && (
                  <div className="flex items-start gap-4 p-4 rounded-xl border hover:bg-muted/50 transition-colors">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                      <MapPin className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Alamat</p>
                      <p className="text-sm text-muted-foreground mt-0.5 whitespace-pre-line">{tenant.address}</p>
                    </div>
                  </div>
                )}
                {tenant.phone && (
                  <a href={`tel:${tenant.phone}`} className="flex items-start gap-4 p-4 rounded-xl border hover:bg-muted/50 transition-colors">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                      <Phone className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Telepon</p>
                      <p className="text-sm text-muted-foreground mt-0.5">{tenant.phone}</p>
                    </div>
                  </a>
                )}
                {tenant.email && (
                  <a href={`mailto:${tenant.email}`} className="flex items-start gap-4 p-4 rounded-xl border hover:bg-muted/50 transition-colors">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                      <Mail className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Email</p>
                      <p className="text-sm text-muted-foreground mt-0.5">{tenant.email}</p>
                    </div>
                  </a>
                )}
                {tenant.whatsapp && (
                  <a href={`https://wa.me/${tenant.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener"
                    className="flex items-start gap-4 p-4 rounded-xl border hover:bg-muted/50 transition-colors">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10">
                      <MessageCircle className="h-5 w-5 text-emerald-500" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">WhatsApp</p>
                      <p className="text-sm text-muted-foreground mt-0.5">+{tenant.whatsapp}</p>
                    </div>
                  </a>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">Informasi kontak belum tersedia.</p>
            )}

            {/* Social Media */}
            {(tenant.instagram || tenant.facebook || tenant.youtube || tenant.tiktok) && (
              <div>
                <h3 className="font-semibold text-sm mb-3">Media Sosial</h3>
                <div className="flex gap-3 flex-wrap">
                  {tenant.instagram && (
                    <a href={formatSocialUrl(tenant.instagram, 'instagram')} target="_blank" rel="noopener"
                      className="flex items-center gap-2 px-4 py-2 rounded-xl border hover:bg-muted/50 transition-colors text-sm">
                      📷 Instagram
                    </a>
                  )}
                  {tenant.facebook && (
                    <a href={formatSocialUrl(tenant.facebook, 'facebook')} target="_blank" rel="noopener"
                      className="flex items-center gap-2 px-4 py-2 rounded-xl border hover:bg-muted/50 transition-colors text-sm">
                      📘 Facebook
                    </a>
                  )}
                  {tenant.youtube && (
                    <a href={formatSocialUrl(tenant.youtube, 'youtube')} target="_blank" rel="noopener"
                      className="flex items-center gap-2 px-4 py-2 rounded-xl border hover:bg-muted/50 transition-colors text-sm">
                      ▶️ YouTube
                    </a>
                  )}
                  {tenant.tiktok && (
                    <a href={formatSocialUrl(tenant.tiktok, 'tiktok')} target="_blank" rel="noopener"
                      className="flex items-center gap-2 px-4 py-2 rounded-xl border hover:bg-muted/50 transition-colors text-sm">
                      🎵 TikTok
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Contact Form — Client Component */}
          <ContactForm slug={slug} labels={(tenant.settings as any)?.labels?.contact || {}} />
        </div>
      </section>
    </>
  )
}
