import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Zap, Star, CreditCard, Timer, GripVertical, CheckCircle2, X, Save } from "lucide-react"
import { cn } from "@/lib/utils"
import { SubscriptionPlan } from "./types"

interface EditPlanModalProps {
  isOpen: boolean
  onClose: () => void
  plan: Partial<SubscriptionPlan> | null
  onUpdatePlan: (plan: Partial<SubscriptionPlan>) => void
  pricing: { PRICE_PER_STUDENT: string; MIN_STUDENTS: string; INVOICE_EXPIRY_DAYS: string }
  onUpdatePricing: (pricing: any) => void
  onSave: () => void
  saving: boolean
}

export function EditPlanModal({ isOpen, onClose, plan, onUpdatePlan, pricing, onUpdatePricing, onSave, saving }: EditPlanModalProps) {
  const [featureInput, setFeatureInput] = useState("")
  const [draggedFeatureIdx, setDraggedFeatureIdx] = useState<number | null>(null)
  const [dragOverFeatureIdx, setDragOverFeatureIdx] = useState<number | null>(null)

  if (!plan) return null

  const isProPlan = plan.slug === "pro"
  const feats = Array.isArray(plan.features) ? plan.features : []

  const addFeature = () => {
    const trimmed = featureInput.trim()
    if (!trimmed) return
    onUpdatePlan({ ...plan, features: [...feats, trimmed] })
    setFeatureInput("")
  }

  const removeFeature = (idx: number) => {
    onUpdatePlan({ ...plan, features: feats.filter((_: any, i: number) => i !== idx) })
  }

  const handleDragStart = (e: React.DragEvent<HTMLLIElement>, idx: number) => {
    setDraggedFeatureIdx(idx)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDragOver = (e: React.DragEvent<HTMLLIElement>, idx: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    if (dragOverFeatureIdx !== idx) {
      setDragOverFeatureIdx(idx)
    }
  }

  const handleDragEnd = () => {
    setDraggedFeatureIdx(null)
    setDragOverFeatureIdx(null)
  }

  const handleDrop = (e: React.DragEvent<HTMLLIElement>, dropIdx: number) => {
    e.preventDefault()
    if (draggedFeatureIdx === null || draggedFeatureIdx === dropIdx) {
      handleDragEnd()
      return
    }

    const newFeats = [...feats]
    const draggedItem = newFeats[draggedFeatureIdx]
    newFeats.splice(draggedFeatureIdx, 1)
    newFeats.splice(dropIdx, 0, draggedItem)

    onUpdatePlan({ ...plan, features: newFeats })
    handleDragEnd()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl rounded-3xl p-0 overflow-hidden border-0 shadow-2xl">
        <DialogHeader className="px-6 pt-6 pb-3 border-b border-border/50">
          <DialogTitle className="text-lg font-bold flex items-center gap-2">
            <div className={cn("p-1.5 rounded-lg", isProPlan ? "bg-primary/10 text-primary" : "bg-slate-100 text-slate-600")}>
              {isProPlan ? <Star className="h-4 w-4" /> : <Zap className="h-4 w-4" />}
            </div>
            Edit Paket {plan.name}
          </DialogTitle>
          <DialogDescription>
            Perbarui konfigurasi dan fitur paket ini.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-5 space-y-5 overflow-y-auto max-h-[70vh]">
          {/* Name + Description */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Nama Paket</Label>
              <Input
                value={plan.name || ""}
                onChange={e => onUpdatePlan({ ...plan, name: e.target.value })}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Urutan Tampil</Label>
              <Input
                type="number"
                value={plan.sortOrder ?? 0}
                onChange={e => onUpdatePlan({ ...plan, sortOrder: Number(e.target.value) })}
                className="rounded-xl"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Deskripsi Singkat</Label>
            <Input
              value={plan.description || ""}
              onChange={e => onUpdatePlan({ ...plan, description: e.target.value })}
              placeholder="Penjelasan singkat paket"
              className="rounded-xl"
            />
          </div>

          {/* Price fields — only for FREE plan */}
          {!isProPlan && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Harga (Rp)</Label>
                <Input
                  type="number"
                  value={plan.price || 0}
                  onChange={e => onUpdatePlan({ ...plan, price: Number(e.target.value) })}
                  className="rounded-xl font-bold text-primary"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Periode Tagihan</Label>
                <Select value={plan.interval} onValueChange={(value) => onUpdatePlan({ ...plan, interval: value })}>
                  <SelectTrigger className="w-full h-10 rounded-xl">
                    <SelectValue placeholder="Periode Tagihan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MONTHLY">Bulanan</SelectItem>
                    <SelectItem value="YEARLY">Tahunan</SelectItem>
                    <SelectItem value="ONETIME">Sekali Bayar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* PRO Pricing Config — only for PRO plan */}
          {isProPlan && (
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 space-y-4">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-primary" />
                <p className="text-sm font-bold text-primary">Konfigurasi Harga Pay-per-Student</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Harga per Klien (Rp / Tahun)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">Rp</span>
                    <Input
                      type="number"
                      value={pricing.PRICE_PER_STUDENT}
                      onChange={e => onUpdatePricing({ ...pricing, PRICE_PER_STUDENT: e.target.value })}
                      className="rounded-xl pl-8 font-bold text-primary"
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    Contoh: 50 klien = Rp {(50 * Number(pricing.PRICE_PER_STUDENT)).toLocaleString("id-ID")}
                  </p>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Minimal Pembelian Klien</Label>
                  <Input
                    type="number"
                    value={pricing.MIN_STUDENTS}
                    onChange={e => onUpdatePricing({ ...pricing, MIN_STUDENTS: e.target.value })}
                    className="rounded-xl font-bold"
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Minimal <strong>{pricing.MIN_STUDENTS}</strong> klien per upgrade.
                  </p>
                </div>
              </div>

              {/* Masa Aktif Invoice */}
              <div className="mt-4 pt-4 border-t border-primary/15">
                <div className="flex items-center gap-2 mb-3">
                  <Timer className="h-4 w-4 text-amber-500" />
                  <p className="text-sm font-bold text-amber-600">Masa Aktif Invoice</p>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Batas Waktu Pembayaran (Hari)</Label>
                  <Input
                    type="number"
                    min={1}
                    max={30}
                    value={pricing.INVOICE_EXPIRY_DAYS}
                    onChange={e => onUpdatePricing({ ...pricing, INVOICE_EXPIRY_DAYS: e.target.value })}
                    className="rounded-xl font-bold w-full md:w-1/2"
                  />
                  <p className="text-[10px] text-muted-foreground leading-relaxed">
                    Invoice yang dibuat akan berlaku selama <strong>{pricing.INVOICE_EXPIRY_DAYS} hari</strong> sejak tanggal pembuatan.
                    Mengubah nilai ini akan <strong>memperbarui semua invoice pending</strong> yang ada saat ini.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Quotas */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Klien</Label>
              <Input
                type="number"
                value={plan.maxTeamMembers ?? 0}
                onChange={e => onUpdatePlan({ ...plan, maxTeamMembers: Number(e.target.value) })}
                className="rounded-xl"
                disabled={isProPlan}
              />
              <p className="text-[9px] text-muted-foreground leading-tight">
                {isProPlan ? "Sesuai invoice" : "0 = Unlimited"}
              </p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Penyimpanan</Label>
              <Input
                type="number"
                value={plan.maxStorage ?? 1024}
                onChange={e => onUpdatePlan({ ...plan, maxStorage: Number(e.target.value) })}
                className="rounded-xl"
              />
              <p className="text-[9px] text-muted-foreground leading-tight">Dalam MB (1024 = 1GB)</p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Bonus AI</Label>
              <Input
                type="number"
                value={plan.monthlyAiTokens ?? 0}
                onChange={e => onUpdatePlan({ ...plan, monthlyAiTokens: Number(e.target.value) })}
                className="rounded-xl"
              />
              <p className="text-[9px] text-muted-foreground leading-tight">Token / Bulan</p>
            </div>
          </div>

          {/* Feature Builder */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold">Fitur Unggulan</Label>
            <div className="flex gap-2">
              <Input
                value={featureInput}
                onChange={e => setFeatureInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addFeature())}
                placeholder="Ketik fitur lalu tekan Enter..."
                className="rounded-xl flex-1"
              />
              <Button type="button" variant="outline" className="rounded-xl shrink-0" onClick={addFeature}>
                Tambah
              </Button>
            </div>
            
            {feats.length > 0 ? (
              <ul className="space-y-1.5 mt-2">
                {feats.map((feat: string, i: number) => (
                  <li 
                    key={i} 
                    draggable
                    onDragStart={(e) => handleDragStart(e, i)}
                    onDragOver={(e) => handleDragOver(e, i)}
                    onDragEnd={handleDragEnd}
                    onDrop={(e) => handleDrop(e, i)}
                    className={cn(
                      "flex items-center gap-2 rounded-xl px-3 py-2 text-sm group cursor-grab active:cursor-grabbing transition-colors",
                      draggedFeatureIdx === i ? "bg-primary/20 opacity-50" : "bg-muted/40 hover:bg-muted",
                      dragOverFeatureIdx === i && draggedFeatureIdx !== i ? "border-t-2 border-primary" : "border border-transparent"
                    )}
                  >
                    <GripVertical className="h-4 w-4 text-muted-foreground/50 cursor-grab shrink-0 hover:text-foreground" />
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    <span className="flex-1 select-none">{feat}</span>
                    <Button
                      onClick={() => removeFeature(i)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive h-6 w-6 p-0"
                      variant="ghost"
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-muted-foreground italic">Belum ada fitur ditambahkan.</p>
            )}
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t bg-muted/20 gap-2">
          <Button variant="ghost" className="rounded-xl" onClick={onClose}>
            Batal
          </Button>
          <Button
            className="justify-center items-center flex rounded-xl btn-gradient text-white border-0 px-8 gap-2 h-10"
            onClick={onSave}
            disabled={saving}
          >
            {saving ? (
              <><div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> Menyimpan...</>
            ) : (
              <><Save className="h-4 w-4" /> Simpan Perubahan</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
