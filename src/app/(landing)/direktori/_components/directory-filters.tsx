"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { RegionSelector } from "@/components/ui/region-selector"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search } from "lucide-react"

export function DirectoryFilters({ 
  initialSearch, 
  initialProv, 
  initialCity, 
  total 
}: { 
  initialSearch: string
  initialProv: string
  initialCity: string
  total: number 
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [search, setSearch] = useState(initialSearch)
  const [province, setProvince] = useState(initialProv)
  const [regency, setRegency] = useState(initialCity)

  // Update URL function
  const updateUrl = useCallback((q: string, prov: string, city: string) => {
    const params = new URLSearchParams(searchParams.toString())
    
    if (q) params.set("q", q)
    else params.delete("q")
    
    if (prov) params.set("prov", prov)
    else params.delete("prov")
    
    if (city) params.set("city", city)
    else params.delete("city")
    
    // Reset to page 1 whenever filters change
    params.set("page", "1")
    
    router.push(`?${params.toString()}`, { scroll: false })
  }, [searchParams, router])

  // Debounced effect for search input
  useEffect(() => {
    const timer = setTimeout(() => {
      // Only push if values actually changed from URL state
      if (search !== initialSearch || province !== initialProv || regency !== initialCity) {
        updateUrl(search, province, regency)
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [search, province, regency, initialSearch, initialProv, initialCity, updateUrl])

  return (
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
          Menampilkan <span className="font-semibold text-foreground">{total}</span> sekolah
        </p>
        {(search || province) && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => { 
              setSearch("")
              setProvince("")
              setRegency("")
              router.push("?", { scroll: false }) 
            }} 
            className="text-muted-foreground hover:text-foreground"
          >
            Reset Filter
          </Button>
        )}
      </div>
    </div>
  )
}
