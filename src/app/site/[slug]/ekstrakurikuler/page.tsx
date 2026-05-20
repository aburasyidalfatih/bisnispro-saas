import { notFound } from "next/navigation"
import { Star, CheckCircle2, Target } from "lucide-react"
import { getPublicTenantBySlug } from "@/features/tenant/services/tenant-public.service"
import { OptimizedImage } from "@/components/ui/optimized-image"
import { PageHeader } from "@/app/site/[slug]/_components/page-header"
import { getPublicBasePath } from "@/lib/utils/public-path"
import Link from "next/link"
import { renderCustomTheme } from "@/app/site/[slug]/_themes/custom-renderer"

export default async function EkstrakurikulerPage({ params }: { params: Promise<{ slug: string }> }) {
 const { slug } = await params
 const tenant = await getPublicTenantBySlug(slug)
 
 if (!tenant) notFound()

 const extracurriculars = tenant.extracurriculars || []
 const base = await getPublicBasePath(slug)

 // Custom Theme rendering
 if (tenant.customThemeId && tenant.customTheme?.extracurricularHtml) {
   const rendered = renderCustomTheme({
     templateHtml: tenant.customTheme.extracurricularHtml,
     layoutHtml: tenant.customTheme.layoutHtml,
     customCss: tenant.customTheme.customCss,
     customJs: tenant.customTheme.customJs,
     context: { tenant: { ...tenant, extracurriculars }, base, settings: tenant.settings || {} },
   })
   if (rendered) return rendered
 }
 
 const BORDER_COLORS = [
   "hover:border-blue-400 hover:shadow-blue-500/20",
   "hover:border-purple-400 hover:shadow-purple-500/20",
   "hover:border-rose-400 hover:shadow-rose-500/20",
   "hover:border-emerald-400 hover:shadow-emerald-500/20",
   "hover:border-amber-400 hover:shadow-amber-500/20",
 ]

 return (
 <div className="bg-background min-h-screen pb-12">
 {/* ── HERO SECTION ── */}
 <PageHeader
        title="Ekstrakurikuler"
        description="Wadah bagi siswa untuk mengeksplorasi minat, mengasah kepemimpinan, dan membangun kerjasama tim di luar jam kelas."
        breadcrumbs={[
          { label: "Profil Sekolah" },
          { label: "Ekstrakurikuler" }
        ]}
      />

 {/* ── EXTRACURRICULAR ACTIVITIES ── */}
 <section className="py-12 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">


 {extracurriculars.length > 0 ? (
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
 {extracurriculars.map((ekskul: any, idx: number) => {
   const hoverStyle = BORDER_COLORS[idx % BORDER_COLORS.length];
   return (
 <Link 
   href={`${base}/ekstrakurikuler/${ekskul.id}`}
   key={ekskul.id} 
   className={`group bg-white rounded-3xl p-6 border-2 border-transparent shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 ${hoverStyle}`}
 >
 <div className="relative aspect-video rounded-2xl overflow-hidden mb-6 shadow-md">
 <OptimizedImage 
 src={ekskul.imageUrl || "https://images.unsplash.com/photo-1511632765486-a01980e01a18?q=80&w=2070"} 
 alt={ekskul.name} 
 fill 
 className="object-cover group-hover:scale-110 transition-transform duration-700"
 />
 <div className="absolute top-4 right-4 h-8 w-8 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center text-amber-500 shadow-sm">
 <Star className="h-4 w-4 fill-amber-500" />
 </div>
 </div>
 <h4 className="font-bold text-xl mb-2 group-hover:text-primary transition-colors">{ekskul.name}</h4>
 <p className="text-sm text-muted-foreground line-clamp-3 mb-6 leading-relaxed">
 {ekskul.description || "Kegiatan positif yang rutin dilakukan setiap minggu untuk mendukung minat dan bakat siswa di bidang non-akademik."}
 </p>
 
 <div className="flex items-center justify-between pt-4 border-t border-border/50">
 <div className="flex items-center gap-2 text-[10px] font-bold text-primary uppercase tracking-widest">
 <CheckCircle2 className="h-3.5 w-3.5" /> Aktif
 </div>
 {ekskul.schedule && (
 <div className="text-[10px] font-bold text-muted-foreground bg-muted px-3 py-1 rounded-full group-hover:bg-primary/10 group-hover:text-primary transition-colors">
 {ekskul.schedule}
 </div>
 )}
 </div>
 </Link>
 )})}
 </div>
 ) : (
 <div className="text-center py-32 bg-white/50 rounded-[3rem] border border-dashed border-border/60 flex flex-col items-center">
 <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-6">
   <Target className="h-10 w-10" />
 </div>
 <h3 className="text-2xl font-bold mb-2">Belum ada data</h3>
 <p className="text-muted-foreground max-w-sm text-center mt-2">Daftar ekstrakurikuler sedang dalam proses pendataan.</p>
 </div>
 )}
 </section>
 </div>
 )
}
