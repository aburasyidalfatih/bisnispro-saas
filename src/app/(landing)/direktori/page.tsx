import { Metadata } from "next"
import { getSchoolsDirectory } from "./actions"
import { DirectoryFilters } from "./_components/directory-filters"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, ExternalLink, School } from "lucide-react"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Direktori Sekolah - SchoolPro",
  description: "Daftar sekolah yang telah bergabung dan menggunakan layanan digital manajemen sekolah dari SchoolPro.",
}

export default async function DirectoryPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const search = typeof searchParams.q === "string" ? searchParams.q : ""
  const province = typeof searchParams.prov === "string" ? searchParams.prov : ""
  const regency = typeof searchParams.city === "string" ? searchParams.city : ""
  const page = typeof searchParams.page === "string" ? parseInt(searchParams.page, 10) : 1

  const data = await getSchoolsDirectory({ search, province, regency, page })
  
  const getUrl = (s: any) => s.domain ? `https://${s.domain}` : `https://${s.slug}.schoolpro.id`

  // Generate ItemList Schema for SEO
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "itemListElement": data.schools.map((s, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@type": "EducationalOrganization",
        "name": s.name,
        "url": getUrl(s),
        "address": {
          "@type": "PostalAddress",
          "addressRegion": s.province,
          "addressLocality": s.regency,
          "addressCountry": "ID"
        },
        "image": s.logo || "https://schoolpro.id/logo-schoolpro.png"
      }
    }))
  }

  return (
    <main className="min-h-screen bg-muted/30 pt-32 pb-20 px-4">
      {/* Inject JSON-LD Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="max-w-7xl mx-auto space-y-10">
        <header className="text-center space-y-4 max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">Direktori Sekolah</h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Temukan dan jelajahi ratusan sekolah terbaik di seluruh Indonesia yang telah bertransformasi ke era digital bersama SchoolPro.
          </p>
        </header>
        
        <div className="w-full">
          {/* Client-side Filters */}
          <DirectoryFilters 
            initialSearch={search} 
            initialProv={province} 
            initialCity={regency} 
            total={data.total}
          />

          {/* Server-rendered Grid Results */}
          {data.schools.length === 0 ? (
            <div className="text-center py-20 bg-white/50 rounded-3xl border border-dashed shadow-sm">
              <School className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground">Tidak ada sekolah ditemukan</h3>
              <p className="text-muted-foreground">Coba sesuaikan filter pencarian Anda.</p>
            </div>
          ) : (
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {data.schools.map(s => (
                <article key={s.id}>
                  <Card className="group overflow-hidden rounded-2xl border-0 shadow-sm bg-white hover:shadow-xl transition-all duration-300 relative h-full">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    
                    <CardContent className="p-6 relative z-10 flex flex-col h-full">
                      <div className="flex items-start justify-between mb-4 gap-3">
                        <div className="h-12 w-12 rounded-xl bg-muted shrink-0 overflow-hidden border flex items-center justify-center">
                          {s.logo ? (
                            <img src={s.logo} alt={s.name} className="h-full w-full object-cover" />
                          ) : (
                            <span className="text-lg font-bold text-muted-foreground">{s.name.substring(0, 1)}</span>
                          )}
                        </div>
                        <Badge variant="secondary" className="text-[10px] bg-primary/10 text-primary border-0 font-medium">Mitra SchoolPro</Badge>
                      </div>
                      
                      <h2 className="font-bold text-lg leading-tight mb-2 line-clamp-2">{s.name}</h2>
                      
                      <div className="flex items-start gap-1.5 text-xs text-muted-foreground mb-6 line-clamp-2">
                        <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                        <span>{[s.regency, s.province].filter(Boolean).join(", ") || "Indonesia"}</span>
                      </div>
                      
                      <div className="mt-auto pt-4 border-t">
                        <a 
                          href={getUrl(s)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center w-full py-2.5 rounded-xl bg-muted/50 hover:bg-primary hover:text-white text-sm font-medium transition-colors gap-2"
                        >
                          Kunjungi Website <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </div>
                    </CardContent>
                  </Card>
                </article>
              ))}
            </section>
          )}

          {/* Server-rendered Pagination Links */}
          {data.totalPages > 1 && (
            <nav className="flex items-center justify-center gap-2 mt-12" aria-label="Pagination">
              {page > 1 ? (
                <Link 
                  href={`/direktori?q=${encodeURIComponent(search)}&prov=${encodeURIComponent(province)}&city=${encodeURIComponent(regency)}&page=${page - 1}`}
                  className="px-4 py-2 text-sm font-medium border rounded-xl bg-white hover:bg-muted transition-colors"
                >
                  Sebelumnya
                </Link>
              ) : (
                <span className="px-4 py-2 text-sm font-medium border rounded-xl opacity-50 cursor-not-allowed">Sebelumnya</span>
              )}
              
              <span className="text-sm font-medium px-4">Halaman {page} dari {data.totalPages}</span>
              
              {page < data.totalPages ? (
                <Link 
                  href={`/direktori?q=${encodeURIComponent(search)}&prov=${encodeURIComponent(province)}&city=${encodeURIComponent(regency)}&page=${page + 1}`}
                  className="px-4 py-2 text-sm font-medium border rounded-xl bg-white hover:bg-muted transition-colors"
                >
                  Selanjutnya
                </Link>
              ) : (
                <span className="px-4 py-2 text-sm font-medium border rounded-xl opacity-50 cursor-not-allowed">Selanjutnya</span>
              )}
            </nav>
          )}
        </div>
      </div>
    </main>
  )
}
