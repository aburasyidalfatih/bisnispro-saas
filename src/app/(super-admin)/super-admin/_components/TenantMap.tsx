"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MapPin, Building2, FileText } from "lucide-react"
import dynamic from "next/dynamic"

// Lazy load map to avoid SSR issues with Leaflet
const MapContent = dynamic(() => import("./MapContent"), { ssr: false, loading: () => <div className="h-[500px] rounded-xl bg-muted/30 animate-pulse flex items-center justify-center text-muted-foreground">Memuat peta...</div> })

interface MapPoint {
  lat: number
  lng: number
  name: string
  type: "tenant" | "application"
  slug?: string
}

export function TenantMap() {
  const [points, setPoints] = useState<MapPoint[]>([])
  const [totals, setTotals] = useState({ tenants: 0, applications: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/super-admin/map-data")
      .then(r => r.json())
      .then(data => {
        setPoints(data.points || [])
        setTotals({ tenants: data.totalTenants || 0, applications: data.totalApplications || 0 })
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const tenantCount = points.filter(p => p.type === "tenant").length
  const appCount = points.filter(p => p.type === "application").length

  return (
    <Card className="glass border-0">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" /> Peta Sebaran Sekolah
          </CardTitle>
          <div className="flex gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-emerald-500" />
              <span className="text-muted-foreground">Sekolah Aktif ({tenantCount})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-amber-500" />
              <span className="text-muted-foreground">Pengajuan ({appCount})</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0 pb-4 px-4">
        {loading ? (
          <div className="h-[500px] rounded-xl bg-muted/30 animate-pulse" />
        ) : (
          <MapContent points={points} />
        )}
      </CardContent>
    </Card>
  )
}
