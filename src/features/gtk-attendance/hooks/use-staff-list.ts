"use client"
import { useState, useEffect } from "react"

export function useStaffList(tenantId?: string) {
  const [staffList, setStaffList] = useState<any[]>([])

  useEffect(() => {
    if (!tenantId) return
    fetch(`/api/gtk/staff?tenantId=${tenantId}`)
      .then(r => r.json())
      .then(d => setStaffList(d.staff || []))
      .catch(console.error)
  }, [tenantId])

  return staffList
}
