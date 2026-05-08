"use client"

import { use, useEffect, useState, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Save, Loader2, CheckCircle, XCircle, Clock, Minus } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { id as localeId } from "date-fns/locale"
import { cn } from "@/lib/utils"

const STATUS_OPTIONS = [
  { value: "HADIR", label: "Hadir", color: "bg-emerald-500/10 text-emerald-600 border-emerald-300", icon: CheckCircle },
  { value: "IZIN", label: "Izin", color: "bg-blue-500/10 text-blue-600 border-blue-300", icon: Clock },
  { value: "SAKIT", label: "Sakit", color: "bg-amber-500/10 text-amber-600 border-amber-300", icon: Minus },
  { value: "ALPHA", label: "Alpha", color: "bg-red-500/10 text-red-600 border-red-300", icon: XCircle },
]

export default function AttendanceSessionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data: session } = useSession()
  const { toast } = useToast()
  const tenant = session?.user?.tenants?.[0]
  const [sessionData, setSessionData] = useState<any>(null)
  const [records, setRecords] = useState<Record<string, string>>({}) // studentId → status
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const fetch_data = useCallback(async () => {
    if (!tenant) return
    const res = await fetch(`/api/attendance/sessions/${id}?tenantId=${tenant.id}`)
    const data = await res.json()
    setSessionData(data)
    const initialRecords: Record<string, string> = {}
    data.records?.forEach((r: any) => { initialRecords[r.studentId] = r.status })
    setRecords(initialRecords)
    setLoading(false)
  }, [id, tenant])

  useEffect(() => { fetch_data() }, [fetch_data])

  const handleSetAll = (status: string) => {
    setRecords(prev => {
      const updated = { ...prev }
      Object.keys(updated).forEach(k => { updated[k] = status })
      return updated
    })
  }

  const handleSave = async () => {
    if (!tenant) return
    setSaving(true)
    try {
      const recordsArr = Object.entries(records).map(([studentId, status]) => ({ studentId, status }))
      const res = await fetch(`/api/attendance/sessions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId: tenant.id, records: recordsArr }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast({ title: "Absensi berhasil disimpan!" })
    } catch (err: any) {
      toast({ title: "Gagal", description: err.message, variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  // Hitung summary
  const summary = Object.values(records).reduce((acc: Record<string, number>, s) => {
    acc[s] = (acc[s] || 0) + 1
    return acc
  }, {})

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
  if (!sessionData) return <div className="py-20 text-center text-muted-foreground">Sesi tidak ditemukan.</div>

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3">
        <Link href="/admin/attendance/sessions">
          <Button variant="ghost" size="icon" className="rounded-xl"><ArrowLeft className="h-5 w-5" /></Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold">
            Absensi {sessionData.classroom?.name}
          </h1>
          <p className="text-sm text-muted-foreground">
            {format(new Date(sessionData.date), "EEEE, d MMMM yyyy", { locale: localeId })}
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="rounded-xl gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Simpan
        </Button>
      </div>

      {/* Summary chips */}
      <div className="flex flex-wrap gap-2">
        {STATUS_OPTIONS.map(opt => (
          <Badge
            key={opt.value}
            className={cn(opt.color, "border px-3 py-1.5 text-xs font-semibold")}
          >
            {opt.label}: {summary[opt.value] || 0}
          </Badge>
        ))}
      </div>

      {/* Bulk set */}
      <Card className="glass border-0">
        <CardContent className="p-4 flex flex-wrap gap-2 items-center">
          <span className="text-sm text-muted-foreground font-medium mr-2">Set Semua:</span>
          {STATUS_OPTIONS.map(opt => (
            <Button key={opt.value} variant="outline" size="sm" className="rounded-xl text-xs h-8" onClick={() => handleSetAll(opt.value)}>
              {opt.label} Semua
            </Button>
          ))}
        </CardContent>
      </Card>

      {/* Student list */}
      <div className="space-y-2">
        {sessionData.records?.map((rec: any, idx: number) => {
          const currentStatus = records[rec.studentId] || "HADIR"
          return (
            <Card key={rec.studentId} className="glass border-0 shadow-sm">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 font-bold text-primary text-sm">
                  {idx + 1}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm">{rec.student?.name}</p>
                  <p className="text-xs text-muted-foreground">{rec.student?.nis}</p>
                </div>
                <div className="flex gap-1.5 flex-wrap justify-end">
                  {STATUS_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setRecords(prev => ({ ...prev, [rec.studentId]: opt.value }))}
                      className={cn(
                        "h-8 px-3 rounded-lg text-xs font-semibold border transition-all",
                        currentStatus === opt.value
                          ? `${opt.color} scale-105 shadow-sm`
                          : "bg-muted/40 text-muted-foreground border-border hover:bg-muted"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {sessionData.records?.length > 5 && (
        <Button className="w-full rounded-xl" onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Simpan Absensi
        </Button>
      )}
    </div>
  )
}
