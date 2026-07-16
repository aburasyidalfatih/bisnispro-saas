"use client"
import { useState } from "react"
import { format } from "date-fns"
import { getHHMM } from "../helpers"
import type { ManualFormState, StaffRecord } from "../types"

type UseAttendanceModalArgs = {
  tenantId?: string
  defaultDate?: string
  toast: (opts: { title: string; description?: string; variant?: "default" | "destructive" }) => void
  onSaved?: () => void
}

const initialForm: ManualFormState = {
  staffId: "",
  staffName: "",
  date: "",
  status: "HADIR",
  checkInTime: "",
  checkOutTime: "",
  notes: "",
}

export function useAttendanceModal({ tenantId, defaultDate, toast, onSaved }: UseAttendanceModalArgs) {
  const [openModal, setOpenModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [manualForm, setManualForm] = useState<ManualFormState>(initialForm)

  const handleOpenEdit = (staff: any, record?: StaffRecord) => {
    setManualForm({
      staffId: staff.id,
      staffName: staff.name,
      date: record ? format(new Date(record.date), "yyyy-MM-dd") : (defaultDate || format(new Date(), "yyyy-MM-dd")),
      status: record ? record.status : "HADIR",
      checkInTime: record ? getHHMM(record.checkInAt) : "",
      checkOutTime: record ? getHHMM(record.checkOutAt) : "",
      notes: record ? (record.notes || "") : "",
    })
    setOpenModal(true)
  }

  const handleManualSave = async () => {
    if (!tenantId || !manualForm.staffId) {
      return toast({ title: "Pilih guru terlebih dahulu", variant: "destructive" })
    }
    setSaving(true)
    try {
      let checkInAt: string | undefined = undefined
      let checkOutAt: string | undefined = undefined

      if (manualForm.status === "HADIR") {
        if (manualForm.checkInTime) {
          checkInAt = new Date(`${manualForm.date}T${manualForm.checkInTime}:00`).toISOString()
        }
        if (manualForm.checkOutTime) {
          checkOutAt = new Date(`${manualForm.date}T${manualForm.checkOutTime}:00`).toISOString()
        }
      }

      const payload = {
        tenantId,
        staffId: manualForm.staffId,
        date: manualForm.date,
        status: manualForm.status,
        checkInAt,
        checkOutAt,
        notes: manualForm.notes || "",
      }

      const res = await fetch("/api/gtk/attendance/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        throw new Error((await res.json()).error)
      }

      toast({ title: "Absensi berhasil disimpan!" })
      setOpenModal(false)
      onSaved?.()
    } catch (err: any) {
      toast({ title: "Gagal menyimpan absensi", description: err.message, variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  return {
    openModal, setOpenModal,
    saving,
    manualForm, setManualForm,
    handleOpenEdit,
    handleManualSave,
  }
}
