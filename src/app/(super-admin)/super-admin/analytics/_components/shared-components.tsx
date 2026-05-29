import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { ArrowUpDown } from "lucide-react"

// ============================================
// Component: Summary Card
// ============================================
export function SummaryCard({ icon: Icon, label, value, color, pulse, subtitle }: {
  icon: any; label: string; value: number; color: string; pulse?: boolean; subtitle?: string
}) {
  const colorMap: Record<string, string> = {
    emerald: 'bg-emerald-500/10 text-emerald-600',
    blue: 'bg-blue-500/10 text-blue-600',
    violet: 'bg-violet-500/10 text-violet-600',
    primary: 'bg-primary/10 text-primary',
    slate: 'bg-slate-500/10 text-slate-600',
    amber: 'bg-amber-500/10 text-amber-600',
    green: 'bg-green-500/10 text-green-600',
  }

  return (
    <Card className="glass border-0 relative overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", colorMap[color] || colorMap.primary)}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-muted-foreground font-medium leading-tight">{label}</p>
            <div className="flex items-baseline gap-1">
              <h3 className="text-xl font-bold">{value.toLocaleString('id-ID')}</h3>
              {subtitle && <span className="text-[9px] text-muted-foreground">{subtitle}</span>}
            </div>
          </div>
        </div>
        {pulse && value > 0 && (
          <div className="absolute top-3 right-3">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ============================================
// Component: Mini Stat
// ============================================
export function MiniStat({ icon: Icon, label, value }: { icon: any; label: string; value: number }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border bg-card p-3 hover:shadow-md transition-shadow">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] text-muted-foreground truncate">{label}</p>
        <p className="text-sm font-bold">{value.toLocaleString('id-ID')}</p>
      </div>
    </div>
  )
}

// ============================================
// Component: Sortable Table Header
// ============================================
export function SortableHeader({ label, column, current, order, onSort }: {
  label: string; column: string; current: string; order: string; onSort: (col: string) => void
}) {
  return (
    <th
      className="px-3 py-3 text-center text-xs font-bold text-muted-foreground uppercase tracking-widest cursor-pointer hover:bg-muted/50 transition-colors"
      onClick={() => onSort(column)}
    >
      <div className="flex items-center justify-center gap-1">
        {label}
        <ArrowUpDown className={cn("h-3 w-3", current === column ? "text-primary" : "text-muted-foreground/50")} />
      </div>
    </th>
  )
}
