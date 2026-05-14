"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Trophy, Medal, Star, TrendingUp, Search, Users, FileText, ArrowLeft } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import Image from "next/image"

interface LeaderboardEntry {
  id: string
  rank: number
  totalScore: number
  contentScore: number
  trafficScore: number
  tenant: {
    id: string
    name: string
    logo: string | null
    slug: string
  }
}

export default function LeaderboardPage() {
  const { data: session } = useSession()
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  const myTenantId = session?.user?.tenants?.[0]?.id

  useEffect(() => {
    fetch("/api/public/leaderboard")
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setEntries(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const filteredEntries = entries.filter(e => e.tenant?.name?.toLowerCase().includes(search.toLowerCase()))

  const myRankEntry = entries.find(e => e.tenant.id === myTenantId)

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-12 w-48 bg-muted rounded-lg" />
        <div className="h-32 bg-muted rounded-2xl" />
        {[1,2,3,4,5].map(i => <div key={i} className="h-20 bg-muted rounded-xl" />)}
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link href="/admin/website" className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-3xl font-black tracking-tight flex items-center gap-2">
              <Trophy className="h-8 w-8 text-yellow-500" /> Papan Peringkat Nasional {new Date().getFullYear()}
            </h1>
          </div>
          <p className="text-muted-foreground">Kompetisi website sekolah paling aktif se-Indonesia.</p>
        </div>
      </div>

      {myRankEntry && (
        <Card className="bg-gradient-to-r from-indigo-500 to-purple-600 border-0 text-white overflow-hidden relative shadow-lg">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Trophy className="h-48 w-48" />
          </div>
          <CardContent className="p-8 relative z-10 flex flex-col sm:flex-row items-center gap-8">
            <div className="text-center bg-white/10 p-6 rounded-2xl backdrop-blur-md border border-white/20">
              <p className="text-indigo-100 font-medium mb-1">Peringkat Anda</p>
              <div className="text-5xl font-black tracking-tighter">#{myRankEntry.rank}</div>
              <p className="text-sm mt-2 font-bold text-yellow-300">{myRankEntry.totalScore} Pts</p>
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-2xl font-bold mb-2">{myRankEntry.tenant.name}</h2>
              <p className="text-indigo-100 mb-4 max-w-lg">
                Tingkatkan peringkat Anda dengan rajin memposting berita, melengkapi galeri, dan mengundang pengunjung ke website sekolah dengan membagikan postingan website Anda !
              </p>
              <div className="flex flex-wrap justify-center sm:justify-start gap-4">
                <div className="bg-black/20 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4" /> Skor Konten: {myRankEntry.contentScore}
                </div>
                <div className="bg-black/20 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
                  <Users className="h-4 w-4" /> Skor Trafik: {myRankEntry.trafficScore}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center gap-4 bg-card p-2 rounded-2xl border shadow-sm">
        <Search className="h-5 w-5 text-muted-foreground ml-3" />
        <Input 
          placeholder="Cari nama sekolah..." 
          className="border-0 shadow-none focus-visible:ring-0 text-base"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="space-y-3">
        {filteredEntries.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">Belum ada data peringkat.</div>
        ) : (
          filteredEntries.map((entry, idx) => {
            const isTop3 = entry.rank <= 3
            const isMe = entry.tenant.id === myTenantId
            
            return (
              <div key={entry.id} className={`flex items-center gap-4 p-4 rounded-2xl transition-all ${
                isMe ? "bg-indigo-50 border-2 border-indigo-200 shadow-sm" : "bg-card border hover:shadow-md"
              }`}>
                {/* Rank Badge */}
                <div className={`w-12 h-12 flex items-center justify-center rounded-xl font-black text-lg ${
                  entry.rank === 1 ? "bg-yellow-100 text-yellow-700" :
                  entry.rank === 2 ? "bg-slate-100 text-slate-700" :
                  entry.rank === 3 ? "bg-orange-100 text-orange-700" :
                  "bg-muted text-muted-foreground"
                }`}>
                  {entry.rank === 1 ? <Trophy className="h-6 w-6" /> :
                   entry.rank === 2 ? <Medal className="h-6 w-6" /> :
                   entry.rank === 3 ? <Medal className="h-6 w-6" /> :
                   `#${entry.rank}`}
                </div>

                {/* Logo */}
                <div className="w-12 h-12 rounded-full bg-slate-100 border overflow-hidden flex-shrink-0 flex items-center justify-center">
                  {entry.tenant.logo ? (
                    <img src={entry.tenant.logo} alt={entry.tenant.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-slate-400 text-xs font-bold">{entry.tenant.name.substring(0, 2).toUpperCase()}</div>
                  )}
                </div>

                {/* School Name */}
                <div className="flex-1 min-w-0">
                  <h3 className={`font-bold truncate ${isMe ? "text-indigo-900" : ""}`}>
                    {entry.tenant.name}
                    {isMe && <span className="ml-2 text-[10px] bg-indigo-600 text-white px-2 py-0.5 rounded-full align-middle">ANDA</span>}
                  </h3>
                  <a href={`http://${entry.tenant.slug}.schoolpro.id`} target="_blank" rel="noopener" className="text-xs text-muted-foreground hover:underline truncate block">
                    {entry.tenant.slug}.schoolpro.id
                  </a>
                </div>

                {/* Score */}
                <div className="text-right flex flex-col items-end gap-1">
                  <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg">
                    <Star className={`h-4 w-4 ${isTop3 ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground"}`} />
                    <span className="font-black text-lg">{entry.totalScore.toLocaleString("id-ID")}</span>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
