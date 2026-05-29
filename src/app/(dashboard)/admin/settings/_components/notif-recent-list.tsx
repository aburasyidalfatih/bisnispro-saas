import { useState, useEffect } from "react"
import { Bell, Check, ArrowRight, Info, CheckCircle, AlertTriangle, XCircle } from "lucide-react"
import { cn } from "@/lib/utils"

const typeIcons: Record<string, { icon: typeof Info; color: string }> = {
  info:    { icon: Info,          color: "text-blue-500 bg-blue-500/10" },
  success: { icon: CheckCircle,   color: "text-emerald-500 bg-emerald-500/10" },
  warning: { icon: AlertTriangle, color: "text-amber-500 bg-amber-500/10" },
  error:   { icon: XCircle,       color: "text-destructive bg-destructive/10" },
}

export function NotifRecentList() {
  const [notifs, setNotifs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    fetch("/api/tenant/notifications?page=1&limit=5")
      .then(r => r.json())
      .then(d => {
        const data = d.data || []
        setNotifs(data)
        setUnread(data.filter((n: any) => !n.isRead).length)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const markRead = async (id: string) => {
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n))
    setUnread(prev => Math.max(0, prev - 1))
    await fetch("/api/tenant/notifications", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    })
  }

  const markAllRead = async () => {
    setNotifs(prev => prev.map(n => ({ ...n, isRead: true })))
    setUnread(0)
    await fetch("/api/tenant/notifications", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    })
  }

  return (
    <>
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2">
          <div className="flex-1 h-px bg-border w-8" />
          <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
            <Bell className="h-3 w-3" />
            Notifikasi Terbaru
            {unread > 0 && (
              <span className="bg-primary text-white text-[10px] font-bold rounded-full px-1.5 py-0.5 leading-none">{unread}</span>
            )}
          </span>
          <div className="flex-1 h-px bg-border w-8" />
        </div>
        <div className="flex items-center gap-3 ml-3">
          {unread > 0 && (
            <button onClick={markAllRead} className="text-[11px] text-primary hover:underline flex items-center gap-1">
              <Check className="h-3 w-3" /> Tandai semua
            </button>
          )}
          <a href="/admin/notifications" className="text-[11px] text-muted-foreground hover:text-primary flex items-center gap-1">
            Lihat semua <ArrowRight className="h-3 w-3" />
          </a>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1,2,3].map(i => <div key={i} className="skeleton h-12 rounded-xl" />)}
        </div>
      ) : notifs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <Bell className="h-8 w-8 text-muted-foreground/30 mb-2" />
          <p className="text-sm text-muted-foreground">Belum ada notifikasi</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {notifs.map(n => {
            const ti = typeIcons[n.type] || typeIcons.info
            const Icon = ti.icon
            return (
              <div key={n.id}
                onClick={() => !n.isRead && markRead(n.id)}
                className={cn(
                  "flex items-start gap-3 rounded-xl px-3 py-2.5 transition-colors",
                  !n.isRead ? "bg-primary/5 hover:bg-primary/10 cursor-pointer" : "hover:bg-muted/30"
                )}>
                <div className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-lg mt-0.5", ti.color)}>
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                     <p className={cn("text-xs truncate", !n.isRead ? "font-semibold" : "")}>{n.title}</p>
                    {!n.isRead && <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />}
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate">{n.message}</p>
                </div>
                <p className="text-[10px] text-muted-foreground shrink-0 mt-0.5">
                  {new Date(n.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}
