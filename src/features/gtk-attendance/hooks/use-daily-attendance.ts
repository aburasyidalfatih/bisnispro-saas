"use client"
import { useState, useEffect, useMemo } from "react"
import { format } from "date-fns"
import type { StaffRecord } from "../types"

export function useDailyAttendance(tenantId?: string, staffList: any[] = []) {
  const [selectedDate, setSelectedDate] = useState(() => format(new Date(), "yyyy-MM-dd"))
  const [todayRecords, setTodayRecords] = useState<StaffRecord[]>([])
  const [todayLoading, setTodayLoading] = useState(false)
  const [todaySearch, setTodaySearch] = useState("")

  const fetchTodayRecords = async () => {
    if (!tenantId) return
    setTodayLoading(true)
    try {
      const params = new URLSearchParams({
        tenantId,
        from: selectedDate,
        to: selectedDate,
        take: "50",
      })
      const res = await fetch(`/api/gtk/attendance?${params}`)
      const data = await res.json()
      setTodayRecords(data.data || [])
    } catch (e) {
      console.error(e)
    } finally {
      setTodayLoading(false)
    }
  }

  useEffect(() => {
    fetchTodayRecords()
  }, [tenantId, selectedDate])

  const filteredTodayStaffList = useMemo(() => {
    const list = staffList.map((s: any) => {
      const record = todayRecords.find(r => r.staff?.id === s.id)
      return {
        staff: s,
        record: record,
        status: record ? record.status : "BELUM_ABSEN",
      }
    })
    if (!todaySearch) return list
    return list.filter(item =>
      item.staff.name.toLowerCase().includes(todaySearch.toLowerCase()) ||
      item.staff.role?.toLowerCase().includes(todaySearch.toLowerCase())
    )
  }, [staffList, todayRecords, todaySearch])

  const todayStats = useMemo(() => {
    const total = staffList.length
    const hadir = todayRecords.filter(r => r.status === "HADIR").length
    const izinSakit = todayRecords.filter(r => r.status === "IZIN" || r.status === "SAKIT").length
    const belumAbsen = total - todayRecords.filter(r => ["HADIR", "IZIN", "SAKIT", "ALPHA"].includes(r.status)).length
    return { total, hadir, izinSakit, belumAbsen }
  }, [staffList, todayRecords])

  return {
    selectedDate,
    setSelectedDate,
    todayRecords,
    todayLoading,
    todaySearch,
    setTodaySearch,
    filteredTodayStaffList,
    todayStats,
    refetch: fetchTodayRecords,
  }
}
