"use client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { X, Loader2, LogIn, LogOut } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ManualFormState } from "../types"

type AttendanceEditModalProps = {
  open: boolean
  saving: boolean
  manualForm: ManualFormState
  staffList: any[]
  onClose: () => void
  onSave: () => void
  onFormChange: (updater: (prev: ManualFormState) => ManualFormState) => void
}

export function AttendanceEditModal({ open, saving, manualForm, staffList, onClose, onSave, onFormChange }: AttendanceEditModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Tutup modal koreksi absensi"
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl w-full max-w-md p-6 overflow-hidden flex flex-col gap-4 animate-in fade-in zoom-in duration-200">

        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
          <div>
            <h3 className="font-black text-base tracking-tight text-foreground">Koreksi Absensi</h3>
            <p className="text-[11px] text-muted-foreground">Koreksi status & waktu absen guru/staf.</p>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Form */}
        <div className="space-y-4 text-left">
          {/* Staff Select */}
          <div className="space-y-1">
            <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Guru / Staf</Label>
            <Select value={manualForm.staffId} onValueChange={(val) => {
              const found = staffList.find((s: any) => s.id === val)
              onFormChange(prev => ({ ...prev, staffId: val, staffName: found?.name || "" }))
            }}>
              <SelectTrigger className="rounded-xl h-10 text-xs">
                <SelectValue placeholder="Pilih guru/staf..." />
              </SelectTrigger>
              <SelectContent>
                {staffList.map((s: any) => (
                  <SelectItem key={s.id} value={s.id} className="text-xs">{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date */}
          <div className="space-y-1">
            <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Tanggal Absen</Label>
            <Input
              type="date"
              value={manualForm.date}
              onChange={e => onFormChange(f => ({ ...f, date: e.target.value }))}
              className="rounded-xl h-10 text-xs"
            />
          </div>

          {/* Status */}
          <div className="space-y-1.5">
            <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Status Kehadiran</Label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { key: "HADIR", label: "Hadir", activeCls: "bg-emerald-500 text-white border-emerald-500 hover:bg-emerald-600", normalCls: "border-emerald-200 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20" },
                { key: "IZIN", label: "Izin", activeCls: "bg-blue-500 text-white border-blue-500 hover:bg-blue-600", normalCls: "border-blue-200 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/20" },
                { key: "SAKIT", label: "Sakit", activeCls: "bg-amber-500 text-white border-amber-500 hover:bg-amber-600", normalCls: "border-amber-200 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/20" },
                { key: "ALPHA", label: "Alpha", activeCls: "bg-red-500 text-white border-red-500 hover:bg-red-600", normalCls: "border-red-200 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20" },
              ].map((btn) => {
                const isActive = manualForm.status === btn.key
                return (
                  <Button
                    variant="ghost"
                    type="button"
                    key={btn.key}
                    onClick={() => onFormChange(f => ({ ...f, status: btn.key }))}
                    className={cn(
                      "h-auto px-0 py-1.5 text-center text-xs font-semibold border rounded-xl transition-all shadow-sm",
                      isActive ? btn.activeCls : btn.normalCls
                    )}
                  >
                    {btn.label}
                  </Button>
                )
              })}
            </div>
          </div>

          {/* Time */}
          {manualForm.status === "HADIR" && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <LogIn className="h-3 w-3 text-emerald-600" /> Jam Masuk
                </Label>
                <Input type="time" value={manualForm.checkInTime} onChange={e => onFormChange(f => ({ ...f, checkInTime: e.target.value }))} className="rounded-xl h-10 text-xs font-mono" />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <LogOut className="h-3 w-3 text-red-600" /> Jam Pulang
                </Label>
                <Input type="time" value={manualForm.checkOutTime} onChange={e => onFormChange(f => ({ ...f, checkOutTime: e.target.value }))} className="rounded-xl h-10 text-xs font-mono" />
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-1">
            <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Catatan / Alasan</Label>
            <Textarea
              placeholder="Isikan keterangan (misal: dinas luar, lupa scan masuk, dsb.)..."
              value={manualForm.notes}
              onChange={e => onFormChange(f => ({ ...f, notes: e.target.value }))}
              className="rounded-xl text-xs h-20"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800 justify-end">
          <Button variant="outline" className="rounded-xl font-semibold text-xs" onClick={onClose}>
            Batal
          </Button>
          <Button onClick={onSave} disabled={saving} className="rounded-xl font-semibold text-xs min-w-[80px]">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Simpan"}
          </Button>
        </div>
      </div>
    </div>
  )
}
