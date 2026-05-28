import { PageHeader } from "@/app/site/[slug]/_components/page-header"
import { notFound } from "next/navigation"
import { 
  Users, GraduationCap, Trophy, Building2, Activity, 
  BookOpen, CheckCircle, Quote, MapPin, Phone, Mail,
  Play, Target, Award, ArrowRight, ShieldCheck
} from "lucide-react"
import { getPublicTenantBySlug } from "@/features/tenant/services/tenant-public.service"
import { OptimizedImage } from "@/components/ui/optimized-image"
import { cn, normalizeImageUrl } from "@/lib/utils"
import Link from "next/link"
import { getPublicBasePath } from "@/lib/utils/public-path"
import { renderCustomTheme } from "@/app/site/[slug]/_themes/custom-renderer"
import DOMPurify from "isomorphic-dompurify"

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const tenant = await getPublicTenantBySlug(slug)
  if (!tenant) return {}
  
  const title = `Profil & Sejarah`
  const description = tenant.about?.replace(/<[^>]*>/g, "").substring(0, 160) || `Informasi lengkap mengenai profil, sejarah, visi, dan misi ${tenant.name}`
  const domainUrl = tenant.domain ? `https://${tenant.domain}` : `https://${tenant.slug}.schoolpro.id`
  
  return {
    title,
    description,
    alternates: { canonical: "/profil" },
    openGraph: {
      title: `${title} | ${tenant.name}`,
      description,
      url: `${domainUrl}/profil`,
    }
  }
}

export default async function ProfilTerpaduPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const tenant = await getPublicTenantBySlug(slug)
  if (!tenant) notFound()

  const base = await getPublicBasePath(slug)

  // Custom Theme rendering
  if (tenant.customThemeId && tenant.customTheme?.aboutHtml) {
    const rendered = renderCustomTheme({
      templateHtml: tenant.customTheme.aboutHtml,
      layoutHtml: tenant.customTheme.layoutHtml,
      customCss: tenant.customTheme.customCss,
      customJs: tenant.customTheme.customJs,
      context: { tenant, base, settings: tenant.settings || {} },
    })
    if (rendered) return rendered
  }

  const settings = tenant.settings || {} as any

  // Extracts
  const principalName = settings.sambutanKepsek ? (settings.principalName || "Kepala Sekolah") : null
  const principalPhoto = settings.principalImage || "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=1000"
  
  let videoThumbnail = tenant.heroImage || "https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=2000"
  if (settings.videoProfil) {
    const match = settings.videoProfil.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})/)
    if (match && match[1]) {
      // Use hqdefault because maxresdefault is not always available for all videos
      videoThumbnail = `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg`
    }
  }
  
  const totalStaff = tenant.staff?.length || 0
  const totalAlumni = tenant.alumni?.length || 0
  const totalEkskul = tenant.extracurriculars?.length || 0

  return (
    <div className="bg-background">
      {/* ── HERO PROFIL ── */}
      <PageHeader
        title={<>{tenant.name}</>}
        description={<>"{tenant.tagline || "Mewujudkan Masa Depan Gemilang Melalui Pendidikan Berkualitas"}"</>}
        breadcrumbs={[
          { label: "Profil Sekolah" },
          { label: "Profil Lengkap" }
        ]}
      />

      {/* ── LEGALITAS & IDENTITAS CEPAT ── */}
      <section className="py-8 bg-primary/5 border-b border-border/50">
         <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-wrap gap-8 justify-center sm:justify-between items-center text-sm font-medium">
            <div className="flex items-center gap-2">
               <Building2 className="h-4 w-4 text-primary" />
               <span className="text-muted-foreground">Tahun Berdiri:</span>
               <span className="font-bold text-foreground">{String(settings.establishedYear || new Date(tenant.createdAt || Date.now()).getFullYear())}</span>
            </div>
            {settings.npsn && (
              <div className="flex items-center gap-2">
                 <ShieldCheck className="h-4 w-4 text-primary" />
                 <span className="text-muted-foreground">NPSN:</span>
                 <span className="font-bold text-foreground">{settings.npsn}</span>
              </div>
            )}
            {settings.akreditasi && (
              <div className="flex items-center gap-2">
                 <Award className="h-4 w-4 text-primary" />
                 <span className="text-muted-foreground">Akreditasi:</span>
                 <span className="font-bold text-foreground">{settings.akreditasi}</span>
              </div>
            )}
            {tenant.phone && (
              <div className="flex items-center gap-2">
                 <Phone className="h-4 w-4 text-primary" />
                 <span className="font-bold text-foreground">{tenant.phone}</span>
              </div>
            )}
         </div>
      </section>

      {/* ── SAMBUTAN KEPALA SEKOLAH ── */}
      {settings.sambutanKepsek && (
        <section className="py-24 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
           <div className="grid md:grid-cols-12 gap-12 items-center">
              <div className="md:col-span-5 relative">
                 <div className="absolute inset-0 bg-primary/10 rounded-[3rem] rotate-6 scale-105 transition-transform" />
                 <div className="relative aspect-[4/5] rounded-[3rem] overflow-hidden shadow-2xl border-4 border-white">
                    <OptimizedImage src={principalPhoto} alt={principalName || "Kepala Sekolah"} fill className="object-cover" />
                 </div>
              </div>
              <div className="md:col-span-7 space-y-6 md:pl-8">
                 <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">
                    Sambutan Pimpinan
                 </div>
                 <h2 className="text-3xl md:text-5xl font-extrabold text-foreground leading-tight">Pesan dari Kepala Sekolah</h2>
                 <div className="relative">
                    <Quote className="absolute -top-6 -left-6 h-16 w-16 text-primary/10 rotate-180" />
                    <p className="text-lg md:text-xl leading-relaxed text-muted-foreground italic relative z-10">
                       "{settings.sambutanKepsek}"
                    </p>
                 </div>
                 <div className="pt-6 border-t border-border/50">
                    <p className="font-bold text-xl text-foreground">{principalName}</p>
                    <p className="text-primary text-sm font-semibold uppercase tracking-wider mt-1">Kepala Sekolah {tenant.name}</p>
                 </div>
              </div>
           </div>
        </section>
      )}

      {/* ── TENTANG KAMI & VIDEO ── */}
      <section className="py-20 bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 grid md:grid-cols-2 gap-16 items-center">
           <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 text-xs font-bold uppercase tracking-wider">
                 Sejarah Sekolah
              </div>
              <h2 className="text-3xl md:text-4xl font-extrabold text-foreground">Tentang {tenant.name}</h2>
              <div 
                 className="prose prose-slate leading-relaxed text-muted-foreground max-w-none" 
                 dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(tenant.about || tenant.description || "Belum ada informasi profil sejarah sekolah.") }} 
              />
           </div>
           
           <div className="relative aspect-video rounded-3xl overflow-hidden shadow-2xl group bg-black">
              {settings.videoProfil ? (
                 <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={normalizeImageUrl(videoThumbnail)} alt="Video Thumbnail" className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity" />
                    <a href={settings.videoProfil} target="_blank" rel="noreferrer" className="absolute inset-0 flex items-center justify-center">
                       <div className="h-20 w-20 rounded-full bg-primary/90 flex items-center justify-center text-white shadow-xl hover:scale-110 transition-transform cursor-pointer">
                          <Play className="h-8 w-8 ml-1" />
                       </div>
                    </a>
                 </>
              ) : (
                 <OptimizedImage src={tenant.heroImage || "https://images.unsplash.com/photo-1523050335102-c89b1811b127?q=80&w=2070"} alt="About" fill className="object-cover" />
              )}
           </div>
        </div>
      </section>

      {/* ── VISI & MISI ── */}
      {(settings.visi || settings.misi) && (
        <section className="py-24 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
           <div className="text-center mb-16 max-w-3xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-extrabold text-foreground mb-4">Visi & Misi</h2>
              <p className="text-muted-foreground">Arah langkah dan pedoman kami dalam menyelenggarakan pendidikan unggul.</p>
           </div>
           <div className="grid md:grid-cols-2 gap-8">
              {settings.visi && (
                 <div className="p-10 rounded-[2.5rem] bg-gradient-to-br from-primary to-primary/80 text-white shadow-xl relative overflow-hidden flex flex-col justify-center">
                    <Target className="absolute -right-6 -top-6 h-40 w-40 opacity-10" />
                    <div className="h-14 w-14 rounded-2xl bg-white/20 flex items-center justify-center mb-8 backdrop-blur-sm">
                       <Target className="h-7 w-7 text-white" />
                    </div>
                    <h3 className="text-2xl font-black mb-4">Visi Kami</h3>
                    <div className="text-lg leading-relaxed font-medium opacity-90 prose prose-invert" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(settings.visi) }} />
                 </div>
              )}
              {settings.misi && (
                 <div className="p-10 rounded-[2.5rem] bg-white border border-border/60 shadow-xl relative overflow-hidden">
                    <CheckCircle className="absolute -right-6 -bottom-6 h-40 w-40 text-muted/30" />
                    <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-8">
                       <CheckCircle className="h-7 w-7 text-primary" />
                    </div>
                    <h3 className="text-2xl font-black mb-4 text-foreground">Misi Kami</h3>
                    <div className="space-y-3 prose prose-slate text-muted-foreground marker:text-primary max-w-none" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(settings.misi) }} />
                 </div>
              )}
           </div>
        </section>
      )}

      {/* ── STATISTIK ── */}
      <section className="py-16 bg-foreground text-background">
         <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-8 text-center md:divide-x md:divide-background/10">
            <div>
               <p className="text-4xl md:text-5xl font-black text-primary mb-2">{totalStaff}+</p>
               <p className="text-sm font-semibold uppercase tracking-widest opacity-80">Tenaga Pendidik</p>
            </div>
            <div>
               <p className="text-4xl md:text-5xl font-black text-primary mb-2">{totalAlumni}+</p>
               <p className="text-sm font-semibold uppercase tracking-widest opacity-80">Lulusan Sukses</p>
            </div>
            <div>
               <p className="text-4xl md:text-5xl font-black text-primary mb-2">{tenant.programs?.length || 0}</p>
               <p className="text-sm font-semibold uppercase tracking-widest opacity-80">Program Studi</p>
            </div>
            <div>
               <p className="text-4xl md:text-5xl font-black text-primary mb-2">{totalEkskul}+</p>
               <p className="text-sm font-semibold uppercase tracking-widest opacity-80">Ekstrakurikuler</p>
            </div>
         </div>
      </section>

      {/* ── TEASERS (Fasilitas & Program) ── */}
      <section className="py-24 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 grid md:grid-cols-2 gap-12">
         {/* Program Teaser */}
         <div className="p-8 rounded-[2rem] bg-muted/40 border border-border/50 flex flex-col items-center text-center">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-6">
               <BookOpen className="h-8 w-8" />
            </div>
            <h3 className="text-2xl font-bold mb-3">Program Pendidikan</h3>
            <p className="text-muted-foreground mb-8">Kurikulum adaptif dan kompetitif yang dirancang untuk menjawab tantangan abad 21.</p>
            <Link href={`${base}/program`} className="mt-auto px-8 py-3 rounded-xl bg-white border shadow-sm font-bold hover:border-primary hover:text-primary transition-colors inline-flex items-center gap-2">
               Lihat Selengkapnya <ArrowRight className="h-4 w-4" />
            </Link>
         </div>
         {/* GTK Teaser */}
         <div className="p-8 rounded-[2rem] bg-muted/40 border border-border/50 flex flex-col items-center text-center">
            <div className="h-16 w-16 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600 mb-6">
               <Users className="h-8 w-8" />
            </div>
            <h3 className="text-2xl font-bold mb-3">Tenaga Pendidik & Staf</h3>
            <p className="text-muted-foreground mb-8">Didukung oleh pengajar profesional dan berdedikasi tinggi di bidangnya masing-masing.</p>
            <Link href={`${base}/gtk`} className="mt-auto px-8 py-3 rounded-xl bg-white border shadow-sm font-bold hover:border-amber-600 hover:text-amber-600 transition-colors inline-flex items-center gap-2">
               Kenali Pengajar Kami <ArrowRight className="h-4 w-4" />
            </Link>
         </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 bg-white">
         <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="rounded-[40px] bg-primary/5 p-12 md:p-20 text-center border border-primary/10">
               <h2 className="text-3xl md:text-4xl font-black mb-6 text-foreground">Jadilah Bagian dari Kami</h2>
               <p className="text-muted-foreground max-w-2xl mx-auto mb-10 text-lg leading-relaxed">
                  Pintu kami selalu terbuka untuk Anda yang ingin berkonsultasi mengenai masa depan putra-putri Anda. Hubungi kami sekarang.
               </p>
               <div className="flex flex-wrap justify-center gap-6">
                  {tenant.phone && (
                    <a href={`tel:${tenant.phone}`} className="flex items-center gap-3 bg-white px-6 py-3 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                       <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary"><Phone className="h-4 w-4" /></div>
                       <p className="text-sm font-bold">{tenant.phone}</p>
                    </a>
                  )}
                  {tenant.email && (
                    <a href={`mailto:${tenant.email}`} className="flex items-center gap-3 bg-white px-6 py-3 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                       <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary"><Mail className="h-4 w-4" /></div>
                       <p className="text-sm font-bold">{tenant.email}</p>
                    </a>
                  )}
               </div>
            </div>
         </div>
      </section>
    </div>
  )
}
