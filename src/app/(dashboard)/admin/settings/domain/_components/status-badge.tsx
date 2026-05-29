import { ShieldCheck, ShieldOff, Clock, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { DomainStatus } from "./types"

export function StatusBadge({ status }: { status: DomainStatus }) {
  const map: Record<DomainStatus, { label: string; icon: React.ReactNode; className: string }> = {
    verified: {
      label: "Terverifikasi",
      icon: <ShieldCheck className="h-3.5 w-3.5" />,
      className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    },
    unverified: {
      label: "Belum Diverifikasi",
      icon: <ShieldOff className="h-3.5 w-3.5" />,
      className: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    },
    pending: {
      label: "Menunggu",
      icon: <Clock className="h-3.5 w-3.5" />,
      className: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    },
    failed: {
      label: "Gagal",
      icon: <AlertCircle className="h-3.5 w-3.5" />,
      className: "bg-destructive/10 text-destructive border-destructive/20",
    },
  }
  const { label, icon, className } = map[status]
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
        className
      )}
    >
      {icon}
      {label}
    </span>
  )
}
