"use client"

import { useEffect, useState, useCallback } from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ServerPagination } from "@/components/shared/server-pagination"
import { Bug, Search, User, Calendar, Building2, AlertCircle } from "lucide-react"
import { format } from "date-fns"
import { id as dateLocaleId } from "date-fns/locale"
import { CheckCircle2, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface ErrorLog {
  id: string
  category: string
  message: string
  stack: string | null
  path: string | null
  method: string | null
  tenant: { name: string } | null
  user: { name: string; email: string } | null
  createdAt: string
  isResolved: boolean
}

export function ErrorLogTab() {
  const [errors, setErrors] = useState<ErrorLog[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("unresolved")
  const [selectedError, setSelectedError] = useState<ErrorLog | null>(null)
  const limit = 20

  const fetchErrors = useCallback(() => {
    setLoading(true)
    fetch(`/api/super-admin/errors?page=${page}&limit=${limit}&search=${search}&category=${categoryFilter}&status=${statusFilter}`)
      .then((r) => r.json())
      .then((data) => {
        setErrors(data.data || [])
        setTotal(data.total || 0)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [page, search, categoryFilter, statusFilter])

  useEffect(() => { fetchErrors() }, [fetchErrors])

  const toggleResolve = async (e: React.MouseEvent, errId: string, currentStatus: boolean) => {
    e.stopPropagation()
    try {
      const res = await fetch(`/api/super-admin/errors/${errId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isResolved: !currentStatus }),
      })
      if (res.ok) {
        fetchErrors()
        if (selectedError?.id === errId) setSelectedError((prev) => prev ? { ...prev, isResolved: !currentStatus } : null)
      }
    } catch (error) {
      console.error("Failed to update status", error)
    }
  }

  const deleteError = async (e: React.MouseEvent, errId: string) => {
    e.stopPropagation()
    if (!confirm("Apakah Anda yakin ingin menghapus log ini secara permanen?")) return
    try {
      const res = await fetch(`/api/super-admin/errors/${errId}`, {
        method: "DELETE",
      })
      if (res.ok) {
        fetchErrors()
        if (selectedError?.id === errId) setSelectedError(null)
      }
    } catch (error) {
      console.error("Failed to delete log", error)
    }
  }

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Cari pesan error atau path..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} className="pl-9 rounded-xl" />
        </div>
        <Select 
          value={categoryFilter || "all"} 
          onValueChange={(value) => { setCategoryFilter(value === "all" ? "" : value); setPage(1); }}
        >
          <SelectTrigger className="h-10 w-fit sm:min-w-[160px] rounded-xl bg-background">
            <SelectValue placeholder="Semua Kategori" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Kategori</SelectItem>
            <SelectItem value="SYSTEM_BUG">System Bug</SelectItem>
            <SelectItem value="USER_ERROR">User Error</SelectItem>
          </SelectContent>
        </Select>
        <Select 
          value={statusFilter || "all"} 
          onValueChange={(value) => { setStatusFilter(value === "all" ? "" : value); setPage(1); }}
        >
          <SelectTrigger className="h-10 w-fit sm:min-w-[160px] rounded-xl bg-background">
            <SelectValue placeholder="Semua Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value="unresolved">Belum Selesai</SelectItem>
            <SelectItem value="resolved">Sudah Selesai</SelectItem>
          </SelectContent>
        </Select>
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
                className={cn("flex items-start gap-3 p-4 hover:bg-muted/20 transition-colors cursor-pointer group", err.isResolved && "opacity-60 grayscale")}
                onClick={() => setSelectedError(err)}
              >
                <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl mt-0.5", 
                  err.category === "USER_ERROR" ? "bg-amber-500/10 text-amber-500" : "bg-destructive/10 text-destructive"
                )}>
                  <AlertCircle className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className={cn("text-[10px]", err.category === "USER_ERROR" ? "border-amber-500 text-amber-500" : "border-destructive text-destructive")}>
                      {err.category === "USER_ERROR" ? "User Error" : "System Bug"}
                    </Badge>
                    <span className={cn("text-sm font-bold truncate max-w-[500px]", err.category === "USER_ERROR" ? "text-amber-500" : "text-destructive")}>{err.message}</span>
                    {err.method && <Badge variant="outline" className="text-[10px]">{err.method}</Badge>}
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground flex-wrap">
                    <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{format(new Date(err.createdAt), "dd MMM yyyy HH:mm", { locale: dateLocaleId })}</span>
                    {err.tenant && <span className="flex items-center gap-1"><Building2 className="h-3.5 w-3.5" />{err.tenant.name}</span>}
                    {err.user && <span className="flex items-center gap-1"><User className="h-3.5 w-3.5" />{err.user.name}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className={cn("h-8 w-8", err.isResolved ? "text-green-500 hover:text-green-600" : "text-muted-foreground hover:text-green-500")} onClick={(e) => toggleResolve(e, err.id, err.isResolved)}>
                    <CheckCircle2 className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={(e) => deleteError(e, err.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
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
