"use client"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, MapPin, Edit2, User as UserIcon } from "lucide-react"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { format } from "date-fns"
import { cn, normalizeImageUrl } from "@/lib/utils"
import { STATUS_CFG } from "../types"
import type { StaffRecord } from "../types"

type DailyItem = {
  staff: any
  record?: StaffRecord
  status: string
}

type DailyAttendanceTableProps = {
  title: string
  loading: boolean
  data: DailyItem[]
  onEdit: (staff: any, record?: StaffRecord) => void
}

export function DailyAttendanceTable({ title, loading, data, onEdit }: DailyAttendanceTableProps) {
  return (
    <Card className="glass border-0 shadow-sm overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-bold tracking-tight">{title}</CardTitle>
      </CardHeader>
      <div className="overflow-x-auto">
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                {["Guru/Staf", "Jabatan", "Status", "Jam Masuk", "Jam Pulang", "Catatan", "Aksi"].map(h => (
                  <TableHead key={h} className="text-left px-4 py-3.5 text-xs font-bold text-muted-foreground uppercase tracking-wider">{h}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map(item => {
                const cfg = STATUS_CFG[item.status] || STATUS_CFG.BELUM_ABSEN
                const rec = item.record
                return (
                  <TableRow key={item.staff.id} className="hover:bg-white/40 dark:hover:bg-white/5 transition-colors">
                    <TableCell className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl overflow-hidden bg-primary/10 shrink-0 border border-border/50">
                          {item.staff.imageUrl ? (
                            <img src={normalizeImageUrl(item.staff.imageUrl)} alt={item.staff.name} className="h-full w-full object-cover" loading="lazy" />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center font-bold text-primary text-xs bg-primary/5">
                              <UserIcon className="h-4 w-4 text-primary" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-xs text-foreground leading-snug">{item.staff.name}</p>
                          <p className="text-[10px] text-muted-foreground">{item.staff.role || "Staf"}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-xs text-muted-foreground">{item.staff.role || "Staf"}</TableCell>
                    <TableCell className="px-4 py-3">
                      <Badge className={cn(cfg.badgeCls, "border text-[10px] font-bold rounded-lg px-2 py-0.5 shadow-none")}>{cfg.label}</Badge>
                    </TableCell>
                    <TableCell className="px-4 py-3 font-mono text-xs text-foreground">
                      {rec?.checkInAt ? (
                        <div className="flex items-center gap-1.5">
                          <span>{format(new Date(rec.checkInAt), "HH:mm")}</span>
                          {rec.checkInLat && rec.checkInLng && (
                            <a href={`https://maps.google.com/?q=${rec.checkInLat},${rec.checkInLng}`} target="_blank" rel="noopener noreferrer">
                              <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200 border text-[9px] cursor-pointer hover:bg-emerald-100/50 py-0 px-1 shadow-none">
                                <MapPin className="h-2 w-2 mr-0.5" /> GPS
                              </Badge>
                            </a>
                          )}
                        </div>
                      ) : "—"}
                    </TableCell>
                    <TableCell className="px-4 py-3 font-mono text-xs text-foreground">
                      {rec?.checkOutAt ? format(new Date(rec.checkOutAt), "HH:mm") : "—"}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-xs text-muted-foreground max-w-[150px] truncate">{rec?.notes || "—"}</TableCell>
                    <TableCell className="px-4 py-3">
                      <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground" onClick={() => onEdit(item.staff, rec)}>
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
              {data.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground text-xs font-medium">Tidak ada guru/staf ditemukan.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>
    </Card>
  )
}
