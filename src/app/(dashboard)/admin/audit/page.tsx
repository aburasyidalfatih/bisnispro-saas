"use client"

import { useEffect, useState, useCallback } from "react"
import { useSession } from "next-auth/react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ServerPagination } from "@/components/shared/server-pagination"
import { FileText, Search, User, Clock } from "lucide-react"
import { cn } from "@/lib/utils"

interface AuditRow {
  id: string
  action: string
  entity: string
  entityId: string | null
  user: { name: string; email: string } | null
  createdAt: string
  ipAddress: string | null
}

const actionColors: Record<string, string> = {
  create: "bg-emerald-500/10 text-emerald-600",
  update: "bg-blue-500/10 text-blue-600",
  delete: "bg-destructive/10 text-destructive",
  login: "bg-amber-500/10 text-amber-600",
}

export default function AuditPage() {
  const { data: session } = useSession()
  const [logs, setLogs] = useState<AuditRow[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const limit = 20

  const [tenantId, setTenantId] = useState<string | null>(session?.user?.tenants?.[0]?.id || null)

  useEffect(() => {
    const sessionTenantId = session?.user?.tenants?.[0]?.id
    if (sessionTenantId) { setTenantId(sessionTenantId); return }
    const match = document.cookie.match(/impersonate-tenant=([^;]+)/)
    const slug = match?.[1]
    if (slug) {
      fetch(`/api/tenant/by-slug?slug=${slug}`)
        .then((r) => r.json())
        .then((data) => { if (data.id) setTenantId(data.id) })
        .catch(() => {})
    }
  }, [session?.user?.tenants])

  const fetchLogs = useCallback(() => {
    if (!tenantId) return
    setLoading(true)
    fetch(`/api/tenant/audit?tenantId=${tenantId}&page=${page}&limit=${limit}&search=${search}`)
      .then((r) => r.json())
      .then((data) => {
        setLogs(data.data || [])
        setTotal(data.total || 0)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [tenantId, page, search])

  useEffect(() => { fetchLogs() }, [fetchLogs])

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Audit Log</h1>
        <p className="text-muted-foreground">Riwayat semua aktivitas di organisasi Anda</p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Cari aktivitas..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} className="pl-9 rounded-xl" />
      </div>

      <Card className="glass border-0 overflow-hidden">
        {loading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="skeleton h-14 w-full rounded-xl" />)}
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground">Belum ada aktivitas tercatat</p>
          </div>
        ) : (
          <div className="divide-y">
            {logs.map((log) => (
              <div key={log.id} className="flex items-start gap-3 p-4 hover:bg-muted/20 transition-colors">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 mt-0.5">
                  <FileText className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={cn("text-[11px] font-semibold uppercase rounded-full px-2 py-0.5", actionColors[log.action] || "bg-muted text-muted-foreground")}>
                      {log.action}
                    </span>
                    <span className="text-sm font-medium">{log.entity}</span>
                    {log.entityId && <span className="text-xs text-muted-foreground font-mono">#{log.entityId.slice(-6)}</span>}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    {log.user && (
                      <span className="flex items-center gap-1"><User className="h-3 w-3" />{log.user.name}</span>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(log.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </span>
                    {log.ipAddress && <span>{log.ipAddress}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t">
            <ServerPagination page={page} totalPages={totalPages} total={total} onPageChange={setPage} />
          </div>
        )}
      </Card>
    </div>
  )
}
