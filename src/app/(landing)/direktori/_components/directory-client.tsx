"use client"

import { useState, useEffect } from "react"
import { getSchoolsDirectory } from "../actions"
import { RegionSelector } from "@/components/ui/region-selector"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, MapPin, ExternalLink, School, Loader2 } from "lucide-react"

interface School {
  id: string
  name: string
  slug: string
  domain: string | null
  logo: string | null
  province: string
  regency: string
}

export function DirectoryClient({ initialData }: { initialData: any }) {
  const [schools, setSchools] = useState<School[]>(initialData?.schools || [])
  const [total, setTotal] = useState(initialData?.total || 0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(initialData?.totalPages || 1)
  
  const [search, setSearch] = useState("")
  const [province, setProvince] = useState("")
  const [regency, setRegency] = useState("")
  const [loading, setLoading] = useState(false)

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSchools(1)
    }, 500)
    return () => clearTimeout(timer)
  }, [search, province, regency])

  const fetchSchools = async (pageNum: number) => {
    setLoading(true)
    const res = await getSchoolsDirectory({ search, province, regency, page: pageNum })
    setSchools(res.schools)
    setTotal(res.total)
    setTotalPages(res.totalPages)
    setPage(pageNum)
    setLoading(false)
  }

  const getUrl = (s: School) => {
    return s.domain ? `https://${s.domain}` : `https://${s.slug}.schoolpro.id`
  }

  return (
    <div className="w-full">
      {/* Filters */}
      <div className="bg-white/50 dark:bg-black/20 backdrop-blur-md p-6 rounded-3xl border shadow-sm mb-10 space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Cari Nama Sekolah</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Contoh: SMPN 1 Jakarta..." 
                className="pl-9 rounded-xl h-11 bg-background"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div>
            <RegionSelector 
              province={province} 
              regency={regency}
              onProvinceChange={(p) => { setProvince(p); setRegency(""); }}
              onRegencyChange={setRegency}
            />
          </div>
        </div>
        
        <div className="flex items-center justify-between pt-2 border-t">
          <p className="text-sm text-muted-foreground">
            Menampilkan {loading ? <Loader2 className="inline h-3 w-3 animate-spin mx-1" /> : <span className="font-semibold text-foreground">{total}</span>} sekolah
          </p>
          {(search || province) && (
            <Button variant="ghost" size="sm" onClick={() => { setSearch(""); setProvince(""); setRegency(""); }} className="text-muted-foreground hover:text-foreground">
              Reset Filter
            </Button>
          )}
        </div>
      </div>

      {/* Grid Results */}
      {schools.length === 0 && !loading ? (
        <div className="text-center py-20 bg-muted/30 rounded-3xl border border-dashed">
          <School className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground">Tidak ada sekolah ditemukan</h3>
          <p className="text-muted-foreground">Coba sesuaikan filter pencarian Anda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {schools.map(s => (
            <Card key={s.id} className="group overflow-hidden rounded-2xl border-0 shadow-sm bg-white hover:shadow-xl transition-all duration-300 relative">
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
                
                <h3 className="font-bold text-lg leading-tight mb-2 line-clamp-2">{s.name}</h3>
                
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
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-12">
          <Button variant="outline" size="sm" onClick={() => fetchSchools(page - 1)} disabled={page === 1 || loading} className="rounded-xl">Sebelumnya</Button>
          <span className="text-sm font-medium px-4">Halaman {page} dari {totalPages}</span>
          <Button variant="outline" size="sm" onClick={() => fetchSchools(page + 1)} disabled={page === totalPages || loading} className="rounded-xl">Selanjutnya</Button>
        </div>
      )}
    </div>
  )
}
