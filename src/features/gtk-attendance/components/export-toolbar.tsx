"use client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Filter, Download, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ExportMode } from "../types"

type ExportToolbarProps = {
  exporting: boolean
  exportMode: ExportMode
  setExportMode: (mode: ExportMode) => void
  exportFromDate: string
  setExportFromDate: (d: string) => void
  exportToDate: string
  setExportToDate: (d: string) => void
  exportWeek: string
  setExportWeek: (w: string) => void
  exportMonth: string
  setExportMonth: (m: string) => void
  exportYear: string
  setExportYear: (y: string) => void
  onExport: () => void
}

export function ExportToolbar(props: ExportToolbarProps) {
  const { exporting, exportMode, setExportMode, exportFromDate, setExportFromDate, exportToDate, setExportToDate, exportWeek, setExportWeek, exportMonth, setExportMonth, exportYear, setExportYear, onExport } = props

  return (
    <Card className="glass border-0 shadow-sm overflow-hidden">
      <CardContent className="p-3 sm:p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-2 md:flex-row md:items-center lg:flex-1">
            <div className="flex h-10 items-center gap-2 rounded-xl border border-border/70 bg-white/70 px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground dark:bg-zinc-950/60 md:w-44">
              <Filter className="h-3.5 w-3.5 shrink-0" />
              <span>Periode Ekspor</span>
            </div>

            <div className={cn(
              "grid w-full grid-cols-1 gap-2 sm:grid-cols-2 md:items-center lg:w-auto",
              exportMode === "range" ? "lg:grid-cols-[180px_160px_160px]" :
              exportMode === "year" ? "lg:grid-cols-[180px_120px]" :
              "lg:grid-cols-[180px_220px]"
            )}>
              <div>
                <Label className="sr-only">Jenis periode ekspor</Label>
                <Select value={exportMode} onValueChange={(value) => setExportMode(value as ExportMode)}>
                  <SelectTrigger className="h-10 rounded-xl bg-white/80 text-xs dark:bg-zinc-950/60">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="range">Rentang Tanggal</SelectItem>
                    <SelectItem value="week">Minggu</SelectItem>
                    <SelectItem value="month">Bulan</SelectItem>
                    <SelectItem value="year">Tahun</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {exportMode === "range" && (
                <>
                  <div>
                    <Label className="sr-only">Tanggal mulai ekspor</Label>
                    <Input type="date" value={exportFromDate} onChange={(e) => setExportFromDate(e.target.value)} className="h-10 rounded-xl bg-white/80 text-xs dark:bg-zinc-950/60" />
                  </div>
                  <div>
                    <Label className="sr-only">Tanggal akhir ekspor</Label>
                    <Input type="date" value={exportToDate} onChange={(e) => setExportToDate(e.target.value)} className="h-10 rounded-xl bg-white/80 text-xs dark:bg-zinc-950/60" />
                  </div>
                </>
              )}

              {exportMode === "week" && (
                <div>
                  <Label className="sr-only">Minggu ekspor</Label>
                  <Input type="week" value={exportWeek} onChange={(e) => setExportWeek(e.target.value)} className="h-10 rounded-xl bg-white/80 text-xs dark:bg-zinc-950/60" />
                </div>
              )}

              {exportMode === "month" && (
                <div>
                  <Label className="sr-only">Bulan ekspor</Label>
                  <Input type="month" value={exportMonth} onChange={(e) => setExportMonth(e.target.value)} className="h-10 rounded-xl bg-white/80 text-xs dark:bg-zinc-950/60" />
                </div>
              )}

              {exportMode === "year" && (
                <div>
                  <Label className="sr-only">Tahun ekspor</Label>
                  <Input type="number" min="2000" max="2100" value={exportYear} onChange={(e) => setExportYear(e.target.value)} className="h-10 rounded-xl bg-white/80 text-xs dark:bg-zinc-950/60" />
                </div>
              )}
            </div>
          </div>

          <Button type="button" className="h-10 rounded-xl gap-2 font-semibold w-full sm:w-auto shrink-0" onClick={onExport} disabled={exporting}>
            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Ekspor Excel
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
