"use client"
import { useState } from "react"
import { format, startOfMonth } from "date-fns"
import { getWeekInputValue, getExportFilename } from "../helpers"
import type { ExportMode } from "../types"

type UseAttendanceExportArgs = {
  tenantId?: string
  toast: (opts: { title: string; description?: string; variant?: "default" | "destructive" }) => void
}

export function useAttendanceExport({ tenantId, toast }: UseAttendanceExportArgs) {
  const [exporting, setExporting] = useState(false)
  const [exportMode, setExportMode] = useState<ExportMode>("month")
  const [exportFromDate, setExportFromDate] = useState(() => format(startOfMonth(new Date()), "yyyy-MM-dd"))
  const [exportToDate, setExportToDate] = useState(() => format(new Date(), "yyyy-MM-dd"))
  const [exportWeek, setExportWeek] = useState(() => getWeekInputValue())
  const [exportMonth, setExportMonth] = useState(() => format(new Date(), "yyyy-MM"))
  const [exportYear, setExportYear] = useState(() => format(new Date(), "yyyy"))

  const handleExportExcel = async () => {
    if (!tenantId) {
      return toast({ title: "Tenant belum siap", variant: "destructive" })
    }

    if (exportMode === "range" && exportFromDate > exportToDate) {
      return toast({ title: "Rentang tanggal tidak valid", description: "Tanggal mulai tidak boleh melebihi tanggal akhir.", variant: "destructive" })
    }

    setExporting(true)
    try {
      const params = new URLSearchParams({
        tenantId,
        mode: exportMode,
      })

      if (exportMode === "range") {
        params.set("from", exportFromDate)
        params.set("to", exportToDate)
      } else if (exportMode === "week") {
        params.set("week", exportWeek)
      } else if (exportMode === "month") {
        params.set("month", exportMonth)
      } else {
        params.set("year", exportYear)
      }

      const res = await fetch(`/api/gtk/attendance/export?${params.toString()}`)
      if (!res.ok) {
        const error = await res.json().catch(() => ({ error: "Export gagal" }))
        throw new Error(error.error || "Export gagal")
      }

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = getExportFilename(res.headers.get("Content-Disposition"))
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      toast({ title: "Export berhasil", description: "File Excel presensi GTK berhasil diunduh." })
    } catch (err: any) {
      toast({ title: "Gagal export Excel", description: err.message || "Terjadi kesalahan saat membuat file.", variant: "destructive" })
    } finally {
      setExporting(false)
    }
  }

  return {
    exporting,
    exportMode, setExportMode,
    exportFromDate, setExportFromDate,
    exportToDate, setExportToDate,
    exportWeek, setExportWeek,
    exportMonth, setExportMonth,
    exportYear, setExportYear,
    handleExportExcel,
  }
}
