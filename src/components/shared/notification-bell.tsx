"use client"

import { useState } from "react"
import { usePathname } from "next/navigation"
import { Bell, Check, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import useSWR from "swr"
import { formatDistanceToNow } from "date-fns"
import { id } from "date-fns/locale"
import Link from "next/link"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function NotificationBell() {
  const { data, mutate } = useSWR("/api/notifications", fetcher, {
    refreshInterval: 60000, // Poll every minute
  })

  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  const unreadCount = data?.unreadCount || 0
  const notifications = data?.notifications || []

  const markAsRead = async (id: string) => {
    await fetch(`/api/notifications/${id}/read`, { method: "PATCH" })
    mutate()
  }

  const markAllAsRead = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    await fetch("/api/notifications/read-all", { method: "PATCH" })
    mutate()
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative rounded-xl h-9 w-9">
          <Bell className="h-[18px] w-[18px]" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary flex items-center justify-center text-[9px] font-bold text-primary-foreground border-2 border-background">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
          <span className="sr-only">Notifikasi</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80 glass rounded-xl p-0" align="end" forceMount>
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <DropdownMenuLabel className="p-0 font-bold">Notifikasi</DropdownMenuLabel>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-[11px] text-primary hover:underline flex items-center gap-1 font-medium"
            >
              <CheckCircle2 className="h-3 w-3" />
              Tandai dibaca
            </button>
          )}
        </div>
        
        <div className="max-h-[300px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
              <Bell className="h-6 w-6 text-muted-foreground/50" />
              Belum ada notifikasi baru.
            </div>
          ) : (
            <DropdownMenuGroup>
              {notifications.map((notif: any) => (
                <div key={notif.id} className="relative">
                  <DropdownMenuItem
                    className={`flex flex-col items-start gap-1 px-4 py-3 cursor-pointer rounded-none border-b last:border-0 ${
                      !notif.isRead ? "bg-primary/5" : ""
                    }`}
                    onClick={() => {
                      if (!notif.isRead) markAsRead(notif.id)
                      // Handle redirection logic if `notif.metadata?.link` exists
                    }}
                  >
                    <div className="flex w-full justify-between items-start gap-2">
                      <span className={`text-sm ${!notif.isRead ? "font-semibold text-foreground" : "font-medium text-foreground/80"}`}>
                        {notif.title}
                      </span>
                      {!notif.isRead && (
                        <span className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1" />
                      )}
                    </div>
                    <p className={`text-xs line-clamp-2 ${!notif.isRead ? "text-foreground/80" : "text-muted-foreground"}`}>
                      {notif.message}
                    </p>
                    <span className="text-[10px] text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true, locale: id })}
                    </span>
                  </DropdownMenuItem>
                </div>
              ))}
            </DropdownMenuGroup>
          )}
        </div>
        
        <DropdownMenuSeparator className="m-0" />
        <Link href={pathname.startsWith("/super-admin") ? "/super-admin/notifications" : "/dashboard/notifications"} onClick={() => setIsOpen(false)}>
          <div className="p-2 text-center text-xs font-medium text-primary hover:bg-muted/50 transition-colors cursor-pointer rounded-b-xl">
            Lihat Semua Notifikasi
          </div>
        </Link>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
