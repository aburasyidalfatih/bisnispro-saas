"use client"

import { useEffect, useState, useCallback } from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ServerPagination } from "@/components/shared/server-pagination"
import { Bug, Search, User, Clock, MapPin, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface ErrorLog {
  id: string
  message: string
  stack: string | null
  path: string | null
  method: string | null
  tenant: { name: string } | null
  user: { name: string; email: string } | null
  createdAt: string
}

export default function ErrorLogPage() {
  const [errors, setErrors] = useState<ErrorLog[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [selectedError, setSelectedError] = useState<ErrorLog | null>(null)
  const limit = 20

  const fetchErrors = useCallback(() => {
    setLoading(true)
    fetch(`/api/super-admin/errors?page=${page}&limit=${limit}&search=${search}`)
      .then((r) => r.json())
      .then((data) => {
        setErrors(data.data || [])
        setTotal(data.total || 0)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [page, search])

  useEffect(() => { fetchErrors() }, [fetchErrors])

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Error Log Sistem</h1>
        <p className="text-muted-foreground mt-1">Pantau error yang dialami oleh pengguna</p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Cari pesan error atau path..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} className="pl-9 rounded-xl" />
      </div>

      <Card className="glass border-0 overflow-hidden">
        {loading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="skeleton h-14 w-full rounded-xl" />)}
          </div>
        ) : errors.length === 0 ? (
          <div className="p-12 text-center">
            <Bug className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground">Belum ada error tercatat</p>
          </div>
        ) : (
          <div className="divide-y">
            {errors.map((err) => (
              <div 
                key={err.id} 
                className="flex items-start gap-3 p-4 hover:bg-muted/20 transition-colors cursor-pointer"
                onClick={() => setSelectedError(err)}
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-destructive/10 mt-0.5">
                  <AlertCircle className="h-4 w-4 text-destructive" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-destructive truncate max-w-[500px]">{err.message}</span>
                    {err.method && <Badge variant="outline" className="text-[10px]">{err.method}</Badge>}
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground flex-wrap">
                    {err.path && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {err.path}</span>}
                    {err.tenant && <span className="flex items-center gap-1 font-medium text-primary">{err.tenant.name}</span>}
                    {err.user && <span className="flex items-center gap-1"><User className="h-3 w-3" />{err.user.name}</span>}
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(err.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </span>
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

      <Dialog open={!!selectedError} onOpenChange={(open) => !open && setSelectedError(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Detail Error
            </DialogTitle>
          </DialogHeader>
          
          {selectedError && (
            <div className="flex-1 overflow-y-auto pr-2 space-y-4">
              <div>
                <h3 className="text-sm font-semibold mb-1">Pesan Error</h3>
                <div className="p-3 bg-destructive/10 text-destructive rounded-lg font-mono text-sm">
                  {selectedError.message}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground block mb-1">Path</span>
                  <div className="font-mono bg-muted p-2 rounded">{selectedError.path || "-"}</div>
                </div>
                <div>
                  <span className="text-muted-foreground block mb-1">Waktu Terjadi</span>
                  <div className="bg-muted p-2 rounded">
                    {new Date(selectedError.createdAt).toLocaleString("id-ID")}
                  </div>
                </div>
              </div>

              {selectedError.stack && (
                <div>
                  <h3 className="text-sm font-semibold mb-1">Stack Trace</h3>
                  <div className="p-3 bg-muted rounded-lg font-mono text-[10px] whitespace-pre-wrap overflow-x-auto max-h-[250px]">
                    {selectedError.stack}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
