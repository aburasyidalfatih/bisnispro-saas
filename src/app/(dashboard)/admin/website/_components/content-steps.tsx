import { Sparkles, CheckCircle, AlertCircle } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

export interface StatItem {
  label: string
  desc: string
  value: string | number
  icon: React.ReactNode
  status?: "ok" | "warn" | "empty"
  href: string
}

interface ContentStepsProps {
  sections: StatItem[]
}

export function ContentSteps({ sections }: ContentStepsProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="h-6 w-6 text-primary" />
        <h2 className="text-xl md:text-2xl font-bold tracking-tight">Lengkapi Konten Website</h2>
      </div>
      <p className="text-muted-foreground text-sm md:text-base max-w-3xl">
        Selesaikan seluruh langkah di bawah ini secara berurutan agar website sekolah Anda tampil sempurna dan informatif di mata publik.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 pt-2">
        {sections.map((s, idx) => {
          const isComplete = s.status !== "empty"
          return (
            <Link key={s.href} href={s.href} className={cn(
              "group flex flex-col gap-3 rounded-2xl bg-card p-4 border hover:shadow-md transition-all",
              isComplete ? "border-emerald-500/20 hover:border-emerald-500/40" : "border-border hover:border-primary/50"
            )}>
              <div className="flex items-center gap-3">
                <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold text-lg transition-transform group-hover:scale-105",
                  isComplete ? "bg-emerald-500/10 text-emerald-600" : "bg-primary/10 text-primary"
                )}>
                  {idx + 1}
                </div>
                <h3 className="font-semibold text-sm leading-tight">{s.label}</h3>
              </div>
              
              <p className="text-xs text-muted-foreground flex-1 line-clamp-2 leading-relaxed">
                {s.desc}
              </p>
              
              <div className={cn("mt-2 pt-3 border-t flex items-center justify-between",
                isComplete ? "border-emerald-500/10" : "border-border/50"
              )}>
                <div className="flex items-center gap-1.5">
                  {isComplete ? (
                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-amber-500" />
                  )}
                  <span className={cn("text-[11px] font-medium",
                    isComplete ? "text-emerald-600" : "text-amber-600"
                  )}>
                    {s.value}
                  </span>
                </div>
                <div className="text-[10px] font-semibold text-muted-foreground group-hover:text-primary transition-colors flex items-center gap-1 uppercase tracking-wider">
                  {isComplete ? "Ubah" : "Lengkapi"} <span className="text-base leading-none">→</span>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
