import { PageHeader } from "@/app/site/[slug]/_components/page-header"
import { notFound } from "next/navigation"
import { 
  Users, GraduationCap, Trophy, Building2, Activity, 
  BookOpen, CheckCircle, Quote, MapPin, Phone, Mail 
} from "lucide-react"
import { getPublicTenantBySlug } from "@/lib/services/tenant-public"
import { OptimizedImage } from "@/components/ui/optimized-image"
import { cn } from "@/lib/utils"

export default async function ProfilTerpaduPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const tenant = await getPublicTenantBySlug(slug)
  if (!tenant) notFound()

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

      {/* ── TENTANG KAMI ── */}
      <section className="py-20 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="relative aspect-square rounded-3xl overflow-hidden shadow-2xl">
             <OptimizedImage 
                src={tenant.heroImage || "https://images.unsplash.com/photo-1523050335102-c89b1811b127?q=80&w=2070"} 
                alt="About" 
                fill 
                className="object-cover"
             />
             <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
             <div className="absolute bottom-8 left-8 text-white">
                <p className="text-4xl font-black mb-1">Sejak</p>
                <p className="text-xl font-bold opacity-80">{new Date(tenant.createdAt).getFullYear()} — Berdedikasi</p>
             </div>
          </div>
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">
               Sekapur Sirih
            </div>
            <h2 className="text-3xl font-extrabold text-foreground">Visi, Misi & Sejarah</h2>
             <div className="prose prose-slate leading-relaxed text-muted-foreground">
               <p>{tenant.about || "Belum ada informasi profil sejarah sekolah."}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── GURU & STAF (GTK) ── */}
      {tenant.staff && tenant.staff.length > 0 && (
        <section id="gtk" className="py-20 bg-muted/30">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center mb-12">
            <h2 className="text-3xl font-extrabold">Tenaga Pendidik Kami</h2>
            <p className="text-muted-foreground mt-3">Didukung oleh pengajar profesional dan berdedikasi tinggi.</p>
          </div>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
            {tenant.staff.map((s: any) => (
              <div key={s.id} className="group text-center">
                <div className="relative mx-auto h-40 w-40 rounded-2xl overflow-hidden mb-4 shadow-md group-hover:shadow-xl transition-all">
                  <OptimizedImage 
                    src={s.imageUrl || "https://images.unsplash.com/photo-1580894732230-285b963a9013?q=80&w=2070"} 
                    alt={s.name} 
                    fill 
                    className="object-cover grayscale group-hover:grayscale-0 transition-all duration-500" 
                  />
                </div>
                <h4 className="font-bold text-sm">{s.name}</h4>
                <p className="text-[10px] text-primary font-bold uppercase tracking-widest mt-1">{s.role}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── PROGRAM & JURUSAN ── */}
      {tenant.programs && tenant.programs.length > 0 && (
        <section id="programs" className="py-20 bg-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 grid md:grid-cols-3 gap-8">
            <div className="md:col-span-1 space-y-4">
              <h2 className="text-3xl font-extrabold">Program & Keahlian</h2>
              <p className="text-muted-foreground leading-relaxed">
                Kurikulum kami dirancang untuk menjawab tantangan industri dan teknologi masa depan.
              </p>
              <div className="h-1 w-20 bg-primary rounded-full" />
            </div>
            <div className="md:col-span-2 grid sm:grid-cols-2 gap-4">
              {tenant.programs.map((p: any) => (
                <div key={p.id} className="p-6 rounded-2xl border bg-background hover:border-primary/50 transition-colors group">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4 group-hover:bg-primary group-hover:text-white transition-colors">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <h4 className="font-bold mb-2">{p.name}</h4>
                  <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">{p.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── FASILITAS SEKOLAH ── */}
      {tenant.facilities && tenant.facilities.length > 0 && (
        <section id="facilities" className="py-20 bg-muted/20 overflow-hidden">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mb-12">
            <div className="flex items-end justify-between gap-4">
               <div>
                  <h2 className="text-3xl font-extrabold">Fasilitas Modern</h2>
                  <p className="text-muted-foreground mt-2">Sarana pendukung belajar mengajar kelas dunia.</p>
               </div>
               <div className="hidden md:flex gap-2">
                  <Building2 className="h-12 w-12 text-primary/10" />
               </div>
            </div>
          </div>
          <div className="flex gap-6 px-4 overflow-x-auto pb-8 scrollbar-hide no-scrollbar mx-auto max-w-7xl">
            {tenant.facilities.map((f: any) => (
              <div key={f.id} className="min-w-[280px] md:min-w-[350px] group relative aspect-video rounded-3xl overflow-hidden shadow-lg">
                <OptimizedImage src={f.imageUrl || ""} alt={f.name} fill className="object-cover group-hover:scale-110 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-6 left-6 text-white">
                  <h4 className="font-bold text-lg">{f.name}</h4>
                  <p className="text-xs opacity-80 mt-1">{f.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── EKSTRAKURIKULER ── */}
      {tenant.extracurriculars && tenant.extracurriculars.length > 0 && (
        <section id="extracurriculars" className="py-20 bg-white">
           <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center mb-16">
              <h2 className="text-3xl font-extrabold">Ekstrakurikuler</h2>
              <p className="text-muted-foreground mt-3">Wadah pengembangan minat, bakat, dan karakter siswa.</p>
           </div>
           <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {tenant.extracurriculars.map((e: any) => (
                <div key={e.id} className="relative group rounded-3xl overflow-hidden shadow-xl hover:-translate-y-2 transition-all duration-300">
                   <div className="aspect-video relative">
                      <OptimizedImage src={e.imageUrl || ""} alt={e.name} fill className="object-cover" />
                      <div className="absolute inset-0 bg-primary/20 group-hover:bg-transparent transition-colors" />
                   </div>
                   <div className="p-6">
                      <div className="flex items-center gap-2 text-primary mb-2">
                         <Activity className="h-4 w-4" />
                         <span className="text-[10px] font-bold uppercase tracking-widest">{e.schedule || "Jadwal Fleksibel"}</span>
                      </div>
                      <h4 className="font-bold text-xl mb-2">{e.name}</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">{e.description}</p>
                   </div>
                </div>
              ))}
           </div>
        </section>
      )}

      {/* ── ALUMNI SUCCESS ── */}
      {tenant.alumni && tenant.alumni.length > 0 && (
        <section id="alumni" className="py-20 bg-primary text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 p-20 opacity-5 rotate-12">
            <GraduationCap className="h-96 w-96" />
          </div>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="flex flex-col md:flex-row items-end justify-between gap-6 mb-16">
              <div className="max-w-xl">
                <h2 className="text-4xl font-black">Success Stories</h2>
                <p className="mt-4 text-primary-foreground/80 leading-relaxed text-lg italic">
                  "Kebanggaan terbesar kami adalah melihat lulusan kami tumbuh dan berkontribusi di tengah masyarakat."
                </p>
              </div>
              <div className="h-1 w-full flex-1 bg-white/20 rounded-full mb-4 hidden md:block" />
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {tenant.alumni.map((a: any) => (
                <div key={a.id} className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/10 flex flex-col h-full">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="h-16 w-16 rounded-full overflow-hidden border-2 border-white/20 relative">
                       <OptimizedImage src={a.imageUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=1000"} alt={a.name} fill className="object-cover" />
                    </div>
                    <div>
                      <h4 className="font-bold text-lg leading-tight">{a.name}</h4>
                      <p className="text-xs opacity-70">Lulusan {a.graduationYear}</p>
                    </div>
                  </div>
                  <div className="flex-1 italic text-sm opacity-90 leading-relaxed relative">
                    <Quote className="h-8 w-8 absolute -top-4 -left-4 opacity-10" />
                    "{a.testimonial || "Pendidikan di sini memberikan bekal karakter dan hard-skill yang sangat relevan dengan dunia kerja/kuliah saat ini."}"
                  </div>
                  <div className="mt-8 pt-6 border-t border-white/10">
                    <p className="text-[10px] font-black uppercase tracking-widest text-primary-foreground/60 mb-1">Status Saat Ini</p>
                    <p className="text-sm font-bold">{a.currentStatus} @ {a.institutionName}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── PRESTASI (GRID) ── */}
      {tenant.achievements && tenant.achievements.length > 0 && (
        <section id="achievements" className="py-20 bg-muted/40">
           <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center mb-16">
              <div className="inline-block p-3 rounded-full bg-primary/10 text-primary mb-4">
                 <Trophy className="h-8 w-8" />
              </div>
              <h2 className="text-3xl font-extrabold uppercase tracking-tight">Gallery of Achievements</h2>
              <p className="text-muted-foreground mt-3">Bukti nyata semangat belajar dan prestasi siswa kami.</p>
           </div>
           <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
             {tenant.achievements.map((acc: any) => (
                <div key={acc.id} className="group relative aspect-square rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all border border-border/50">
                   <OptimizedImage src={acc.imageUrl || ""} alt={acc.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                   <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-60 group-hover:opacity-100 transition-opacity" />
                   <div className="absolute bottom-6 left-6 right-6 text-white">
                      <p className="text-[10px] font-bold text-primary mb-1 uppercase tracking-widest">{acc.level}</p>
                      <h4 className="font-bold text-sm leading-tight">{acc.title}</h4>
                   </div>
                </div>
             ))}
           </div>
        </section>
      )}

      {/* ── FOOTER PROFIL ── */}
      <section className="py-20 bg-white">
         <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="rounded-[40px] bg-muted/50 p-12 md:p-20 text-center relative overflow-hidden">
               <div className="relative z-10">
                  <h2 className="text-3xl md:text-4xl font-black mb-6">Wujudkan Impian Bersama Kami</h2>
                  <p className="text-muted-foreground max-w-2xl mx-auto mb-10 text-lg leading-relaxed">
                     Pintu kami selalu terbuka untuk Anda yang ingin bergabung atau berkonsultasi mengenai masa depan putra-putri Anda.
                  </p>
                  <div className="flex flex-wrap justify-center gap-6">
                     <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary"><Phone className="h-5 w-5" /></div>
                        <p className="text-sm font-bold">{tenant.phone}</p>
                     </div>
                     <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary"><Mail className="h-5 w-5" /></div>
                        <p className="text-sm font-bold">{tenant.email}</p>
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </section>
    </div>
  )
}
