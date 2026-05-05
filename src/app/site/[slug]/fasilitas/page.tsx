import { PageHeader } from "@/app/site/[slug]/_components/page-header"
import { notFound } from "next/navigation"
import { Building2, Info, MapPin } from "lucide-react"
import { getPublicTenantBySlug } from "@/lib/services/tenant-public"
import { getPublicBasePath } from "@/lib/utils/public-path"
import { OptimizedImage } from "@/components/ui/optimized-image"
import { cn } from "@/lib/utils"
import Link from "next/link"

export default async function FasilitasPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const tenant = await getPublicTenantBySlug(slug)
  
  if (!tenant) notFound()

  const facilities = tenant.facilities || []
  const base = await getPublicBasePath(slug)

  return (
    <div className="bg-background min-h-screen">
      {/* ── HERO SECTION ── */}
      <PageHeader
        title="Fasilitas Sekolah"
        description="Sarana dan prasarana pendukung pendidikan berkualitas untuk kenyamanan seluruh siswa."
        breadcrumbs={[
          { label: "Profil Sekolah" },
          { label: "Lingkungan Belajar" }
        ]}
      />

      {/* ── MAIN CONTENT ── */}
      <section className="py-16 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {facilities.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {facilities.map((facility: any) => (
              <div 
                key={facility.id} 
                className="group relative bg-muted/30 rounded-3xl overflow-hidden border border-border/50 hover:border-primary/50 transition-all duration-300 flex flex-col h-full shadow-sm hover:shadow-xl"
              >
                <div className="relative aspect-[16/10] overflow-hidden">
                  <OptimizedImage
                    src={facility.imageUrl || "https://images.unsplash.com/photo-1541339907198-e08756ebafe3?q=80&w=2070"}
                    alt={facility.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
                
                <div className="p-6 flex flex-col flex-grow">
                  <div className="flex items-center gap-2 mb-3 text-primary">
                    <Building2 className="h-4 w-4" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Sarana Prasarana</span>
                  </div>
                  <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors">
                    {facility.name}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed mb-6 flex-grow">
                    {facility.description || "Fasilitas yang dirancang untuk mendukung kegiatan belajar mengajar dengan standar kenyamanan tinggi."}
                  </p>
                  
                  <div className="pt-4 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      <span>Area Kampus</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Info className="h-3 w-3" />
                      <span>Standar Nasional</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-muted/20 rounded-3xl border border-dashed border-border">
            <div className="bg-primary/10 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Building2 className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-bold">Data Fasilitas Belum Tersedia</h3>
            <p className="text-muted-foreground mt-2 max-w-sm mx-auto">
              Maaf, saat ini kami belum memperbarui daftar fasilitas sekolah secara detail di website ini.
            </p>
          </div>
        )}
      </section>

      {/* ── CALL TO ACTION ── */}
      <section className="py-20 bg-primary/5 border-y border-primary/10">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Ingin Melihat Langsung?</h2>
          <p className="text-muted-foreground mb-8 text-lg">
            Kami mengundang Anda untuk berkunjung dan melihat langsung sarana pendidikan yang kami miliki. Jadwalkan kunjungan Anda sekarang.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link 
              href={`${base}/contact`} 
              className="px-8 py-3 bg-primary text-white rounded-full font-bold hover:shadow-lg transition-all"
            >
              Hubungi Kami
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
