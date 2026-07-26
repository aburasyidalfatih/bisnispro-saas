"use client"

import { useEffect, useState } from "react"
import { getRecentActivity } from "../actions"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { History, FileText, Settings, UserPlus, Image as ImageIcon, Trash2, Edit3, PlusCircle } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { id } from "date-fns/locale"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { EmptyState } from "@/components/ui/empty-state"

interface RecentActivityProps {
  tenantId: string
}

const getActionDetails = (action: string, entity: string) => {
  const act = action.toLowerCase()
  const ent = entity.toLowerCase()
  
  if (act.includes("create") || act.includes("add")) {
    return { icon: <PlusCircle className="h-4 w-4 text-emerald-500" />, label: `Menambahkan ${ent} baru`, bg: "bg-emerald-500/10" }
  }
  if (act.includes("update") || act.includes("edit")) {
    return { icon: <Edit3 className="h-4 w-4 text-blue-500" />, label: `Memperbarui data ${ent}`, bg: "bg-blue-500/10" }
  }
  if (act.includes("delete") || act.includes("remove")) {
    return { icon: <Trash2 className="h-4 w-4 text-rose-500" />, label: `Menghapus ${ent}`, bg: "bg-rose-500/10" }
  }
  if (act.includes("login")) {
    return { icon: <History className="h-4 w-4 text-purple-500" />, label: "Login ke sistem", bg: "bg-purple-500/10" }
  }
  
  return { icon: <Settings className="h-4 w-4 text-muted-foreground" />, label: `Modifikasi ${ent}`, bg: "bg-muted" }
}

export function RecentActivity({ tenantId }: RecentActivityProps) {
  const [activities, setActivities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!tenantId) return
    getRecentActivity(tenantId).then(res => {
      setActivities(res)
      setLoading(false)
    })
  }, [tenantId])

  return (
    <Card className="glass border-0 col-span-1 h-full flex flex-col overflow-hidden">
      <CardHeader className="pb-3 border-b border-border/50 bg-muted/20">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-500/10 rounded-xl">
            <History className="h-4 w-4 text-blue-500" />
          </div>
          <div>
            <CardTitle className="text-sm font-semibold">Riwayat Terbaru</CardTitle>
            <CardDescription className="text-xs">Aktivitas admin terakhir</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4 flex-1 overflow-y-auto">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex gap-3 animate-pulse">
                <div className="h-8 w-8 rounded-full bg-muted"></div>
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-3 bg-muted rounded w-3/4"></div>
                  <div className="h-2 bg-muted rounded w-1/4"></div>
                </div>
              </div>
            ))}
          </div>
        ) : activities.length === 0 ? (
          <div className="py-8">
            <EmptyState icon={History} title="Belum Ada Data" description="Belum ada riwayat aktivitas" />
          </div>
        ) : (
          <div className="space-y-3">
            {activities.map((log) => {
              const details = getActionDetails(log.action, log.entity)
              const role = log.user?.tenants?.[0]?.role
              const displayRole = role ? role.charAt(0).toUpperCase() + role.slice(1) : "Admin"
              
              return (
                <div key={log.id} className="flex gap-3 items-center">
                  <Avatar className="h-8 w-8 border">
                    <AvatarImage src={log.user?.image || ""} />
                    <AvatarFallback className="bg-primary/5 text-[10px] font-medium">
                      {log.user?.name?.substring(0, 2).toUpperCase() || displayRole.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-semibold">{log.user?.name || displayRole}</span>
                    <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-medium -ml-0.5">{displayRole}</span>
                    <span className="text-muted-foreground">{details.label}</span>
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground ml-auto">
                      <div className={`p-0.5 rounded-sm ${details.bg}`}>
                        {details.icon}
                      </div>
                      {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true, locale: id })}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
