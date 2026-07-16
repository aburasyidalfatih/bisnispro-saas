import { format } from "date-fns"

export function getWeekInputValue(date = new Date()) {
  const target = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNumber = target.getUTCDay() || 7
  target.setUTCDate(target.getUTCDate() + 4 - dayNumber)
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1))
  const weekNumber = Math.ceil((((target.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)

  return `${target.getUTCFullYear()}-W${String(weekNumber).padStart(2, "0")}`
}

export function parseMonthStr(monthStr: string) {
  const [year, month] = monthStr.split("-").map(Number)
  return new Date(year, month - 1, 1)
}

export function getHHMM(isoString?: string) {
  if (!isoString) return ""
  const d = new Date(isoString)
  if (isNaN(d.getTime())) return ""
  const hours = String(d.getHours()).padStart(2, "0")
  const minutes = String(d.getMinutes()).padStart(2, "0")
  return `${hours}:${minutes}`
}

export function getExportFilename(contentDisposition: string | null) {
  const match = contentDisposition?.match(/filename="?([^"]+)"?/)
  return match?.[1] || `Laporan_Presensi_GTK_${format(new Date(), "yyyyMMdd")}.xlsx`
}
