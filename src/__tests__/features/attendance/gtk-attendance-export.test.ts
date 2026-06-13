import { describe, expect, it } from "vitest"
import { formatDateInput, resolveGtkAttendanceExportPeriod } from "@/features/attendance/services/gtk-attendance-export.service"

describe("resolveGtkAttendanceExportPeriod", () => {
  it("resolves a custom date range", () => {
    const period = resolveGtkAttendanceExportPeriod(new URLSearchParams({
      mode: "range",
      from: "2026-06-01",
      to: "2026-06-13",
    }))

    expect(period.mode).toBe("range")
    expect(formatDateInput(period.fromDate)).toBe("2026-06-01")
    expect(formatDateInput(period.toDate)).toBe("2026-06-13")
    expect(period.slug).toBe("2026-06-01_sd_2026-06-13")
  })

  it("resolves an ISO week as Monday through Sunday", () => {
    const period = resolveGtkAttendanceExportPeriod(new URLSearchParams({
      mode: "week",
      week: "2026-W24",
    }))

    expect(formatDateInput(period.fromDate)).toBe("2026-06-08")
    expect(formatDateInput(period.toDate)).toBe("2026-06-14")
  })

  it("resolves a full selected month", () => {
    const period = resolveGtkAttendanceExportPeriod(new URLSearchParams({
      mode: "month",
      month: "2026-02",
    }))

    expect(formatDateInput(period.fromDate)).toBe("2026-02-01")
    expect(formatDateInput(period.toDate)).toBe("2026-02-28")
  })

  it("resolves a full selected year", () => {
    const period = resolveGtkAttendanceExportPeriod(new URLSearchParams({
      mode: "year",
      year: "2026",
    }))

    expect(formatDateInput(period.fromDate)).toBe("2026-01-01")
    expect(formatDateInput(period.toDate)).toBe("2026-12-31")
  })
})
