export const STATUS_CFG: Record<string, { label: string; color: string; badgeCls: string }> = {
  HADIR: { label: "Hadir", color: "text-emerald-600", badgeCls: "bg-emerald-500/10 text-emerald-600 border-emerald-300" },
  IZIN: { label: "Izin", color: "text-blue-600", badgeCls: "bg-blue-500/10 text-blue-600 border-blue-300" },
  SAKIT: { label: "Sakit", color: "text-amber-600", badgeCls: "bg-amber-500/10 text-amber-600 border-amber-300" },
  ALPHA: { label: "Alpha", color: "text-red-600", badgeCls: "bg-red-500/10 text-red-600 border-red-300" },
  BELUM_ABSEN: { label: "Belum Absen", color: "text-zinc-500", badgeCls: "bg-zinc-500/10 text-zinc-500 border-zinc-300" },
}

export type StaffRecord = {
  id: string; date: string; status: string
  checkInAt?: string; checkOutAt?: string
  checkInLat?: number; checkInLng?: number; notes?: string
  staff: { id: string; name: string; role: string; imageUrl?: string }
}

export type ExportMode = "range" | "week" | "month" | "year"

export type ManualFormState = {
  staffId: string
  staffName: string
  date: string
  status: string
  checkInTime: string
  checkOutTime: string
  notes: string
}

export type StaffSummary = {
  id: string
  name: string
  role?: string
  imageUrl?: string
  hadir: number
  izin: number
  sakit: number
  alpha: number
  total: number
  percentage: number
}

export type KPICard = {
  label: string
  value: number
  icon: React.ComponentType<{ className?: string }>
  color: string
  badge: string
}
