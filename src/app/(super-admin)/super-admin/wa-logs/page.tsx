"use client"

import { useEffect, useState, useCallback } from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ServerPagination } from "@/components/shared/server-pagination"
import { Megaphone, Search, Building2, Clock, CheckCircle2, AlertCircle, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface WaQueueLog {
  id: string
  tenant: { name: string } | null
  targetNumber: string
  message: string
  status: "PENDING" | "SENT" | "FAILED"
  error: string | null
  sentAt: string | null
  createdAt: string
}

const statusColors: Record<string, string> = {
  PENDING: "bg-amber-500/10 text-amber-600 border-amber-200",
  SENT: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
  FAILED: "bg-destructive/10 text-destructive border-destructive/20",
}

const statusIcons: Record<string, any> = {
  PENDING: <Loader2 className="h-3.5 w-3.5 animate-spin" />,
  SENT: <CheckCircle2 className="h-3.5 w-3.5" />,
  FAILED: <AlertCircle className="h-3.5 w-3.5" />,
}

export default function WaQueueLogsPage() {
  const [logs, setLogs] = useState<WaQueueLog[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const limit = 20

  const fetchLogs = useCallback(() => {
    setLoading(true)
    fetch(`/api/super-admin/wa-logs?page=${page}&limit=${limit}&search=${search}`)
      .then((r) => r.json())
      .then((data) => {
        setLogs(data.data || [])
        setTotal(data.total || 0)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [page, search])

  // Refresh every 5 seconds if there are pending messages
  useEffect(() => {
    fetchLogs()
    
    let interval: NodeJS.Timeout
    if (logs.some(l => l.status === "PENDING")) {
      interval = setInterval(() => fetchLogs(), 5000)
    }
    return () => clearInterval(interval)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search])

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Log Antrean WhatsApp</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Pantau proses antrean pesan WhatsApp yang dikirim oleh sistem. Log akan dibersihkan otomatis setelah 3 hari.
          </p>
        </div>
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input 
            placeholder="Cari nomor atau pesan..." 
            value={search} 
            onChange={(e) => { setSearch(e.target.value); setPage(1) }} 
            className="pl-9 rounded-xl bg-white shadow-sm" 
          />
        </div>
      </div>

      <Card className="glass border-0 overflow-hidden shadow-sm">
        {loading && logs.length === 0 ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3, 4].map((i) => <div key={i} className="skeleton h-24 w-full rounded-xl" />)}
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center">
            <Megaphone className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground font-medium">Belum ada antrean pesan WA</p>
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {logs.map((log) => (
              <div key={log.id} className="flex flex-col sm:flex-row items-start gap-4 p-5 hover:bg-muted/30 transition-colors">
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm bg-muted/50 px-2 py-1 rounded-md border text-foreground">
                      {log.targetNumber}
                    </span>
                    <span className={cn(
                      "flex items-center gap-1.5 text-[11px] font-bold uppercase rounded-full px-2.5 py-1 border shadow-sm", 
                      statusColors[log.status] || "bg-muted text-muted-foreground"
                    )}>
                      {statusIcons[log.status]}
                      {log.status}
                    </span>
                  </div>
                  
                  <p className="text-sm text-foreground/90 whitespace-pre-wrap break-words leading-relaxed bg-white/50 p-3 rounded-xl border border-border/50">
                    {log.message}
                  </p>
                  
                  {log.error && (
                    <div className="text-xs text-destructive bg-destructive/10 p-2 rounded-lg border border-destructive/20 font-medium">
                      Error: {log.error}
                    </div>
                  )}

                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground font-medium flex-wrap">
                    {log.tenant && (
                      <span className="flex items-center gap-1.5 bg-background border px-2 py-1 rounded-md">
                        <Building2 className="h-3.5 w-3.5" />
                        {log.tenant.name}
                      </span>
                    )}
                    <span className="flex items-center gap-1.5" title="Waktu Masuk Antrean">
                      <Clock className="h-3.5 w-3.5" />
                      Queued: {new Date(log.createdAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                    </span>
                    {log.sentAt && (
                      <span className="flex items-center gap-1.5 text-primary" title="Waktu Dieksekusi">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Executed: {new Date(log.sentAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t bg-muted/10">
            <ServerPagination page={page} totalPages={totalPages} total={total} onPageChange={setPage} />
          </div>
        )}
      </Card>
    </div>
  )
}
