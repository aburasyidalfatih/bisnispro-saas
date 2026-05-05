import { notFound } from "next/navigation"
import { PageHeader } from "@/app/site/[slug]/_components/page-header"
import { Users, GraduationCap, Mail, MessageSquare, Award, BookOpen } from "lucide-react"
import { getPublicTenantBySlug } from "@/lib/services/tenant-public"
import { getPublicBasePath } from "@/lib/utils/public-path"
import { OptimizedImage } from "@/components/ui/optimized-image"
import { cn } from "@/lib/utils"
import Link from "next/link"

export default async function GTKPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const tenant = await getPublicTenantBySlug(slug)
  
  if (!tenant) notFound()

  const staff = tenant.staff || []
  const base = await getPublicBasePath(slug)
  const totalStaff = staff.length

  // Group staff by role
  const principal = staff.find((s: any) => s.role && s.role.toLowerCase().includes("kepala sekolah"))
  const teachers = staff.filter((s: any) => s.role && !s.role.toLowerCase().includes("kepala sekolah"))

  return (
    <div className="bg-background min-h-screen">
      {/* ── HERO SECTION ── */}
      <PageHeader
        title="Guru & Tenaga Kependidikan"
        description="Mengenal lebih dekat para pendidik dan profesional yang membimbing putra-putri Anda menuju masa depan cemerlang."
        breadcrumbs={[
          { label: "Profil Sekolah" },
          { label: "SDM Unggul" }
        ]}
      />

      {/* ── PRINCIPAL HIGHLIGHT (If exists) ── */}
      {principal && (
        <section className="py-20 bg-muted/30 border-b border-border/50">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-[3rem] p-8 md:p-12 shadow-xl border border-border flex flex-col md:flex-row gap-12 items-center">
              <div className="relative h-64 w-64 md:h-80 md:w-80 rounded-[2.5rem] overflow-hidden shadow-2xl shrink-0">
                <OptimizedImage 
                  src={principal.imageUrl || "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=2076"} 
                  alt={principal.name} 
                  fill 
                  className="object-cover"
                />
              </div>
              <div className="flex-1 space-y-6">
                <div>
                  <div className="text-primary font-black text-xs uppercase tracking-[0.3em] mb-2">Pimpinan Sekolah</div>
                  <h2 className="text-3xl font-extrabold text-foreground">{principal.name}</h2>
                  <p className="text-lg font-medium text-muted-foreground">{principal.role}</p>
                </div>
                <div className="prose prose-slate italic text-muted-foreground">
                  <p>"{principal.bio || "Pendidikan adalah senjata paling mematikan di dunia, karena dengan pendidikan Anda bisa mengubah dunia. Kami di sini berkomitmen penuh untuk menjaga amanah Bapak/Ibu sekalian."}"</p>
                </div>
                <div className="flex gap-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-primary bg-primary/5 px-4 py-2 rounded-full border border-primary/10">
                    <GraduationCap className="h-4 w-4" /> Magister Pendidikan
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-500 bg-slate-100 px-4 py-2 rounded-full border border-slate-200">
                    <Award className="h-4 w-4" /> 15+ Tahun Pengalaman
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── TEACHERS GRID ── */}
      <section className="py-12 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        {teachers.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {teachers.map((s: any) => (
              <Link 
                href={`${base}/gtk/${s.id}`}
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
                      "{s.bio}"
                    </p>
                  )}
                  <div className="h-1 w-12 bg-primary/20 mx-auto rounded-full group-hover:w-20 group-hover:bg-primary transition-all duration-500" />
                </div>
              </Link>
            ))}
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
      <section className="bg-primary py-16 text-white overflow-hidden relative">
        <div className="absolute inset-0 bg-mesh opacity-10" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { icon: Users, label: "Total Guru & Staf", value: totalStaff > 0 ? `${totalStaff}+` : "—" },
              { icon: GraduationCap, label: "Lulusan S1/S2", value: totalStaff > 0 ? "98%" : "—" },
              { icon: BookOpen, label: "Rasio Guru:Siswa", value: "1:20" },
              { icon: Award, label: "Guru Berprestasi", value: totalStaff > 3 ? `${Math.round(totalStaff * 0.3)}` : "—" },
            ].map((stat, i) => (
              <div key={i} className="space-y-2">
                <div className="bg-white/10 h-12 w-12 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-md">
                  <stat.icon className="h-6 w-6" />
                </div>
                <div className="text-3xl font-black">{stat.value}</div>
                <div className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-70">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

       {/* ── CALL TO ACTION ── */}
       <section className="py-12 bg-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Ingin Menjadi Bagian dari Kami?</h2>
          <p className="text-muted-foreground mb-8 text-lg">
            Kami selalu membuka kesempatan bagi para profesional yang memiliki passion tinggi di dunia pendidikan untuk bergabung dalam tim hebat kami.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link 
              href={`${base}/contact`} 
              className="px-8 py-3 bg-primary text-white rounded-full font-bold hover:shadow-lg transition-all"
            >
              Kirim Lamaran (Karir)
            </Link>
            <Link 
              href={base} 
              className="px-8 py-3 bg-background border border-border rounded-full font-bold hover:bg-muted transition-all"
            >
              Kembali ke Beranda
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
