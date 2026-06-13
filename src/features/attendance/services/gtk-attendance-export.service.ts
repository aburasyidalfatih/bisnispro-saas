export type GtkAttendanceExportMode = "range" | "week" | "month" | "year"

type ExportSearchParams = Pick<URLSearchParams, "get">

export type GtkAttendanceExportPeriod = {
  mode: GtkAttendanceExportMode
  modeLabel: string
  fromDate: Date
  toDate: Date
  label: string
  slug: string
}

type GtkAttendanceStaff = {
  id: string
  name: string
  role?: string | null
}

type GtkAttendanceRecord = {
  id: string
  date: Date
  status: string
  checkInAt?: Date | null
  checkOutAt?: Date | null
  checkInLat?: number | null
  checkInLng?: number | null
  notes?: string | null
  staff?: GtkAttendanceStaff | null
}

const STATUS_KEYS = ["HADIR", "IZIN", "SAKIT", "ALPHA"] as const
const STATUS_LABELS: Record<string, string> = {
  HADIR: "Hadir",
  IZIN: "Izin",
  SAKIT: "Sakit",
  ALPHA: "Alpha",
}

function parseDateInput(value: string | null, fieldName: string) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error(`${fieldName} harus berformat YYYY-MM-DD`)
  }

  const date = new Date(`${value}T00:00:00.000Z`)
  if (Number.isNaN(date.getTime()) || formatDateInput(date) !== value) {
    throw new Error(`${fieldName} tidak valid`)
  }

  return date
}

function parseYear(value: string | null) {
  if (!value || !/^\d{4}$/.test(value)) {
    throw new Error("Tahun harus berformat YYYY")
  }

  return Number(value)
}

function addUtcDays(date: Date, days: number) {
  const next = new Date(date)
  next.setUTCDate(next.getUTCDate() + days)
  return next
}

function createUtcDate(year: number, monthIndex: number, day: number) {
  return new Date(Date.UTC(year, monthIndex, day))
}

function parseIsoWeek(value: string | null) {
  const match = value?.match(/^(\d{4})-W(\d{2})$/)
  if (!match) throw new Error("Minggu harus berformat YYYY-Www")

  const year = Number(match[1])
  const week = Number(match[2])
  if (week < 1 || week > 53) throw new Error("Nomor minggu tidak valid")

  const jan4 = createUtcDate(year, 0, 4)
  const jan4Day = jan4.getUTCDay() || 7
  const weekOneMonday = addUtcDays(jan4, 1 - jan4Day)
  const start = addUtcDays(weekOneMonday, (week - 1) * 7)

  if (start.getUTCFullYear() > year && week > 52) {
    throw new Error("Nomor minggu tidak valid untuk tahun tersebut")
  }

  return { year, week, start, end: addUtcDays(start, 6) }
}

function parseMonth(value: string | null) {
  const match = value?.match(/^(\d{4})-(\d{2})$/)
  if (!match) throw new Error("Bulan harus berformat YYYY-MM")

  const year = Number(match[1])
  const month = Number(match[2])
  if (month < 1 || month > 12) throw new Error("Bulan tidak valid")

  return {
    year,
    month,
    start: createUtcDate(year, month - 1, 1),
    end: createUtcDate(year, month, 0),
  }
}

export function formatDateInput(date: Date) {
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, "0")
  const day = String(date.getUTCDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function formatDisplayDate(date: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date)
}

function formatDisplayMonth(year: number, month: number) {
  return new Intl.DateTimeFormat("id-ID", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(createUtcDate(year, month - 1, 1))
}

function buildPeriod(mode: GtkAttendanceExportMode, modeLabel: string, fromDate: Date, toDate: Date, label: string): GtkAttendanceExportPeriod {
  if (fromDate > toDate) throw new Error("Tanggal mulai tidak boleh lebih besar dari tanggal akhir")

  return {
    mode,
    modeLabel,
    fromDate,
    toDate,
    label,
    slug: `${formatDateInput(fromDate)}_sd_${formatDateInput(toDate)}`,
  }
}

export function resolveGtkAttendanceExportPeriod(searchParams: ExportSearchParams): GtkAttendanceExportPeriod {
  const mode = (searchParams.get("mode") || "month") as GtkAttendanceExportMode

  if (mode === "range") {
    const fromDate = parseDateInput(searchParams.get("from"), "Tanggal mulai")
    const toDate = parseDateInput(searchParams.get("to"), "Tanggal akhir")

    return buildPeriod(
      "range",
      "Rentang Tanggal",
      fromDate,
      toDate,
      `${formatDisplayDate(fromDate)} - ${formatDisplayDate(toDate)}`
    )
  }

  if (mode === "week") {
    const { year, week, start, end } = parseIsoWeek(searchParams.get("week"))

    return buildPeriod(
      "week",
      "Minggu",
      start,
      end,
      `Minggu ${week}, ${year} (${formatDisplayDate(start)} - ${formatDisplayDate(end)})`
    )
  }

  if (mode === "month") {
    const { year, month, start, end } = parseMonth(searchParams.get("month"))

    return buildPeriod("month", "Bulan", start, end, formatDisplayMonth(year, month))
  }

  if (mode === "year") {
    const year = parseYear(searchParams.get("year"))

    return buildPeriod("year", "Tahun", createUtcDate(year, 0, 1), createUtcDate(year, 11, 31), String(year))
  }

  throw new Error("Mode export tidak valid")
}

function formatTime(value: Date | null | undefined, timeZone: string) {
  if (!value) return "-"

  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone,
  }).format(value)
}

function getRecordStatusLabel(status: string) {
  return STATUS_LABELS[status] || status || "-"
}

function getGpsValue(record: GtkAttendanceRecord) {
  return record.checkInLat !== null && record.checkInLat !== undefined && record.checkInLng !== null && record.checkInLng !== undefined
    ? `${record.checkInLat}, ${record.checkInLng}`
    : "-"
}

function styleTitleRow(worksheet: any, cellRef: string, title: string) {
  const cell = worksheet.getCell(cellRef)
  cell.value = title
  cell.font = { bold: true, size: 16, color: { argb: "FFFFFFFF" } }
  cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0F766E" } }
  cell.alignment = { vertical: "middle" }
}

function styleHeaderRow(row: any) {
  row.font = { bold: true, color: { argb: "FFFFFFFF" } }
  row.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF134E4A" } }
  row.alignment = { vertical: "middle", wrapText: true }
  row.eachCell((cell: any) => {
    cell.border = {
      top: { style: "thin", color: { argb: "FFE2E8F0" } },
      left: { style: "thin", color: { argb: "FFE2E8F0" } },
      bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
      right: { style: "thin", color: { argb: "FFE2E8F0" } },
    }
  })
}

function styleBodyRows(worksheet: any, headerRowNumber: number) {
  for (let rowNumber = headerRowNumber + 1; rowNumber <= worksheet.rowCount; rowNumber += 1) {
    const row = worksheet.getRow(rowNumber)
    row.eachCell((cell: any) => {
      cell.border = {
        top: { style: "thin", color: { argb: "FFE2E8F0" } },
        left: { style: "thin", color: { argb: "FFE2E8F0" } },
        bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
        right: { style: "thin", color: { argb: "FFE2E8F0" } },
      }
      cell.alignment = { vertical: "top", wrapText: true }
    })
  }
}

export async function createGtkAttendanceExportWorkbook(params: {
  tenantName: string
  period: GtkAttendanceExportPeriod
  staff: GtkAttendanceStaff[]
  records: GtkAttendanceRecord[]
  timeZone?: string
}) {
  const ExcelJS = (await import("exceljs")).default
  const workbook = new ExcelJS.Workbook()
  const timeZone = params.timeZone || "Asia/Jakarta"

  workbook.creator = "SchoolPro"
  workbook.created = new Date()
  workbook.modified = new Date()
  workbook.subject = "Laporan Presensi GTK"
  workbook.title = `Laporan Presensi GTK ${params.period.label}`

  const staffById = new Map<string, GtkAttendanceStaff>()
  params.staff.forEach((staff) => staffById.set(staff.id, staff))
  params.records.forEach((record) => {
    if (record.staff && !staffById.has(record.staff.id)) staffById.set(record.staff.id, record.staff)
  })

  const summaryRows = [...staffById.values()].map((staff) => {
    const staffRecords = params.records.filter((record) => record.staff?.id === staff.id)
    const counts = STATUS_KEYS.reduce<Record<string, number>>((acc, status) => {
      acc[status] = staffRecords.filter((record) => record.status === status).length
      return acc
    }, {})
    const total = staffRecords.length

    return {
      staff,
      hadir: counts.HADIR || 0,
      izin: counts.IZIN || 0,
      sakit: counts.SAKIT || 0,
      alpha: counts.ALPHA || 0,
      total,
      percentage: total > 0 ? (counts.HADIR || 0) / total : 0,
    }
  })

  const summary = workbook.addWorksheet("Ringkasan")
  summary.views = [{ state: "frozen", ySplit: 4 }]
  summary.mergeCells("A1:H1")
  summary.mergeCells("A2:H2")
  styleTitleRow(summary, "A1", "Laporan Presensi GTK")
  summary.getCell("A2").value = `${params.tenantName} | ${params.period.modeLabel}: ${params.period.label}`
  summary.getCell("A2").font = { italic: true, color: { argb: "FF475569" } }
  summary.getCell("A2").fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF8FAFC" } }
  summary.getRow(4).values = ["Nama GTK", "Jabatan", "Hadir", "Izin", "Sakit", "Alpha", "Total Record", "Kehadiran"]
  styleHeaderRow(summary.getRow(4))
  summary.columns = [
    { key: "name", width: 30 },
    { key: "role", width: 22 },
    { key: "hadir", width: 12 },
    { key: "izin", width: 12 },
    { key: "sakit", width: 12 },
    { key: "alpha", width: 12 },
    { key: "total", width: 14 },
    { key: "percentage", width: 14 },
  ]

  summaryRows.forEach((row) => {
    summary.addRow([
      row.staff.name,
      row.staff.role || "Staf",
      row.hadir,
      row.izin,
      row.sakit,
      row.alpha,
      row.total,
      row.percentage,
    ])
  })
  summary.getColumn(8).numFmt = "0%"
  summary.autoFilter = { from: "A4", to: "H4" }
  styleBodyRows(summary, 4)

  const detail = workbook.addWorksheet("Log Detail")
  detail.views = [{ state: "frozen", ySplit: 4 }]
  detail.mergeCells("A1:J1")
  detail.mergeCells("A2:J2")
  styleTitleRow(detail, "A1", "Log Detail Presensi GTK")
  detail.getCell("A2").value = `${params.tenantName} | ${params.period.modeLabel}: ${params.period.label}`
  detail.getCell("A2").font = { italic: true, color: { argb: "FF475569" } }
  detail.getCell("A2").fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF8FAFC" } }
  detail.getRow(4).values = ["Tanggal", "Nama GTK", "Jabatan", "Status", "Jam Masuk", "Jam Pulang", "GPS", "Catatan", "Dibuat", "Diubah"]
  styleHeaderRow(detail.getRow(4))
  detail.columns = [
    { key: "date", width: 14 },
    { key: "name", width: 30 },
    { key: "role", width: 22 },
    { key: "status", width: 14 },
    { key: "checkIn", width: 12 },
    { key: "checkOut", width: 12 },
    { key: "gps", width: 24 },
    { key: "notes", width: 36 },
    { key: "created", width: 18 },
    { key: "updated", width: 18 },
  ]

  params.records.forEach((record: GtkAttendanceRecord & { createdAt?: Date | null; updatedAt?: Date | null }) => {
    detail.addRow([
      record.date,
      record.staff?.name || "-",
      record.staff?.role || "Staf",
      getRecordStatusLabel(record.status),
      formatTime(record.checkInAt, timeZone),
      formatTime(record.checkOutAt, timeZone),
      getGpsValue(record),
      record.notes || "-",
      record.createdAt || null,
      record.updatedAt || null,
    ])
  })
  detail.getColumn(1).numFmt = "yyyy-mm-dd"
  detail.getColumn(9).numFmt = "yyyy-mm-dd hh:mm"
  detail.getColumn(10).numFmt = "yyyy-mm-dd hh:mm"
  detail.autoFilter = { from: "A4", to: "J4" }
  styleBodyRows(detail, 4)

  return Buffer.from(await workbook.xlsx.writeBuffer())
}
