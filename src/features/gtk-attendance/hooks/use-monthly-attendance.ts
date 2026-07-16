"use client"
import { useState, useEffect, useMemo } from "react"
import { format, startOfMonth, endOfMonth } from "date-fns"
import { parseMonthStr } from "../helpers"
import type { StaffRecord, StaffSummary } from "../types"

export function useMonthlyAttendance(tenantId?: string, staffList: any[] = []) {
  const [selectedMonth, setSelectedMonth] = useState(() => format(new Date(), "yyyy-MM"))
  const [monthlyRecords, setMonthlyRecords] = useState<StaffRecord[]>([])
  const [monthlyLoading, setMonthlyLoading] = useState(false)
  const [monthlySearch, setMonthlySearch] = useState("")

  const fetchMonthlyRecords = async () => {
    if (!tenantId) return
    setMonthlyLoading(true)
    try {
      const parsed = parseMonthStr(selectedMonth)
      const start = format(startOfMonth(parsed), "yyyy-MM-dd")
      const end = format(endOfMonth(parsed), "yyyy-MM-dd")
      const params = new URLSearchParams({
        tenantId,
        from: start,
        to: end,
        take: "200",
      })
      const res = await fetch(`/api/gtk/attendance?${params}`)
      const data = await res.json()
      setMonthlyRecords(data.data || [])
    } catch (e) {
      console.error(e)
    } finally {
      setMonthlyLoading(false)
    }
  }

  useEffect(() => {
    fetchMonthlyRecords()
  }, [tenantId, selectedMonth])

  const monthlySummary: StaffSummary[] = useMemo(() => {
    return staffList.map((s: any) => {
      const staffRecs = monthlyRecords.filter(r => r.staff?.id === s.id)
      const hadir = staffRecs.filter(r => r.status === "HADIR").length
      const izin = staffRecs.filter(r => r.status === "IZIN").length
      const sakit = staffRecs.filter(r => r.status === "SAKIT").length
      const alpha = staffRecs.filter(r => r.status === "ALPHA").length
      const total = staffRecs.length
      return {
        ...s,
        hadir,
        izin,
        sakit,
        alpha,
        total,
        percentage: total > 0 ? Math.round((hadir / total) * 100) : 0,
      }
    })
  }, [staffList, monthlyRecords])

  const filteredMonthlySummary = useMemo(() => {
    if (!monthlySearch) return monthlySummary
    return monthlySummary.filter(s =>
      s.name.toLowerCase().includes(monthlySearch.toLowerCase()) ||
      s.role?.toLowerCase().includes(monthlySearch.toLowerCase())
    )
  }, [monthlySummary, monthlySearch])

  return {
    selectedMonth,
    setSelectedMonth,
    monthlyRecords,
    monthlyLoading,
    monthlySearch,
    setMonthlySearch,
    filteredMonthlySummary,
    refetch: fetchMonthlyRecords,
  }
}
