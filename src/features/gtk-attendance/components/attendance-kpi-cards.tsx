"use client"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { KPICard } from "../types"

export function AttendanceKPICards({ cards }: { cards: KPICard[] }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <Card key={card.label} className="glass border-0 shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center border", card.badge)}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">{card.label}</p>
                <p className={cn("font-black text-2xl tracking-tight", card.color)}>{card.value}</p>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
