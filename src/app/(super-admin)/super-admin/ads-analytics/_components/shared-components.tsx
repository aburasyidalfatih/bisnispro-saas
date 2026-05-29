import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export function StatCard({ label, value, icon: Icon, color }: { label: string; value: string; icon: any; color: string }) {
  const colorMap: Record<string, string> = {
    emerald: 'bg-emerald-500/10 text-emerald-600', blue: 'bg-blue-500/10 text-blue-600',
    violet: 'bg-violet-500/10 text-violet-600', amber: 'bg-amber-500/10 text-amber-600',
    rose: 'bg-rose-500/10 text-rose-600', cyan: 'bg-cyan-500/10 text-cyan-600',
    orange: 'bg-orange-500/10 text-orange-600',
  }
  return (
    <Card className="glass border-0">
      <CardContent className="p-3">
        <div className="flex items-center gap-2">
          <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", colorMap[color] || colorMap.blue)}>
            <Icon className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[9px] text-muted-foreground font-medium">{label}</p>
            <p className="text-sm font-bold truncate">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
