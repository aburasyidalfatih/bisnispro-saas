"use client"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2, User as UserIcon } from "lucide-react"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { cn, normalizeImageUrl } from "@/lib/utils"
import type { StaffSummary } from "../types"

type SummaryAttendanceTableProps = {
  title: string
  loading: boolean
  data: StaffSummary[]
  emptyMessage?: string
}

export function SummaryAttendanceTable({ title, loading, data, emptyMessage = "Tidak ada data rekap." }: SummaryAttendanceTableProps) {
  return (
    <Card className="glass border-0 shadow-sm overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-bold tracking-tight">{title}</CardTitle>
      </CardHeader>
      <div className="overflow-x-auto w-full">
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                {["Guru/Staf", "Jabatan", "Hadir", "Izin", "Sakit", "Alpha", "Total Absensi", "Kehadiran %"].map(h => (
                  <TableHead key={h} className="text-left px-4 py-3.5 text-xs font-bold text-muted-foreground uppercase tracking-wider">{h}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map(s => (
                <TableRow key={s.id} className="hover:bg-white/40 dark:hover:bg-white/5 transition-colors">
                  <TableCell className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl overflow-hidden bg-primary/10 shrink-0 border border-border/50">
                        {s.imageUrl ? (
                          <img src={normalizeImageUrl(s.imageUrl)} alt={s.name} className="h-full w-full object-cover" loading="lazy" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center font-bold text-primary text-xs bg-primary/5">
                            <UserIcon className="h-4 w-4 text-primary" />
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-xs text-foreground leading-snug">{s.name}</p>
                        <p className="text-[10px] text-muted-foreground">{s.role || "Staf"}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-xs text-muted-foreground">{s.role || "Staf"}</TableCell>
                  <TableCell className="px-4 py-3 font-bold text-emerald-600 text-xs">{s.hadir}</TableCell>
                  <TableCell className="px-4 py-3 font-bold text-blue-600 text-xs">{s.izin}</TableCell>
                  <TableCell className="px-4 py-3 font-bold text-amber-600 text-xs">{s.sakit}</TableCell>
                  <TableCell className="px-4 py-3 font-bold text-red-600 text-xs">{s.alpha}</TableCell>
                  <TableCell className="px-4 py-3 font-bold text-zinc-500 text-xs">{s.total}</TableCell>
                  <TableCell className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-muted dark:bg-zinc-800 rounded-full h-1.5 min-w-[50px] overflow-hidden">
                        <div className={cn("h-full rounded-full", s.percentage >= 80 ? "bg-emerald-500" : s.percentage >= 60 ? "bg-amber-500" : "bg-red-500")} style={{ width: `${s.percentage}%` }} />
                      </div>
                      <span className="text-xs font-bold w-8 text-right">{s.percentage}%</span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {data.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-muted-foreground text-xs font-medium">{emptyMessage}</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>
    </Card>
  )
}
