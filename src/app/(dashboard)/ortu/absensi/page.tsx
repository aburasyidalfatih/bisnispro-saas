"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  CalendarCheck, CheckCircle, XCircle, Clock, Minus,
  Loader2, ChevronLeft, ChevronRight, Users
} from "lucide-react"
import { format, subDays, addDays } from "date-fns"
import { id as localeId } from "date-fns/locale"
import { cn } from "@/lib/utils"

const STATUS = {
  HADIR: { label: "Hadir", color: "bg-emerald-500/10 text-emerald-600 border-emerald-300 border", icon: CheckCircle },
  IZIN: { label: "Izin", color: "bg-blue-500/10 text-blue-600 border-blue-300 border", icon: Clock },
  SAKIT: { label: "Sakit", color: "bg-amber-500/10 text-amber-600 border-amber-300 border", icon: Minus },
  ALPHA: { label: "Alpha", color: "bg-red-500/10 text-red-600 border-red-300 border", icon: XCircle },
}

export default function OrtuAbsensiPage() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const tenant = session?.user?.tenants?.[0]
  const [children, setChildren] = useState<any[]>([])
  const [selectedChild, setSelectedChild] = useState("")
  const [records, setRecords] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [dateOffset, setDateOffset] = useState(0) // 0 = today, -7 = last 7 days
  const [summary, setSummary] = useState({ HADIR: 0, IZIN: 0, SAKIT: 0, ALPHA: 0 })

  useEffect(() => {
    if (!tenant) return
    fetch(`/api/ortu/children?tenantId=${tenant.id}`)
      .then(r => r.json())
      .then(data => {
        setChildren(data || [])
        if (data?.length > 0) setSelectedChild(data[0].id)
      })
      .catch(console.error)
  }, [tenant])

  useEffect(() => {
    if (!tenant || !selectedChild) return
    setLoading(true)
    const fromDate = format(subDays(new Date(), Math.abs(dateOffset) + 29), "yyyy-MM-dd")
    fetch(`/api/attendance/records?tenantId=${tenant.id}&studentId=${selectedChild}&from=${fromDate}`)
      .then(r => r.json())
      .then(data => {
        setRecords(data || [])
        const s = { HADIR: 0, IZIN: 0, SAKIT: 0, ALPHA: 0 }
        data?.forEach((r: any) => { if (s.hasOwnProperty(r.status)) s[r.status as keyof typeof s]++ })
        setSummary(s)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [tenant, selectedChild])

  const selectedChildData = children.find(c => c.id === selectedChild)
  const totalDays = Object.values(summary).reduce((a, b) => a + b, 0)
  const hadirPct = totalDays ? Math.round((summary.HADIR / totalDays) * 100) : 0

  return (
    <div className="pb-12 space-y-5">
      {/* Header */}
      <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-b-[2.5rem] pt-8 pb-16 px-6">
        <h1 className="text-white font-bold text-xl mb-1">Kehadiran Siswa</h1>
        <p className="text-white/70 text-sm">Pantau rekap absensi anak Anda.</p>
      </div>

      <div className="px-5 -mt-10 space-y-4">
        {/* Pilih Anak */}
        {children.length > 1 && (
          <Select value={selectedChild} onValueChange={setSelectedChild}>
            <SelectTrigger className="rounded-xl glass border-0">
              <Users className="h-4 w-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Pilih anak..." />
            </SelectTrigger>
            <SelectContent>
              {children.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.name} — {c.classroom?.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Summary Bulat */}
        {selectedChildData && (
          <Card className="glass border-0 shadow-lg overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-center gap-4 mb-5">
                <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center font-black text-emerald-600 text-2xl">
                  {selectedChildData.name?.charAt(0)}
                </div>
                <div>
                  <p className="font-bold">{selectedChildData.name}</p>
                  <p className="text-xs text-muted-foreground">{selectedChildData.classroom?.name || "—"} · 30 hari terakhir</p>
                </div>
              </div>

              {/* Donut summary */}
              <div className="flex items-center justify-between mb-4">
                {Object.entries(STATUS).map(([key, cfg]) => (
                  <div key={key} className="text-center">
                    <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center mx-auto mb-1", cfg.color.split(" ").slice(0, 2).join(" "))}>
                      <p className="font-black text-lg">{summary[key as keyof typeof summary]}</p>
                    </div>
                    <p className="text-[10px] text-muted-foreground font-medium">{cfg.label}</p>
                  </div>
                ))}
              </div>

              {/* Progress bar kehadiran */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Tingkat Kehadiran</span>
                  <span className="font-bold text-emerald-600">{hadirPct}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                  <div
                    className={cn("h-full rounded-full transition-all duration-700", hadirPct >= 80 ? "bg-emerald-500" : hadirPct >= 60 ? "bg-amber-500" : "bg-red-500")}
                    style={{ width: `${hadirPct}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">{summary.HADIR} dari {totalDays} hari tercatat hadir</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Rekap Harian */}
        <div>
          <p className="font-bold text-sm mb-3">Detail Per Hari (30 Hari Terakhir)</p>
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : records.length === 0 ? (
            <Card className="glass border-0">
              <CardContent className="py-12 text-center text-muted-foreground text-sm">
                <CalendarCheck className="h-10 w-10 mx-auto mb-3 opacity-40" />
                <p>Belum ada data absensi yang tercatat.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {records.map((rec: any) => {
                const cfg = STATUS[rec.status as keyof typeof STATUS] || STATUS.ALPHA
                const Icon = cfg.icon
                return (
                  <Card key={rec.id} className="glass border-0 shadow-sm">
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shrink-0", cfg.color.split(" ").slice(0, 2).join(" "))}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-sm">
                          {format(new Date(rec.session?.date || rec.createdAt), "EEEE, d MMMM yyyy", { locale: localeId })}
                        </p>
                        {rec.notes && <p className="text-xs text-muted-foreground italic">"{rec.notes}"</p>}
                      </div>
                      <Badge className={cn(cfg.color, "text-[10px] shrink-0")}>{cfg.label}</Badge>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
