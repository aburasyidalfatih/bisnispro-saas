"use client"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, LogIn, LogOut, MapPin, Camera, History } from "lucide-react"
import { formatInTimeZone } from "date-fns-tz"
import { id as localeId } from "date-fns/locale"
import { isToday } from "date-fns"
import { cn } from "@/lib/utils"

type AttendanceRecord = {
  id: string; date: string; status: string
  checkInAt?: string; checkOutAt?: string
  checkInLat?: number; checkInLng?: number; checkInPhoto?: string; notes?: string
}

const STATUS_CFG: Record<string, { label: string; color: string; bg: string }> = {
  HADIR: { label: "Hadir", color: "text-emerald-600", bg: "bg-emerald-500/10 border-emerald-300" },
  IZIN: { label: "Izin", color: "text-blue-600", bg: "bg-blue-500/10 border-blue-300" },
  SAKIT: { label: "Sakit", color: "text-amber-600", bg: "bg-amber-500/10 border-amber-300" },
  ALPHA: { label: "Alpha", color: "text-red-600", bg: "bg-red-500/10 border-red-300" },
}

type AttendanceHistoryListProps = {
  history: AttendanceRecord[]
  loading: boolean
  tz: string
}

export function AttendanceHistoryList({ history, loading, tz }: AttendanceHistoryListProps) {
  return (
    <div>
      <p className="font-bold text-sm mb-3 flex items-center gap-2">
        <History className="h-4 w-4 text-muted-foreground" /> Riwayat 30 Hari Terakhir
      </p>
      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : history.length === 0 ? (
        <Card className="glass border-0">
          <CardContent className="py-12 text-center text-muted-foreground text-sm">Belum ada riwayat absensi.</CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {history.map(rec => {
            const cfg = STATUS_CFG[rec.status] || STATUS_CFG.ALPHA
            const isRecToday = isToday(new Date(rec.date))
            return (
              <Card key={rec.id} className={cn("glass border-0 shadow-sm", isRecToday && "ring-1 ring-primary/30")}>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shrink-0 font-bold text-sm", cfg.bg, cfg.color)}>
                    {new Date(rec.date).getDate()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">
                      {formatInTimeZone(new Date(rec.date), tz, "EEEE, d MMMM", { locale: localeId })}
                      {isRecToday && <span className="ml-2 text-[10px] text-primary font-bold bg-primary/10 px-1.5 py-0.5 rounded-full">Hari Ini</span>}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                      {rec.checkInAt && <span className="flex items-center gap-1"><LogIn className="h-3 w-3" />{formatInTimeZone(new Date(rec.checkInAt), tz, "HH:mm")}</span>}
                      {rec.checkOutAt && <span className="flex items-center gap-1"><LogOut className="h-3 w-3" />{formatInTimeZone(new Date(rec.checkOutAt), tz, "HH:mm")}</span>}
                      {rec.checkInLat && <span className="flex items-center gap-1 text-emerald-600"><MapPin className="h-3 w-3" />GPS</span>}
                      {rec.checkInPhoto && (
                        <a href={rec.checkInPhoto} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-primary hover:underline" onClick={e => e.stopPropagation()}>
                          <Camera className="h-3 w-3" />Foto
                        </a>
                      )}
                    </div>
                    {rec.notes && <p className="text-xs text-muted-foreground italic mt-0.5 truncate">&quot;{rec.notes}&quot;</p>}
                  </div>
                  <Badge variant="outline" className={cn(cfg.bg, cfg.color, "border text-[10px] shrink-0 font-bold")}>{cfg.label}</Badge>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
