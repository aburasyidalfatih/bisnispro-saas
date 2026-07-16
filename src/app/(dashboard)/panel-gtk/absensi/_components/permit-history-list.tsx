"use client"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, FileText } from "lucide-react"
import { formatInTimeZone } from "date-fns-tz"
import { id as localeId } from "date-fns/locale"
import { cn } from "@/lib/utils"

type PermitHistoryListProps = {
  permits: any[]
  loading: boolean
  tz: string
}

export function PermitHistoryList({ permits, loading, tz }: PermitHistoryListProps) {
  const getStatusColor = (status: string) => {
    if (status === "APPROVED") return "bg-emerald-500/10 text-emerald-600 border-emerald-200"
    if (status === "REJECTED") return "bg-red-500/10 text-red-600 border-red-200"
    return "bg-amber-500/10 text-amber-600 border-amber-200"
  }

  return (
    <div>
      <p className="font-bold text-sm mb-3 flex items-center gap-2 mt-8">
        <FileText className="h-4 w-4 text-muted-foreground" /> Riwayat Pengajuan Izin
      </p>
      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : permits.length === 0 ? (
        <Card className="glass border-0">
          <CardContent className="py-12 text-center text-muted-foreground text-sm">Belum ada riwayat pengajuan izin.</CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {permits.map(permit => {
            const statusLabel = permit.status === "APPROVED" ? "Disetujui" : permit.status === "REJECTED" ? "Ditolak" : "Menunggu"
            return (
              <Card key={permit.id} className="glass border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline" className={cn("text-[10px] uppercase font-bold",
                      permit.type === "IZIN" ? "text-blue-600 border-blue-200" :
                      permit.type === "SAKIT" ? "text-amber-600 border-amber-200" : "text-purple-600 border-purple-200"
                    )}>
                      {permit.type.replace("_", " ")}
                    </Badge>
                    <Badge className={cn("text-[10px] border shadow-sm", getStatusColor(permit.status))}>
                      {statusLabel}
                    </Badge>
                  </div>
                  <p className="font-bold text-sm text-foreground">
                    {formatInTimeZone(new Date(permit.startDate), tz, "d MMM yyyy", { locale: localeId })}
                    {permit.startDate !== permit.endDate && ` - ${formatInTimeZone(new Date(permit.endDate), tz, "d MMM yyyy", { locale: localeId })}`}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{permit.reason}</p>
                  {permit.proofUrl && (
                    <a href={permit.proofUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 mt-2 hover:underline">
                      <FileText className="h-3 w-3" /> Lampiran
                    </a>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
