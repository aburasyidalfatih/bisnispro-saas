"use client"

import { useEffect, useState, useCallback, useOptimistic } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ServerPagination } from "@/components/shared/server-pagination"
import { Bell, Check, Info, CheckCircle, AlertTriangle, XCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"

interface NotifRow {
  id: string
  title: string
  message: string
  type: string
  isRead: boolean
  createdAt: string
}

const typeIcons: Record<string, { icon: typeof Info; color: string }> = {
  info: { icon: Info, color: "text-blue-500 bg-blue-500/10" },
  success: { icon: CheckCircle, color: "text-emerald-500 bg-emerald-500/10" },
  warning: { icon: AlertTriangle, color: "text-amber-500 bg-amber-500/10" },
  error: { icon: XCircle, color: "text-destructive bg-destructive/10" },
}

export default function NotificationsPage() {
  const [notifs, setNotifs] = useState<NotifRow[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const limit = 20

  const fetchNotifs = useCallback(() => {
    setLoading(true)
    fetch(`/api/tenant/notifications?page=${page}&limit=${limit}`)
      .then((r) => r.json())
      .then((data) => {
        setNotifs(data.data || [])
        setTotal(data.total || 0)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [page])

  useEffect(() => { fetchNotifs() }, [fetchNotifs])

  // Optimistic UI — mark as read instantly, sync in background
  const [optimisticNotifs, setOptimisticNotif] = useOptimistic(
    notifs,
    (state: NotifRow[], action: { type: "read" | "readAll"; id?: string }) => {
      if (action.type === "readAll") return state.map((n) => ({ ...n, isRead: true }))
      return state.map((n) => n.id === action.id ? { ...n, isRead: true } : n)
    }
  )

  const markAllRead = async () => {
    setOptimisticNotif({ type: "readAll" })
    await fetch("/api/tenant/notifications", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    })
    setNotifs((prev) => prev.map((n) => ({ ...n, isRead: true })))
    toast({ title: "Semua notifikasi ditandai dibaca" })
  }

  const markRead = async (id: string) => {
    setOptimisticNotif({ type: "read", id })
    await fetch("/api/tenant/notifications", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    })
    setNotifs((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n))
  }

  const totalPages = Math.ceil(total / limit)
  const unreadCount = optimisticNotifs.filter((n) => !n.isRead).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Notifikasi</h1>
          <p className="text-muted-foreground">
            {unreadCount > 0 ? `${unreadCount} belum dibaca` : "Semua notifikasi Anda"}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" className="gap-2 rounded-xl" onClick={markAllRead}>
            <Check className="h-4 w-4" />
            Tandai Semua Dibaca
          </Button>
        )}
      </div>

      <Card className="glass border-0 overflow-hidden">
        {loading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="skeleton h-16 w-full rounded-xl" />)}
          </div>
        ) : notifs.length === 0 ? (
          <div className="p-12 text-center">
            <Bell className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground">Belum ada notifikasi</p>
          </div>
        ) : (
          <div className="divide-y">
            {optimisticNotifs.map((n) => {
              const typeInfo = typeIcons[n.type] || typeIcons.info
              const Icon = typeInfo.icon
              return (
                <div
                  key={n.id}
                  className={cn("flex items-start gap-3 p-4 transition-colors cursor-pointer", !n.isRead ? "bg-primary/5 hover:bg-primary/10" : "hover:bg-muted/20")}
                  onClick={() => !n.isRead && markRead(n.id)}
                >
                  <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl mt-0.5", typeInfo.color)}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={cn("text-sm", !n.isRead && "font-semibold")}>{n.title}</p>
                      {!n.isRead && <span className="h-2 w-2 rounded-full bg-primary shrink-0" />}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      {new Date(n.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              )
            })}
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
