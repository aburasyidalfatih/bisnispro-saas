"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileCheck, CheckCircle, XCircle, Clock, Loader2, AlertTriangle } from "lucide-react"
import { format } from "date-fns"
import { id as localeId } from "date-fns/locale"

export default function PermitsPage() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const tenant = session?.user?.tenants?.[0]
  const [permits, setPermits] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState("PENDING")

  const fetchPermits = async () => {
    if (!tenant) return
    setLoading(true)
    const res = await fetch(`/api/attendance/permits?tenantId=${tenant.id}&status=${filterStatus}`)
    setPermits(await res.json())
    setLoading(false)
  }

  useEffect(() => { fetchPermits() }, [tenant, filterStatus])

  const handleAction = async (id: string, action: "APPROVED" | "REJECTED") => {
    if (!tenant) return
    setProcessing(id)
    try {
      const res = await fetch(`/api/attendance/permits/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId: tenant.id, action }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast({ title: data.message })
      fetchPermits()
    } catch (err: any) {
      toast({ title: "Gagal", description: err.message, variant: "destructive" })
    } finally {
      setProcessing(null)
    }
  }

  const typeCfg: Record<string, { color: string; label: string }> = {
    IZIN: { color: "bg-blue-500/10 text-blue-600 border-blue-200", label: "Izin" },
    SAKIT: { color: "bg-amber-500/10 text-amber-600 border-amber-200", label: "Sakit" },
  }

  const statusCfg: Record<string, { color: string; label: string }> = {
    PENDING: { color: "bg-amber-500/10 text-amber-600 border-amber-200", label: "Menunggu" },
    APPROVED: { color: "bg-emerald-500/10 text-emerald-600 border-emerald-200", label: "Disetujui" },
    REJECTED: { color: "bg-red-500/10 text-red-600 border-red-200", label: "Ditolak" },
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Pengajuan Izin / Sakit</h1>
          <p className="text-sm text-muted-foreground">Tinjau dan setujui pengajuan dari orang tua.</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {["PENDING", "APPROVED", "REJECTED"].map(s => (
          <Button
            key={s}
            variant={filterStatus === s ? "default" : "outline"}
            size="sm"
            className="rounded-xl"
            onClick={() => setFilterStatus(s)}
          >
            {statusCfg[s]?.label}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      ) : permits.length === 0 ? (
        <Card className="glass border-0">
          <CardContent className="py-16 text-center text-muted-foreground">
            <FileCheck className="h-12 w-12 mx-auto mb-4 opacity-40" />
            <p>Tidak ada pengajuan {statusCfg[filterStatus]?.label.toLowerCase()}.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {permits.map(p => (
            <Card key={p.id} className="glass border-0 shadow-sm">
              <CardContent className="p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="h-11 w-11 rounded-xl bg-muted flex items-center justify-center shrink-0">
                      {p.type === "SAKIT" ? <AlertTriangle className="h-5 w-5 text-amber-600" /> : <Clock className="h-5 w-5 text-blue-600" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <p className="font-bold">{p.student?.name}</p>
                        <Badge className={`${typeCfg[p.type]?.color} border text-[10px]`}>{typeCfg[p.type]?.label}</Badge>
                        <Badge className={`${statusCfg[p.status]?.color} border text-[10px]`}>{statusCfg[p.status]?.label}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{p.student?.classroom?.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(p.startDate), "d MMM", { locale: localeId })}
                        {p.startDate !== p.endDate && ` — ${format(new Date(p.endDate), "d MMM yyyy", { locale: localeId })}`}
                      </p>
                      <p className="text-sm mt-2 text-foreground/80 leading-relaxed italic">"{p.reason}"</p>
                    </div>
                  </div>

                  {p.status === "PENDING" && (
                    <div className="flex gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-xl text-emerald-600 border-emerald-200 hover:bg-emerald-50 h-9"
                        disabled={processing === p.id}
                        onClick={() => handleAction(p.id, "APPROVED")}
                      >
                        <CheckCircle className="mr-1.5 h-4 w-4" /> Setujui
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-xl text-red-600 border-red-200 hover:bg-red-50 h-9"
                        disabled={processing === p.id}
                        onClick={() => handleAction(p.id, "REJECTED")}
                      >
                        <XCircle className="mr-1.5 h-4 w-4" /> Tolak
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
