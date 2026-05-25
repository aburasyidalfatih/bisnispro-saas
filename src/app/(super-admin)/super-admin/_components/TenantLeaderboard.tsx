"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Trophy, Building2, TrendingUp } from "lucide-react"
import Image from "next/image"
import { normalizeImageUrl } from "@/lib/utils"

interface LeaderboardTenant {
  id: string
  name: string
  slug: string
  logo: string | null
  address: string | null
  activity_score: number
  content_score?: number
  activity_points?: number
  rank?: number
}

export function TenantLeaderboard() {
  const [data, setData] = useState<LeaderboardTenant[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/super-admin/leaderboard")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setData(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  return (
    <Card className="glass border-0 shadow-lg relative overflow-hidden h-full flex flex-col">
      <div className="absolute top-0 right-0 h-32 w-32 bg-amber-500/10 blur-3xl rounded-full" />
      <CardHeader className="relative z-10 pb-4 border-b border-border/50">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-600">
            <Trophy className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-lg font-bold">Top Aktivitas Kelola Website</CardTitle>
            <CardDescription className="text-xs">
              Lembaga paling aktif berdasarkan skor keseluruhan
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0 relative z-10 flex-1 overflow-auto">
        {loading ? (
          <div className="p-6 text-center text-sm text-muted-foreground animate-pulse">
            Memuat data leaderboard...
          </div>
        ) : data.length === 0 ? (
          <div className="p-6 text-center text-sm text-muted-foreground">
            Belum ada aktivitas yang tercatat.
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-border/50">
            {data.map((tenant, index) => {
              const city = tenant.address ? tenant.address.split(",").pop()?.trim() : "Indonesia"
              return (
                <div key={tenant.id} className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 hover:bg-muted/30 transition-colors">
                  <div className="flex-shrink-0 w-6 text-center font-bold text-lg">
                    {index === 0 && <span className="text-yellow-500">🥇</span>}
                    {index === 1 && <span className="text-slate-400">🥈</span>}
                    {index === 2 && <span className="text-amber-700">🥉</span>}
                    {index > 2 && <span className="text-muted-foreground text-sm">{index + 1}</span>}
                  </div>
                  
                  <a href={`/site/${tenant.slug}`} target="_blank" rel="noopener noreferrer" className="relative shrink-0 transition-transform hover:scale-105 hover:shadow-md rounded-full h-8 w-8 sm:h-10 sm:w-10">
                    {tenant.logo ? (
                      <>
                        <Image 
                          src={normalizeImageUrl(tenant.logo) || tenant.logo} 
                          alt={tenant.name} 
                          fill 
                          className="rounded-full object-contain border bg-white p-0.5" 
                          
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                            if (fallback) {
                              fallback.style.display = 'flex';
                              fallback.classList.remove('hidden');
                            }
                          }}
                        />
                        <div className="h-10 w-10 rounded-full border bg-muted hidden items-center justify-center shrink-0 absolute inset-0">
                          <Building2 className="h-5 w-5 text-muted-foreground" />
                        </div>
                      </>
                    ) : (
                      <div className="h-10 w-10 rounded-full border bg-muted flex items-center justify-center shrink-0">
                        <Building2 className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                  </a>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate leading-tight">{tenant.name}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{city}</p>
                  </div>

                  <div className="text-right flex flex-col items-end shrink-0">
                    <div className="flex items-center gap-1 text-primary font-bold">
                      {tenant.activity_score}
                      <TrendingUp className="h-3 w-3" />
                    </div>
                    <span className="text-[9px] text-muted-foreground uppercase tracking-wider font-medium">Total Skor</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
