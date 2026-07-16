"use client"
import Link from "next/link"
import { TrendingUp, CalendarCheck, FileText, Settings } from "lucide-react"
import { cn } from "@/lib/utils"

const TABS = [
  { id: "overview", label: "Overview", icon: TrendingUp, href: "/admin/attendance/gtk/overview" },
  { id: "presence", label: "Presensi Harian", icon: CalendarCheck, href: "/admin/attendance/gtk/presence" },
  { id: "permits", label: "Perizinan", icon: FileText, href: "/admin/attendance/gtk/permits" },
  { id: "settings", label: "Pengaturan", icon: Settings, href: "/admin/attendance/gtk/settings" },
]

export function AttendanceTabNav({ activeId }: { activeId: string }) {
  return (
    <div className="flex border-b border-border/50 pb-px overflow-x-auto gap-1">
      {TABS.map((tab) => {
        const Icon = tab.icon
        const isActive = tab.id === activeId
        return (
          <Link
            key={tab.id}
            href={tab.href}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 text-xs font-semibold transition-all border-b-2 -mb-px rounded-t-xl shrink-0",
              isActive
                ? "border-primary text-primary bg-primary/5"
                : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30"
            )}
          >
            <Icon className="h-4 w-4" />
            {tab.label}
          </Link>
        )
      })}
    </div>
  )
}
