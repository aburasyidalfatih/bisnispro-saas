"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Trophy, ArrowLeft, TrendingUp, Users, Target, Crown, Award, Medal, Info } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface LeaderboardItem {
  id: string
  name: string
  email: string
  avatar: string | null
  referralCode: string
  totalApplications: number
  free: number
  lite: number
  pro: number
  score: number
  rank: number
}

interface AffiliateLeaderboardClientProps {
  backHref?: string
}

function ScoreInfoTooltip({ iconClass }: { iconClass: string }) {
  const [open, setOpen] = useState(false)
  
  return (
    <div 
      className="relative inline-flex items-center cursor-pointer"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        setOpen(!open)
      }}
    >
      <Info className={iconClass} />
      {open && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 p-2 bg-slate-800 text-white text-[10px] rounded-lg shadow-xl z-50 text-center leading-tight font-normal">
          Sistem Penilaian: Pengajuan (0.5), Free (1), Lite (3), Pro (5)
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-[5px] border-transparent border-t-slate-800"></div>
        </div>
      )}
    </div>
  )
}

export function AffiliateLeaderboardClient({ backHref }: AffiliateLeaderboardClientProps) {
  const [data, setData] = useState<LeaderboardItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("all") // weekly, monthly, yearly, all

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/super-admin/affiliates/leaderboard?filter=${filter}`)
      const result = await res.json()
      setData(result)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => {
    fetchLeaderboard()
  }, [fetchLeaderboard])

  const top3 = data.slice(0, 3)
  const others = data.slice(3)

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4">
        <div className="flex items-center gap-3">
          {backHref && (
            <Link href={backHref}>
              <Button variant="ghost" size="icon" className="rounded-xl h-10 w-10 shrink-0">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
          )}
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-amber-500 to-orange-600 bg-clip-text text-transparent flex items-center gap-2">
              <Trophy className="h-7 w-7 text-amber-500" /> Leaderboard Afiliasi
            </h1>
            <p className="text-muted-foreground mt-1">Peringkat mitra terbaik dalam mengajak sekolah bergabung.</p>
          </div>
        </div>
        
        <div className="flex bg-muted/50 p-1 rounded-xl w-full sm:w-auto overflow-x-auto">
          {[
            { id: "weekly", label: "Minggu Ini" },
            { id: "monthly", label: "Bulan Ini" },
            { id: "yearly", label: "Tahun Ini" },
            { id: "all", label: "Sepanjang Waktu" }
          ].map((f) => (
            <Button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={cn(
                "px-4 py-2 text-sm font-medium rounded-lg transition-all whitespace-nowrap",
                filter === f.id ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {f.label}
            </Button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid gap-6 md:grid-cols-3">
          {[1,2,3].map(i => <div key={i} className="h-64 bg-muted/50 animate-pulse rounded-2xl" />)}
        </div>
      ) : data.length === 0 ? (
        <div className="text-center py-20 border rounded-2xl border-dashed">
          <Trophy className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">Belum ada data afiliasi di periode ini.</p>
        </div>
      ) : (
        <>
          {/* Top 3 Section */}
          {top3.length > 0 && (
            <div className="grid gap-6 md:grid-cols-3 relative items-end">
              {/* Rank 2 - Silver */}
              {top3[1] && (
                <Card className="glass border-slate-200/50 bg-slate-50/50 order-2 md:order-1 relative overflow-hidden h-[280px] flex flex-col justify-end transition-transform hover:-translate-y-2">
                  <div className="absolute top-0 right-0 bg-slate-200 text-slate-700 px-3 py-1 rounded-bl-2xl font-bold flex items-center gap-1 shadow-sm">
                    <Award className="h-4 w-4" /> #2
                  </div>
                  <CardContent className="pt-6 text-center space-y-4">
                    <div className="h-20 w-20 mx-auto rounded-full bg-slate-200 border-4 border-white shadow-md flex items-center justify-center overflow-hidden">
                      {top3[1].avatar ? <img src={top3[1].avatar!} className="object-cover h-full w-full" / alt="image" loading="lazy" decoding="async"> : <span className="text-2xl font-bold text-slate-500">{top3[1].name.charAt(0)}</span>}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg line-clamp-1">{top3[1].name}</h3>
                      <p className="text-sm text-muted-foreground font-mono">{top3[1].referralCode}</p>
                    </div>
                    <div className="bg-white/60 p-3 rounded-xl border border-slate-100 shadow-sm flex justify-center">
                      <div className="text-center">
                        <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">Skor <ScoreInfoTooltip iconClass="w-3.5 h-3.5 text-slate-400" /></div>
                        <div className="font-bold text-slate-700 text-xl">{top3[1].score.toFixed(1)}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {/* Rank 1 - Gold */}
              <Card className="glass border-amber-300/50 bg-gradient-to-b from-amber-50/50 to-amber-100/30 order-1 md:order-2 relative overflow-hidden h-[320px] flex flex-col justify-end transition-transform hover:-translate-y-2 ring-1 ring-amber-400/20 shadow-lg shadow-amber-500/10 z-10">
                <div className="absolute top-0 right-0 bg-amber-400 text-amber-900 px-4 py-1.5 rounded-bl-3xl font-bold flex items-center gap-1 shadow-sm">
                  <Crown className="h-5 w-5" /> #1
                </div>
                <CardContent className="pt-6 text-center space-y-4">
                  <div className="h-24 w-24 mx-auto rounded-full bg-amber-100 border-4 border-white shadow-lg flex items-center justify-center overflow-hidden relative">
                    {top3[0].avatar ? <img src={top3[0].avatar!} className="object-cover h-full w-full" / alt="image" loading="lazy" decoding="async"> : <span className="text-3xl font-bold text-amber-600">{top3[0].name.charAt(0)}</span>}
                    <div className="absolute bottom-0 bg-amber-500 text-white text-[10px] w-full text-center font-bold">MVP</div>
                  </div>
                  <div>
                    <h3 className="font-bold text-xl line-clamp-1 text-amber-900">{top3[0].name}</h3>
                    <p className="text-sm text-amber-700/70 font-mono">{top3[0].referralCode}</p>
                  </div>
                  <div className="bg-white/80 p-4 rounded-xl border border-amber-100 shadow-sm flex justify-center">
                    <div className="text-center">
                      <div className="text-xs text-amber-600/70 font-medium flex items-center justify-center gap-1">Total Skor <ScoreInfoTooltip iconClass="w-4 h-4 text-amber-500/70" /></div>
                      <div className="font-black text-3xl text-amber-600">{top3[0].score.toFixed(1)}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Rank 3 - Bronze */}
              {top3[2] && (
                <Card className="glass border-orange-200/50 bg-orange-50/30 order-3 md:order-3 relative overflow-hidden h-[260px] flex flex-col justify-end transition-transform hover:-translate-y-2">
                  <div className="absolute top-0 right-0 bg-orange-300/80 text-orange-900 px-3 py-1 rounded-bl-2xl font-bold flex items-center gap-1 shadow-sm">
                    <Medal className="h-4 w-4" /> #3
                  </div>
                  <CardContent className="pt-6 text-center space-y-4">
                    <div className="h-16 w-16 mx-auto rounded-full bg-orange-100 border-4 border-white shadow-md flex items-center justify-center overflow-hidden">
                      {top3[2].avatar ? <img src={top3[2].avatar!} className="object-cover h-full w-full" / alt="image" loading="lazy" decoding="async"> : <span className="text-xl font-bold text-orange-600">{top3[2].name.charAt(0)}</span>}
                    </div>
                    <div>
                      <h3 className="font-bold text-md line-clamp-1">{top3[2].name}</h3>
                      <p className="text-xs text-muted-foreground font-mono">{top3[2].referralCode}</p>
                    </div>
                    <div className="bg-white/60 p-2 rounded-xl border border-orange-100 shadow-sm flex justify-center">
                      <div className="text-center">
                        <div className="text-[10px] text-muted-foreground flex items-center justify-center gap-1">Skor <ScoreInfoTooltip iconClass="w-3 h-3 text-slate-400" /></div>
                        <div className="font-bold text-orange-700 text-lg">{top3[2].score.toFixed(1)}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Full List */}
          <Card className="glass shadow-sm mt-8">
            <CardHeader className="pb-4">
              <CardTitle>Semua Peringkat</CardTitle>
              <CardDescription>Menampilkan urutan semua afiliator di platform.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-xl border overflow-hidden">
                <Table className="text-sm text-left">
                  <TableHeader className="bg-muted/50 text-xs uppercase text-muted-foreground">
                    <TableRow>
                      <TableHead className="px-4 py-3 font-medium text-center w-16">Peringkat</TableHead>
                      <TableHead className="px-4 py-3 font-medium">Mitra</TableHead>
                      <TableHead className="px-4 py-3 font-medium text-center">
                        <div className="flex flex-col items-center gap-1">
                          <Target className="h-3.5 w-3.5" />
                          <span>Pengajuan</span>
                        </div>
                      </TableHead>
                      <TableHead className="px-4 py-3 font-medium text-center">
                        <div className="flex flex-col items-center gap-1">
                          <Badge variant="outline" className="text-[10px] h-4">FREE</Badge>
                          <span>Aktif</span>
                        </div>
                      </TableHead>
                      <TableHead className="px-4 py-3 font-medium text-center">
                        <div className="flex flex-col items-center gap-1">
                          <Badge className="bg-emerald-500/10 text-emerald-600 border-0 text-[10px] h-4">LITE</Badge>
                          <span>Aktif</span>
                        </div>
                      </TableHead>
                      <TableHead className="px-4 py-3 font-medium text-center">
                        <div className="flex flex-col items-center gap-1">
                          <Badge className="bg-indigo-500/10 text-indigo-600 border-0 text-[10px] h-4">PRO</Badge>
                          <span>Aktif</span>
                        </div>
                      </TableHead>
                      <TableHead className="px-4 py-3 font-medium text-right">Skor Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-border/50">
                    {data.map((item) => (
                      <TableRow key={item.id} className={cn("bg-background/50 hover:bg-muted/50 transition-colors", item.rank <= 3 && "bg-muted/10")}>
                        <TableCell className="px-4 py-3 text-center font-bold text-muted-foreground">
                          {item.rank}
                        </TableCell>
                        <TableCell className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0 overflow-hidden">
                              {item.avatar ? <img src={item.avatar} / alt="image" loading="lazy" decoding="async"> : item.name.charAt(0)}
                            </div>
                            <div>
                              <div className="font-medium text-foreground">{item.name}</div>
                              <div className="text-[10px] text-muted-foreground font-mono">{item.referralCode}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-center font-medium">
                          {item.totalApplications > 0 ? item.totalApplications : <span className="text-muted-foreground/30">-</span>}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-center">
                          {item.free > 0 ? item.free : <span className="text-muted-foreground/30">-</span>}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-center">
                          {item.lite > 0 ? <span className="text-emerald-600 font-bold">{item.lite}</span> : <span className="text-muted-foreground/30">-</span>}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-center">
                          {item.pro > 0 ? <span className="text-indigo-600 font-bold">{item.pro}</span> : <span className="text-muted-foreground/30">-</span>}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-right">
                          <span className="font-bold text-amber-600">{item.score.toFixed(1)}</span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="mt-4 flex gap-4 text-xs text-muted-foreground border-t pt-4">
                <span className="font-medium">Sistem Penilaian:</span>
                <span>Pengajuan: <strong className="text-foreground">0.5 pt</strong></span>
                <span>Tenant Free: <strong className="text-foreground">1 pt</strong></span>
                <span>Tenant Lite: <strong className="text-emerald-600">3 pt</strong></span>
                <span>Tenant Pro: <strong className="text-indigo-600">5 pt</strong></span>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
