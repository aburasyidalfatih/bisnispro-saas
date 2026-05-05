import { PageHeader } from "@/app/site/[slug]/_components/page-header"
import { notFound } from "next/navigation"
import { BookOpen, Target, ArrowRight, Star, CheckCircle2, Award } from "lucide-react"
import { getPublicTenantBySlug } from "@/lib/services/tenant-public"
import { OptimizedImage } from "@/components/ui/optimized-image"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { getPublicBasePath } from "@/lib/utils/public-path"

export default async function ProgramPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const tenant = await getPublicTenantBySlug(slug)
  
  if (!tenant) notFound()

  const programs = tenant.programs || []
  const base = await getPublicBasePath(slug)

  return (
    <div className="bg-background min-h-screen">
      {/* ── HERO SECTION ── */}
      <PageHeader
        title="Program Unggulan"
        description="Membangun keunggulan akademik melalui program yang terintegrasi dan inovatif."
        breadcrumbs={[
          { label: "Profil Sekolah" },
          { label: "Program Unggulan" }
        ]}
      />

      {/* ── ACADEMIC PROGRAMS ── */}
      <section id="academic" className="py-12 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
          <div className="max-w-2xl">
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4">Program Unggulan</h2>
            <p className="text-muted-foreground text-lg">
              Fokus utama kami adalah memberikan pendidikan yang relevan dengan kebutuhan zaman tanpa meninggalkan nilai-nilai karakter.
            </p>
          </div>
          <div className="bg-primary/5 px-6 py-3 rounded-2xl border border-primary/10 flex items-center gap-3">
             <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-white font-bold">
                {programs.length}
             </div>
             <div className="text-xs font-bold text-primary uppercase tracking-widest leading-tight">
                Program<br/>Akademik
             </div>
          </div>
        </div>

        {programs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {programs.map((prog: any, index: number) => (
              <div 
                key={prog.id} 
                className={cn(
                  "group relative bg-white rounded-[2.5rem] overflow-hidden border border-border/60 hover:border-primary/40 transition-all duration-500 hover:shadow-2xl flex flex-col md:flex-row",
                  index % 2 === 1 ? "md:flex-row-reverse" : ""
                )}
              >
                <div className="relative h-64 md:h-auto md:w-2/5 shrink-0 overflow-hidden">
                  <OptimizedImage 
                    src={prog.imageUrl || "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=2022"} 
                    alt={prog.name} 
                    fill 
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-all" />
                </div>
                <div className="p-8 md:p-10 flex-1 flex flex-col">
                  <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6">
                    <BookOpen className="h-6 w-6" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4 group-hover:text-primary transition-colors">{prog.name}</h3>
                  <p className="text-muted-foreground leading-relaxed mb-8 flex-grow">
                    {prog.description || "Program pendidikan yang dirancang khusus untuk mengoptimalkan potensi intelektual dan keterampilan siswa secara komprehensif."}
                  </p>
                  <Link href={`${base}/program/${prog.id}`} className="flex items-center gap-2 text-primary font-bold text-sm">
                    Pelajari Selengkapnya <ArrowRight className="h-4 w-4 group-hover:translate-x-2 transition-transform" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-muted/20 rounded-3xl border border-dashed border-border">
             <h3 className="text-xl font-bold">Data Program Belum Tersedia</h3>
             <p className="text-muted-foreground mt-2">Daftar program akademik sedang dalam proses sinkronisasi.</p>
          </div>
        )}
      </section>

      {/* ── HIGHLIGHT SECTION ── */}
      <section className="py-12 bg-white relative overflow-hidden">
         <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 grid md:grid-cols-2 gap-16 items-center">
            <div className="relative">
               <div className="absolute -top-10 -left-10 h-40 w-40 bg-primary/10 rounded-full blur-3xl" />
               <div className="absolute -bottom-10 -right-10 h-40 w-40 bg-amber-400/10 rounded-full blur-3xl" />
               <div className="relative rounded-[3rem] overflow-hidden shadow-2xl border-4 border-white">
                  <OptimizedImage 
                    src="https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=2070" 
                    alt="Education Highlight" 
                    width={800} 
                    height={600} 
                    className="object-cover"
                  />
               </div>
            </div>
            <div className="space-y-8">
               <div className="bg-primary/5 px-4 py-1.5 rounded-full border border-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest w-fit">
                  Keunggulan Kami
               </div>
               <h2 className="text-3xl md:text-5xl font-black text-slate-900 leading-tight">Membangun Kompetensi Abad 21</h2>
               <p className="text-lg text-muted-foreground leading-relaxed">
                  Kami membekali siswa dengan 4C (Critical Thinking, Communication, Collaboration, & Creativity) melalui setiap kegiatan yang dilakukan di sekolah.
               </p>
               <ul className="space-y-4">
                  {[
                    "Kurikulum Adaptif & Berbasis Proyek",
                    "Pembimbingan Karakter & Etika Islami",
                    "Fasilitas Praktikum Lengkap",
                    "Ekosistem Belajar yang Aman & Nyaman"
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3">
                       <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                          <CheckCircle2 className="h-4 w-4" />
                       </div>
                       <span className="font-bold text-slate-700">{item}</span>
                    </li>
                  ))}
               </ul>
               <div className="pt-6">
                  <div className="flex items-center gap-4 p-4 bg-muted/40 rounded-2xl border border-border/50">
                     <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center text-white">
                        <Award className="h-6 w-6" />
                     </div>
                     <div>
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest leading-none mb-1">Terakreditasi</p>
                        <p className="text-lg font-black text-slate-900 leading-tight">Grade A (Sangat Baik)</p>
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </section>
    </div>
  )
}
