import { PageHeader } from "@/app/site/[slug]/_components/page-header"
import { notFound } from "next/navigation"
import { MapPin, Phone, Mail, MessageCircle } from "lucide-react"
import { ContactForm } from "./contact-form"
import { getPublicTenantBySlug } from "@/features/tenant/services/tenant-public.service"
import { getPublicBasePath } from "@/lib/utils/public-path"
import { renderCustomTheme } from "@/app/site/[slug]/_themes/custom-renderer"

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const tenant = await getPublicTenantBySlug(slug)
  if (!tenant) return {}
  return {
    title: `Kontak | ${tenant.seoTitle || tenant.name}`,
    description: tenant.seoDesc || tenant.description || `Hubungi ${tenant.name}`,
  }
}

export default async function ContactPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const tenant = await getPublicTenantBySlug(slug)
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

  return (
    <>
      <PageHeader
        title="Hubungi Kami"
        description="Kami senang mendengar dari Anda. Silakan hubungi kami melalui salah satu cara di bawah ini."
        breadcrumbs={[
          { label: "Halaman" },
          { label: "Kontak" }
        ]}
      />

      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
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
            {(tenant.instagram || tenant.facebook || tenant.youtube) && (
              <div>
                <h3 className="font-semibold text-sm mb-3">Media Sosial</h3>
                <div className="flex gap-3 flex-wrap">
                  {tenant.instagram && (
                    <a href={`https://instagram.com/${tenant.instagram}`} target="_blank" rel="noopener"
                      className="flex items-center gap-2 px-4 py-2 rounded-xl border hover:bg-muted/50 transition-colors text-sm">
                      📷 @{tenant.instagram}
                    </a>
                  )}
                  {tenant.facebook && (
                    <a href={`https://facebook.com/${tenant.facebook}`} target="_blank" rel="noopener"
                      className="flex items-center gap-2 px-4 py-2 rounded-xl border hover:bg-muted/50 transition-colors text-sm">
                      📘 {tenant.facebook}
                    </a>
                  )}
                  {tenant.youtube && (
                    <a href={`https://youtube.com/${tenant.youtube}`} target="_blank" rel="noopener"
                      className="flex items-center gap-2 px-4 py-2 rounded-xl border hover:bg-muted/50 transition-colors text-sm">
                      ▶️ {tenant.youtube}
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Contact Form — Client Component */}
          <ContactForm slug={slug} />
        </div>
      </section>
    </>
  )
}
