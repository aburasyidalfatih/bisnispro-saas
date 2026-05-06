"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Calendar } from "lucide-react"

const days = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"]

export default function MySchedulePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Jadwal</h1>
        <p className="text-muted-foreground">Lihat jadwal dan kegiatan Anda</p>
      </div>

      <div className="grid grid-cols-7 gap-3">
        {days.map((day) => (
          <Card key={day} className="glass border-0">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center gap-1.5 mb-3">
                <Calendar className="h-4 w-4 text-primary" />
                <span className="font-semibold text-sm">{day}</span>
              </div>
              <p className="text-xs text-muted-foreground">Tidak ada jadwal</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
