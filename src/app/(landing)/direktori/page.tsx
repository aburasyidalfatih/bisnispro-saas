import { Metadata } from "next"
import Script from "next/script"
import Image from "next/image"
import { getBusinessesDirectory } from "./actions"
import { DirectoryFilters } from "./_components/directory-filters"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, ExternalLink, Building2 } from "lucide-react"
import Link from "next/link"
import { formatSocialUrl } from "@/lib/utils"
import { EmptyState } from "@/components/ui/empty-state"

export const metadata: Metadata = {
  title: "Direktori Bisnis Mitra - BisnisPro",
  description: "Jelajahi daftar ratusan bisnis dan perusahaan di seluruh Indonesia yang telah bertransformasi ke era digital dan menggunakan layanan manajemen terpadu dari BisnisPro.",
  alternates: {
    canonical: "/direktori",
  },
  openGraph: {
    title: "Direktori Bisnis Mitra - BisnisPro",
    description: "Jelajahi daftar ratusan bisnis dan perusahaan di seluruh Indonesia yang telah bertransformasi ke era digital dan menggunakan layanan manajemen terpadu dari BisnisPro.",
    url: "/direktori",
    images: ["/logo-bisnispro.png"],
  },
  twitter: {
    title: "Direktori Bisnis Mitra - BisnisPro",
    description: "Jelajahi daftar ratusan bisnis dan perusahaan di seluruh Indonesia yang telah bertransformasi ke era digital dan menggunakan layanan manajemen terpadu dari BisnisPro.",
  }
}

export default async function DirectoryPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const resolvedSearchParams = await searchParams
  const search = typeof resolvedSearchParams.q === "string" ? resolvedSearchParams.q : ""
  const province = typeof resolvedSearchParams.prov === "string" ? resolvedSearchParams.prov : ""
  const regency = typeof resolvedSearchParams.city === "string" ? resolvedSearchParams.city : ""
  const page = typeof resolvedSearchParams.page === "string" ? parseInt(resolvedSearchParams.page, 10) : 1

  const data = await getBusinessesDirectory({ search, province, regency, page })
  
  const getUrl = (s: any) => {
    if (s.customDomain) {
      return `https://${s.customDomain}`
    }
    return `https://${s.slug}.bisnispro.id`
  }

  // Generate ItemList Schema for SEO
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "itemListElement": data.businesses.map((s, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@type": "Organization",
        "name": s.name,
        "url": getUrl(s),
        "address": {
          "@type": "PostalAddress",
          "addressRegion": s.province,
          "addressLocality": s.regency,
          "addressCountry": "ID"
        },
        "image": s.logo || "https://bisnispro.id/logo-bisnispro.png"
      }
    }))
  }

  return (
    <main className="min-h-screen bg-muted/30 pt-12 pb-20 px-4">
      {/* Inject JSON-LD Schema */}
      <Script
        id="directory-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="max-w-7xl mx-auto space-y-10">
        <header className="text-center space-y-4 max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">Direktori Bisnis</h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Temukan dan jelajahi ratusan bisnis terbaik di seluruh Indonesia yang telah bertransformasi ke era digital bersama BisnisPro.
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
          {data.businesses.length === 0 ? (
            <EmptyState 
              icon={Building2} 
              title="Tidak ada bisnis ditemukan" 
              description="Coba sesuaikan filter pencarian Anda."
            />
          ) : (
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {data.businesses.map(s => (
                <article key={s.id}>
                  <Card className="group overflow-hidden rounded-2xl border-0 shadow-sm bg-card hover:shadow-xl transition-all duration-300 relative h-full">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    
                    <CardContent className="p-6 relative z-10 flex flex-col h-full">
                      <div className="flex items-start justify-between mb-4 gap-3">
                        <div className="h-12 w-12 rounded-xl bg-muted shrink-0 overflow-hidden border flex items-center justify-center">
                          {s.logo ? (
                            <Image src={s.logo} alt={s.name} width={48} height={48} className="h-full w-full object-cover" />
                          ) : (
                            <span className="text-lg font-bold text-muted-foreground">{s.name.substring(0, 1)}</span>
                          )}
                        </div>
                        <Badge variant="secondary" className="text-[10px] bg-primary/10 text-primary border-0 font-medium">Mitra BisnisPro</Badge>
                      </div>
                      
                      <h2 className="font-bold text-lg leading-tight mb-1 line-clamp-2">{s.name}</h2>
                      {s.tagline && (
                        <p className="text-sm text-muted-foreground/80 line-clamp-2 mb-2">{s.tagline}</p>
                      )}
                      
                      <div className="flex items-start gap-1.5 text-xs text-muted-foreground mb-4 mt-auto line-clamp-2">
                        <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                        <span>{[s.regency, s.province].filter(Boolean).join(", ") || "Indonesia"}</span>
                      </div>
                      
                      {(s.instagram || s.facebook || s.youtube || s.tiktok) && (
                        <div className="flex items-center justify-center gap-4 mb-4">
                          {s.instagram && (
                            <a href={formatSocialUrl(s.instagram, 'instagram')} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-pink-600 transition-colors">
                              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><circle cx="12" cy="12" r="5"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
                              </svg>
                            </a>
                          )}
                          {s.facebook && (
                            <a href={formatSocialUrl(s.facebook, 'facebook')} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-blue-600 transition-colors">
                              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
                              </svg>
                            </a>
                          )}
                          {s.youtube && (
                            <a href={formatSocialUrl(s.youtube, 'youtube')} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-red-600 transition-colors">
                              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
                                <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
                              </svg>
                            </a>
                          )}
                          {s.tiktok && (
                            <a href={formatSocialUrl(s.tiktok, 'tiktok')} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-slate-900 transition-colors">
                              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                              </svg>
                            </a>
                          )}
                        </div>
                      )}

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
                  className="px-4 py-2 text-sm font-medium border rounded-xl bg-card hover:bg-muted transition-colors"
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
                  className="px-4 py-2 text-sm font-medium border rounded-xl bg-card hover:bg-muted transition-colors"
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
