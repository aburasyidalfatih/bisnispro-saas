import { headers } from "next/headers"
import { notFound } from "next/navigation"
import { PageHeader } from "@/app/site/[slug]/_components/page-header"
import { Users, GraduationCap, Mail, MessageSquare, Award, BookOpen } from "lucide-react"
import { getTenantLayoutData, getTenantStaff } from "@/features/tenant/services/tenant-modular.service"
import { getPublicBasePath } from "@/lib/utils/public-path"
import { OptimizedImage } from "@/components/ui/optimized-image"
import { DynamicIcon } from "@/components/ui/icon-picker"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { renderCustomTheme } from "@/app/site/[slug]/_themes/custom-renderer"
import { buildDynamicBreadcrumbs } from "@/lib/utils/breadcrumbs"


export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const headerList = await headers();
  const rootDomain = headerList.get('x-root-domain') || process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'schoolpro.id';
  const { slug } = await params
  const tenant = await getTenantLayoutData(slug)
  if (!tenant) return {}
  
  const title = `Guru & Tenaga Kependidikan`
  const description = `Profil dan direktori Guru & Tenaga Kependidikan (GTK) di ${tenant.name}`
  const domainUrl = tenant.domain ? `https://${tenant.domain}` : `https://${tenant.slug}.${rootDomain}`
  
  return {
    title,
    description,
    alternates: { canonical: "/gtk" },
    openGraph: {
      title,
      description,
      url: `${domainUrl}/gtk`,
    }
  }
}

export default async function GTKPage({ params }: { params: Promise<{ slug: string }> }) {
  const headerList = await headers();
  const rootDomain = headerList.get('x-root-domain') || process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'schoolpro.id';
  const { slug } = await params
  const tenant = await getTenantLayoutData(slug)
  
  if (!tenant) notFound()

  const staffData = await getTenantStaff(slug)
  const staff = staffData?.staff || []
  const base = await getPublicBasePath(slug)

  // Custom Theme rendering
  if (tenant.customThemeId && tenant.customTheme?.staffHtml) {
    const rendered = renderCustomTheme({
      templateHtml: tenant.customTheme.staffHtml,
      layoutHtml: tenant.customTheme.layoutHtml,
      customCss: tenant.customTheme.customCss,
      customJs: tenant.customTheme.customJs,
      context: { tenant: { ...tenant, staff }, base, settings: tenant.settings || {} },
    })
    if (rendered) return rendered
  }

  const totalStaff = staff.length

  // Group staff by role
  // Check if there is an explicitly set principal in settings
  const explicitPrincipalName = (tenant.settings as any)?.principalName
  let principal = null

  if (explicitPrincipalName) {
    principal = staff.find((s: any) => s.name === explicitPrincipalName)
  }
  
  if (!principal) {
    principal = staff.find((s: any) => s.role && (s.role.toLowerCase().includes("kepala") || s.role.toLowerCase().includes("pimpinan") || s.role.toLowerCase().includes("direktur") || s.role.toLowerCase().includes("ketua")))
  }

  const teachers = staff.filter((s: any) => s.id !== principal?.id)

  const gtkStats = (tenant.settings as any)?.gtkStats?.length > 0 ? (tenant.settings as any).gtkStats : [
    { icon: "Users", label: "Total Guru & Staf", value: totalStaff > 0 ? `${totalStaff}+` : "—" },
    { icon: "GraduationCap", label: "Lulusan S1/S2", value: totalStaff > 0 ? "98%" : "—" },
    { icon: "BookOpen", label: "Rasio Guru:Siswa", value: "1:20" },
    { icon: "Award", label: "Guru Berprestasi", value: totalStaff > 3 ? `${Math.round(totalStaff * 0.3)}` : "—" },
  ]

  const gtkCta = (tenant.settings as any)?.gtkCta?.title ? (tenant.settings as any).gtkCta : {
    title: "Ingin Menjadi Bagian dari Kami?",
    description: "Kami selalu membuka kesempatan bagi para profesional yang memiliki passion tinggi di dunia pendidikan untuk bergabung dalam tim hebat kami.",
    buttonText: "Kirim Lamaran (Karir)",
    buttonLink: `${base}/contact`
  }

  const resolveLink = (link: string) => {
    if (!link) return base || "/"
    if (link.startsWith("http")) return link
    const cleanLink = link.startsWith("/") ? link : `/${link}`
    return `${base}${cleanLink}`.replace(/\/\//g, "/")
  }

  const showGtkStats = (tenant.settings as any)?.showGtkStats !== false
  const showGtkCta = (tenant.settings as any)?.showGtkCta !== false

  const findMenuPath = (menus: any[], targetUrl: string): any[] | null => {
    for (const menu of menus) {
      const menuUrl = menu.url || ""
      if (menuUrl === targetUrl || menuUrl === `${targetUrl}/` || menuUrl.endsWith(targetUrl)) {
        return [menu]
      }
      if (menu.children && menu.children.length > 0) {
        const found = findMenuPath(menu.children, targetUrl)
        if (found) return [menu, ...found]
      }
    }
    return null
  }

  const menuPath = findMenuPath(tenant.websiteMenus || [], "/gtk")
  const dynamicBreadcrumbs = menuPath 
    ? menuPath.map(m => ({ label: m.label }))
    : [
        { label: "Beranda" },
        { label: (tenant.settings as any)?.labels?.staff?.sectionTitle || "Guru & Tenaga Kependidikan" }
      ]

  return (
    <div className="bg-background min-h-screen">
      {/* ── HERO SECTION ── */}
      <PageHeader
        title={(tenant.settings as any)?.labels?.staff?.sectionTitle || "Guru & Tenaga Kependidikan"}
        description={(tenant.settings as any)?.labels?.staff?.sectionSubtitle || "Mengenal lebih dekat para pendidik dan profesional yang membimbing putra-putri Anda menuju masa depan cemerlang."}
        breadcrumbs={buildDynamicBreadcrumbs(tenant.websiteMenus || [], "/gtk", (tenant.settings as any)?.labels?.staff?.sectionTitle || "Guru & Tenaga Kependidikan")}
      />

      {/* ── PRINCIPAL HIGHLIGHT (If exists) ── */}
      {principal && (() => {
        const principalSlug = principal.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
        return (
        <section className="py-20 bg-muted/30 border-b border-border/50">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-[3rem] p-8 md:p-12 shadow-xl border border-border flex flex-col md:flex-row gap-12 items-center relative">
              <Link href={`${base}/gtk/${principalSlug}`} className="relative h-64 w-64 md:h-80 md:w-80 rounded-[2.5rem] overflow-hidden shadow-2xl shrink-0 group">
                <OptimizedImage 
                  src={principal.imageUrl || "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=2076"} 
                  alt={principal.name} 
                  fill 
                  className="object-cover group-hover:scale-105 transition-transform duration-700"
                />
              </Link>
              <div className="flex-1 space-y-6">
                <div>
                  <div className="text-primary font-black text-xs uppercase tracking-[0.3em] mb-2">{principal.role || "Pimpinan"}</div>
                  <Link href={`${base}/gtk/${principalSlug}`}>
                    <h2 className="text-3xl font-extrabold text-foreground hover:text-primary transition-colors">{principal.name}</h2>
                  </Link>
                </div>
                <div className="prose prose-slate italic text-muted-foreground">
                  <p>"{principal.bio ? principal.bio.replace(/<[^>]*>?/gm, '') : "Pendidikan adalah senjata paling mematikan di dunia, karena dengan pendidikan Anda bisa mengubah dunia. Kami di sini berkomitmen penuh untuk menjaga amanah Bapak/Ibu sekalian."}"</p>
                </div>
                
                <div className="flex flex-wrap gap-4 items-center">
                  <div className="flex items-center gap-2 text-xs font-bold text-primary bg-primary/5 px-4 py-2 rounded-full border border-primary/10">
                    <GraduationCap className="h-4 w-4" /> {principal.education || "Pendidikan"}
                  </div>
                  
                  {/* Social Media Icons */}
                  <div className="flex items-center gap-2 ml-auto md:ml-0">
                    {principal.instagram && (
                      <a href={principal.instagram} target="_blank" rel="noreferrer" className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/5 border border-primary/20 text-primary hover:bg-primary hover:text-primary-foreground transition-all shadow-sm">
                        <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
                      </a>
                    )}
                    {principal.facebook && (
                      <a href={principal.facebook} target="_blank" rel="noreferrer" className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/5 border border-primary/20 text-primary hover:bg-primary hover:text-primary-foreground transition-all shadow-sm">
                        <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
                      </a>
                    )}
                    {principal.youtube && (
                      <a href={principal.youtube} target="_blank" rel="noreferrer" className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/5 border border-primary/20 text-primary hover:bg-primary hover:text-primary-foreground transition-all shadow-sm">
                        <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"/><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"/></svg>
                      </a>
                    )}
                    {principal.tiktok && (
                      <a href={principal.tiktok} target="_blank" rel="noreferrer" className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/5 border border-primary/20 text-primary hover:bg-primary hover:text-primary-foreground transition-all shadow-sm">
                        <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                        </svg>
                      </a>
                    )}
                  </div>
                  
                  <Link href={`${base}/gtk/${principalSlug}`} className="inline-flex items-center justify-center px-6 py-2.5 rounded-full bg-primary text-white font-bold text-sm hover:bg-primary/90 transition-all shadow-lg hover:shadow-primary/20 md:ml-auto">
                    Lihat Profil
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
        )
      })()}

      {/* ── TEACHERS GRID ── */}
      <section className="py-12 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        {teachers.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {teachers.map((s: any) => {
              const slugifiedName = s.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
              return (
              <Link 
                href={`${base}/gtk/${slugifiedName}`}
                key={s.id} 
                className="group relative flex flex-col bg-white rounded-3xl overflow-hidden border border-border hover:shadow-2xl transition-all duration-500 hover:-translate-y-2"
              >
                <div className="relative aspect-[3/4] overflow-hidden">
                  <OptimizedImage 
                    src={s.imageUrl || "https://images.unsplash.com/photo-1580894732230-285b963a9013?q=80&w=2070"} 
                    alt={s.name} 
                    fill 
                    className="object-cover grayscale group-hover:grayscale-0 transition-all duration-700" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-end p-6">
                    <div className="flex gap-3 justify-center">
                      <button className="h-10 w-10 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white hover:bg-white hover:text-primary transition-all">
                        <Mail className="h-4 w-4" />
                      </button>
                      <button className="h-10 w-10 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white hover:bg-white hover:text-primary transition-all">
                        <MessageSquare className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
                <div className="p-6 text-center bg-white relative z-10">
                  <h4 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors">{s.name}</h4>
                  <p className="text-xs text-primary font-bold uppercase tracking-widest mt-1 mb-4">{s.role}</p>
                  {s.bio && (
                    <p className="text-[11px] text-muted-foreground line-clamp-2 italic mb-4">
                      "{s.bio.replace(/<[^>]*>?/gm, '')}"
                    </p>
                  )}
                  <div className="h-1 w-12 bg-primary/20 mx-auto rounded-full group-hover:w-20 group-hover:bg-primary transition-all duration-500" />
                </div>
              </Link>
            )})}
          </div>
        ) : (
          <div className="text-center py-20 bg-muted/20 rounded-3xl border border-dashed border-border">
             <div className="bg-primary/10 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-bold">Data Guru Sedang Diperbarui</h3>
            <p className="text-muted-foreground mt-2 max-w-sm mx-auto">
              Saat ini sistem sedang dalam proses input data tenaga pendidik untuk memberikan informasi yang lebih akurat.
            </p>
          </div>
        )}
      </section>

      {/* ── STATISTICS BAR ── */}
      {showGtkStats && (
      <section className="bg-primary py-16 text-white overflow-hidden relative">
        <div className="absolute inset-0 bg-mesh opacity-10" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {gtkStats.map((stat: any, i: number) => (
              <div key={i} className="space-y-2">
                <div className="bg-white/10 h-12 w-12 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-md">
                  <DynamicIcon name={stat.icon} className="h-6 w-6" />
                </div>
                <div className="text-3xl font-black">{stat.value}</div>
                <div className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-70">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
      )}

       {/* ── CALL TO ACTION ── */}
       {showGtkCta && (
       <section className="py-12 bg-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">{gtkCta.title}</h2>
          <p className="text-muted-foreground mb-8 text-lg">
            {gtkCta.description}
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link 
              href={resolveLink(gtkCta.buttonLink)} 
              className="px-8 py-3 bg-primary text-white rounded-full font-bold hover:shadow-lg transition-all"
            >
              {gtkCta.buttonText}
            </Link>
            <Link 
              href={base || "/"} 
              className="px-8 py-3 bg-background border border-border rounded-full font-bold hover:bg-muted transition-all"
            >
              Kembali ke Beranda
            </Link>
          </div>
        </div>
      </section>
      )}
    </div>
  )
}
