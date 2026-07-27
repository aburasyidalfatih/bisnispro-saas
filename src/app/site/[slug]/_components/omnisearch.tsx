"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Search, FileText, Calendar, Megaphone, Building2, Activity, Trophy, BookOpen, Users, Loader2 } from "lucide-react"
import { normalizeImageUrl } from "@/lib/utils"
import Image from "next/image"

interface SearchResult {
  id: string
  title: string
  type: string
  url: string
  excerpt?: string
  imageUrl?: string
}

export function Omnisearch({ tenantId, basePath }: { tenantId: string; basePath: string }) {
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")
  const [results, setResults] = React.useState<SearchResult[]>([])
  const [loading, setLoading] = React.useState(false)
  const router = useRouter()

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  // Listen for a custom event so the Navbar button can open it without Context API overhead
  React.useEffect(() => {
    const handleOpen = () => setOpen(true)
    window.addEventListener("open-omnisearch", handleOpen)
    return () => window.removeEventListener("open-omnisearch", handleOpen)
  }, [])

  React.useEffect(() => {
    if (!open) {
      setQuery("")
      setResults([])
    }
  }, [open])

  React.useEffect(() => {
    if (!query.trim()) {
      setResults([])
      return
    }

    const delayDebounceFn = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/public/search?tenantId=${tenantId}&q=${encodeURIComponent(query)}`)
        const data = await res.json()
        if (data.results) {
          setResults(data.results)
        }
      } catch (err) {
        console.error("Search failed", err)
      } finally {
        setLoading(false)
      }
    }, 400) // 400ms debounce

    return () => clearTimeout(delayDebounceFn)
  }, [query, tenantId])

  const onSelect = (url: string) => {
    setOpen(false)
    const finalUrl = (basePath + url).replace(/\/\//g, '/')
    router.push(finalUrl)
  }

  const getIcon = (type: string) => {
    switch (type) {
      case "BERITA": return <FileText className="h-4 w-4 text-blue-500" />
      case "PENGUMUMAN": return <Megaphone className="h-4 w-4 text-rose-500" />
      case "AGENDA": return <Calendar className="h-4 w-4 text-orange-500" />
      case "FASILITAS": return <Building2 className="h-4 w-4 text-emerald-500" />
      case "EKSTRAKURIKULER": return <Activity className="h-4 w-4 text-indigo-500" />
      case "PRESTASI": return <Trophy className="h-4 w-4 text-amber-500" />
      case "PROGRAM": return <BookOpen className="h-4 w-4 text-violet-500" />
      case "GTK": return <Users className="h-4 w-4 text-teal-500" />
      default: return <FileText className="h-4 w-4 text-slate-500" />
    }
  }

  const groupedResults = results.reduce((acc, item) => {
    if (!acc[item.type]) acc[item.type] = []
    acc[item.type].push(item)
    return acc
  }, {} as Record<string, SearchResult[]>)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden gap-0 bg-background/95 backdrop-blur-xl border-border/50 shadow-2xl rounded-2xl">
        <div className="flex items-center px-4 py-3 border-b border-border/50 bg-muted/20">
          <Search className="mr-3 h-5 w-5 text-muted-foreground shrink-0" />
          <input 
            id="tenant-omnisearch"
            aria-label="Cari konten website"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari apa saja... (Berita, Tim, Kantor/Lokasi)"
            className="flex h-10 w-full rounded-md bg-transparent text-base md:text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 text-foreground"
            autoFocus
          />
          {loading && <Loader2 className="ml-3 h-5 w-5 animate-spin text-muted-foreground shrink-0" />}
          <div className="ml-3 hidden md:flex items-center gap-1 shrink-0">
            <kbd className="inline-flex h-5 items-center rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">ESC</kbd>
          </div>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-muted">
          {!query.trim() && (
            <div className="py-14 text-center text-sm text-muted-foreground">
              <Search className="h-10 w-10 mx-auto mb-3 opacity-20" />
              <p>Mulai mengetik untuk mencari informasi.</p>
            </div>
          )}

          {query.trim() && !loading && results.length === 0 && (
            <div className="py-14 text-center text-sm text-muted-foreground">
              <p>Tidak ada hasil untuk <strong>"{query}"</strong></p>
            </div>
          )}

          {Object.entries(groupedResults).map(([type, items]) => (
            <div key={type} className="mb-4 last:mb-0">
              <div className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                {type}
              </div>
              <div className="space-y-1">
                {items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => onSelect(item.url)}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-primary/5 hover:text-primary transition-colors text-left group"
                  >
                    <div className="h-10 w-10 shrink-0 rounded-lg bg-muted flex items-center justify-center overflow-hidden border border-border/50 relative">
                      {item.imageUrl ? (
                        <Image 
                          src={normalizeImageUrl(item.imageUrl) || item.imageUrl} 
                          alt={item.title} 
                          fill 
                          className="object-cover" 
                        />
                      ) : (
                        getIcon(item.type)
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground group-hover:text-primary truncate">{item.title}</p>
                      {item.excerpt && (
                        <p className="text-xs text-muted-foreground truncate opacity-80">{item.excerpt}</p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
