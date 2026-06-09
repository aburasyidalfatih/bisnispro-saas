"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { toast } from "@/hooks/use-toast"
import {
  Zap, Star, CheckCircle2,
  Users, Edit, X, HardDrive, CreditCard, Save, Timer
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"

interface SubscriptionPlan {
  id: string
  name: string
  slug: string
  description: string | null
  price: number
  interval: string
  features: any
  maxStudents: number
  maxStorage: number
  monthlyAiTokens: number
  isActive: boolean
  isPopular: boolean
  sortOrder: number
}

export default function PlansPage() {
  const [loading, setLoading] = useState(true)
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [editingPlan, setEditingPlan] = useState<Partial<SubscriptionPlan> | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  // Feature input (only the text field, list lives inside editingPlan.features)
  const [featureInput, setFeatureInput] = useState("")

  // PRO pricing config (only relevant when editing PRO plan)
  const [pricing, setPricing] = useState({ PRICE_PER_STUDENT: "30000", MIN_STUDENTS: "50", INVOICE_EXPIRY_DAYS: "1" })

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [plansRes, settingsRes] = await Promise.all([
        fetch("/api/super-admin/plans"),
        fetch("/api/super-admin/settings"),
      ])
      const plansData = await plansRes.json()
      const settingsData = await settingsRes.json()
      // Stable order: free always left, lite middle, pro always right
      const ORDER = ["free", "lite", "pro"]
      const sorted = [...plansData].sort(
        (a: any, b: any) => {
          const indexA = ORDER.indexOf(a.slug);
          const indexB = ORDER.indexOf(b.slug);
          // If a slug is not in ORDER, put it at the end
          const sortA = indexA === -1 ? 999 : indexA;
          const sortB = indexB === -1 ? 999 : indexB;
          return sortA - sortB;
        }
      )
      setPlans(sorted)
      setPricing({
        PRICE_PER_STUDENT: settingsData.PRICE_PER_STUDENT || "30000",
        MIN_STUDENTS: settingsData.MIN_STUDENTS || "50",
        INVOICE_EXPIRY_DAYS: settingsData.INVOICE_EXPIRY_DAYS || "1",
      })
    } catch {
      toast({ title: "Error", description: "Gagal memuat data.", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAll() }, [])

  const openEdit = (plan: SubscriptionPlan) => {
    // Normalize features: DB may return array OR JSON string (from seed/old saves)
    let feats: string[] = []
    if (Array.isArray(plan.features)) {
      feats = plan.features.filter((f: any) => typeof f === "string")
    } else if (typeof plan.features === "string" && plan.features) {
      try { feats = JSON.parse(plan.features) } catch { feats = [] }
    }
    setEditingPlan({ ...plan, features: feats })
    setFeatureInput("")
    setIsDialogOpen(true)
  }

  const addFeature = () => {
    const trimmed = featureInput.trim()
    if (!trimmed || !editingPlan) return
    setEditingPlan(prev => ({ ...prev!, features: [...(Array.isArray(prev?.features) ? prev!.features : []), trimmed] }))
    setFeatureInput("")
  }

  const removeFeature = (idx: number) => {
    if (!editingPlan) return
    setEditingPlan(prev => ({ ...prev!, features: (Array.isArray(prev?.features) ? prev!.features : []).filter((_: any, i: number) => i !== idx) }))
  }

  const handleSave = async () => {
    if (!editingPlan?.name?.trim()) {
      toast({ title: "Validasi", description: "Nama paket wajib diisi.", variant: "destructive" })
      return
    }

    setSaving(true)
    try {
      const isProPlan = editingPlan.slug === "pro"

      // Save plan data — features already stored as array in editingPlan.features
      const feats = Array.isArray(editingPlan.features) ? editingPlan.features : []
      const method = editingPlan.id ? "PUT" : "POST"
      const res = await fetch("/api/super-admin/plans", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...editingPlan,
          features: JSON.stringify(feats),
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Gagal menyimpan paket")
      }

      // If PRO plan, also save pricing config
      if (isProPlan) {
        const pricingRes = await fetch("/api/super-admin/settings", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(pricing),
        })
        if (!pricingRes.ok) throw new Error("Gagal menyimpan konfigurasi harga")
        const pricingResult = await pricingRes.json()
        if (pricingResult.affectedInvoices > 0) {
          toast({
            title: "Invoice Diperbarui",
            description: `${pricingResult.affectedInvoices} invoice pending telah diperbarui masa aktifnya menjadi ${pricing.INVOICE_EXPIRY_DAYS} hari.`,
          })
        }
      }

      toast({ title: "Berhasil", description: "Paket berhasil diperbarui." })
      setIsDialogOpen(false)
      fetchAll()
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const handleToggleActive = async (plan: SubscriptionPlan) => {
    if (plan.slug === "free") return
    try {
      const planPayload = {
        ...plan,
        isActive: !plan.isActive,
        features: JSON.stringify(plan.features || []),
      }
      const res = await fetch(`/api/super-admin/plans`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(planPayload),
      })
      if (!res.ok) throw new Error("Gagal mengubah status paket")
      toast({ title: "Berhasil", description: `Paket ${plan.name} berhasil di${!plan.isActive ? "aktifkan" : "nonaktifkan"}.` })
      fetchAll()
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    }
  }

  const isProPlan = editingPlan?.slug === "pro"

  if (loading && plans.length === 0) {
    return <div className="space-y-4">{[1, 2].map(i => <div key={i} className="skeleton h-64 rounded-2xl" />)}</div>
  }

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Paket & Harga</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Kelola konfigurasi paket <strong>Free</strong>, <strong>Lite</strong>, dan <strong>PRO</strong> platform.
        </p>
      </div>

      {/* Plan Cards */}
      <div className="grid gap-6 lg:grid-cols-3">
        {plans.map((plan) => {
          const feats = Array.isArray(plan.features) ? plan.features : []
          return (
            <Card key={plan.id} className={cn("glass border-0 overflow-hidden relative", plan.isPopular && "ring-2 ring-primary/30")}>
              <div className={cn("h-1.5", plan.slug === "free" ? "bg-slate-400" : "bg-gradient-to-r from-primary to-primary/60")} />
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className={cn("p-2.5 rounded-xl", plan.slug === "free" ? "bg-slate-100 text-slate-600" : "bg-primary/10 text-primary")}>
                      {plan.slug === "free" ? <Zap className="h-5 w-5" /> : <Star className={cn("h-5 w-5", plan.isPopular && "fill-primary")} />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle>{plan.name}</CardTitle>
                        {plan.isPopular && <Badge className="bg-primary/10 text-primary text-[10px] h-5">Populer</Badge>}
                        {!plan.isActive && <Badge variant="outline" className="text-[10px] h-5 text-muted-foreground">Nonaktif</Badge>}
                      </div>
                      <CardDescription>{plan.description}</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {plan.slug !== "free" && (
                      <div className="flex items-center gap-1.5 mr-1">
                        <Switch
                          id={`active-${plan.id}`}
                          checked={plan.isActive}
                          onCheckedChange={() => handleToggleActive(plan)}
                          className="scale-90"
                        />
                      </div>
                    )}
                    <Button variant="outline" size="sm" className="gap-1 rounded-lg h-7 px-2 text-[10px]" onClick={() => openEdit(plan)}>
                      <Edit className="h-3 w-3" /> Edit
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Price */}
                <div className="text-2xl font-bold">
                  {plan.slug === "pro" ? (
                    <div>
                      <span className="text-base text-primary block font-bold">Pay-per-Student</span>
                      <span className="text-[10px] font-normal text-muted-foreground block mt-0.5">
                        Rp {Number(pricing.PRICE_PER_STUDENT).toLocaleString("id-ID")}/siswa/thn · min. {pricing.MIN_STUDENTS}
                      </span>
                    </div>
                  ) : (
                    <>
                      Rp {plan.price.toLocaleString("id-ID")}
                      <span className="text-xs font-normal text-muted-foreground">
                        {plan.interval === "MONTHLY" ? " / bulan" : plan.interval === "YEARLY" ? " / tahun" : " / sekali bayar"}
                      </span>
                    </>
                  )}
                </div>

                {/* Quotas */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  <div className="p-2.5 rounded-lg bg-muted/40 border border-border/40">
                    <p className="text-[9px] uppercase text-muted-foreground mb-0.5">Kuota Siswa</p>
                    <div className="flex items-center gap-1.5">
                      <Users className="h-3 w-3 text-primary" />
                      <span className="font-bold text-xs truncate">
                        {plan.slug === "pro" ? "Sesuai Beli" : plan.maxStudents === 0 ? "Unlimited" : `${plan.maxStudents} siswa`}
                      </span>
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-muted/40 border border-border/40">
                    <p className="text-[9px] uppercase text-muted-foreground mb-0.5">Penyimpanan</p>
                    <div className="flex items-center gap-1.5">
                      <HardDrive className="h-3 w-3 text-primary" />
                      <span className="font-bold text-xs truncate">
                        {plan.maxStorage === 0 ? "Unlimited" : plan.maxStorage >= 1024 ? `${(plan.maxStorage / 1024).toFixed(1)} GB` : `${plan.maxStorage} MB`}
                      </span>
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-muted/40 border border-border/40">
                    <p className="text-[9px] uppercase text-muted-foreground mb-0.5">Bonus AI (Bln)</p>
                    <div className="flex items-center gap-1.5">
                      <Zap className="h-3 w-3 text-primary" />
                      <span className="font-bold text-xs truncate">
                        {plan.monthlyAiTokens > 0 ? `${plan.monthlyAiTokens.toLocaleString("id-ID")} Token` : "-"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Features */}
                {feats.length > 0 && (
                  <ul className="space-y-1.5">
                    {feats.slice(0, 5).map((f: string, i: number) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                    {feats.length > 5 && (
                      <li className="text-xs text-muted-foreground pl-6">+ {feats.length - 5} fitur lainnya</li>
                    )}
                  </ul>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* ─── Edit Dialog ─── */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-xl rounded-3xl p-0 overflow-hidden border-0 shadow-2xl">
          <DialogHeader className="px-6 pt-6 pb-3 border-b border-border/50">
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <div className={cn("p-1.5 rounded-lg", isProPlan ? "bg-primary/10 text-primary" : "bg-slate-100 text-slate-600")}>
                {isProPlan ? <Star className="h-4 w-4" /> : <Zap className="h-4 w-4" />}
              </div>
              Edit Paket {editingPlan?.name}
            </DialogTitle>
            <DialogDescription>
              Perbarui konfigurasi dan fitur paket ini.
            </DialogDescription>
          </DialogHeader>

          {editingPlan && (
            <div className="px-6 py-5 space-y-5 overflow-y-auto max-h-[70vh]">

              {/* Name + Description */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Nama Paket</Label>
                  <Input
                    value={editingPlan.name || ""}
                    onChange={e => setEditingPlan({ ...editingPlan, name: e.target.value })}
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Urutan Tampil</Label>
                  <Input
                    type="number"
                    value={editingPlan.sortOrder ?? 0}
                    onChange={e => setEditingPlan({ ...editingPlan, sortOrder: Number(e.target.value) })}
                    className="rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Deskripsi Singkat</Label>
                <Input
                  value={editingPlan.description || ""}
                  onChange={e => setEditingPlan({ ...editingPlan, description: e.target.value })}
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
                      value={editingPlan.price || 0}
                      onChange={e => setEditingPlan({ ...editingPlan, price: Number(e.target.value) })}
                      className="rounded-xl font-bold text-primary"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Periode Tagihan</Label>
                    <Select value={editingPlan.interval} onValueChange={(value) => setEditingPlan({ ...editingPlan, interval: value })}>
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
                      <Label className="text-xs font-semibold">Harga per Siswa (Rp / Tahun)</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">Rp</span>
                        <Input
                          type="number"
                          value={pricing.PRICE_PER_STUDENT}
                          onChange={e => setPricing({ ...pricing, PRICE_PER_STUDENT: e.target.value })}
                          className="rounded-xl pl-8 font-bold text-primary"
                        />
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        Contoh: 50 siswa = Rp {(50 * Number(pricing.PRICE_PER_STUDENT)).toLocaleString("id-ID")}
                      </p>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Minimal Pembelian Siswa</Label>
                      <Input
                        type="number"
                        value={pricing.MIN_STUDENTS}
                        onChange={e => setPricing({ ...pricing, MIN_STUDENTS: e.target.value })}
                        className="rounded-xl font-bold"
                      />
                      <p className="text-[10px] text-muted-foreground">
                        Minimal <strong>{pricing.MIN_STUDENTS}</strong> siswa per upgrade.
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
                        onChange={e => setPricing({ ...pricing, INVOICE_EXPIRY_DAYS: e.target.value })}
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
              {/* Quotas */}
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5" /> Siswa
                  </Label>
                  <Input
                    type="number"
                    value={editingPlan.maxStudents ?? 0}
                    onChange={e => setEditingPlan({ ...editingPlan, maxStudents: Number(e.target.value) })}
                    className="rounded-xl"
                    disabled={isProPlan}
                  />
                  <p className="text-[9px] text-muted-foreground leading-tight">
                    {isProPlan ? "Sesuai invoice" : "0 = Unlimited"}
                  </p>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold flex items-center gap-1.5">
                    <HardDrive className="h-3.5 w-3.5" /> Penyimpanan
                  </Label>
                  <Input
                    type="number"
                    value={editingPlan.maxStorage ?? 1024}
                    onChange={e => setEditingPlan({ ...editingPlan, maxStorage: Number(e.target.value) })}
                    className="rounded-xl"
                  />
                  <p className="text-[9px] text-muted-foreground leading-tight">Dalam MB (1024 = 1GB)</p>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold flex items-center gap-1.5">
                    <Zap className="h-3.5 w-3.5" /> Bonus AI
                  </Label>
                  <Input
                    type="number"
                    value={editingPlan.monthlyAiTokens ?? 0}
                    onChange={e => setEditingPlan({ ...editingPlan, monthlyAiTokens: Number(e.target.value) })}
                    className="rounded-xl"
                  />
                  <p className="text-[9px] text-muted-foreground leading-tight">Token / Bulan</p>
                </div>
              </div>

              {/* Sort Order hint removed — moved to top */}

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
                {(() => {
                  const feats: string[] = Array.isArray(editingPlan?.features) ? editingPlan.features as string[] : []
                  return feats.length > 0 ? (
                    <ul className="space-y-1.5 mt-2">
                      {feats.map((feat, i) => (
                        <li key={i} className="flex items-center gap-2 rounded-xl bg-muted/40 px-3 py-2 text-sm group">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                          <span className="flex-1">{feat}</span>
                          <Button
                            onClick={() => removeFeature(i)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">Belum ada fitur ditambahkan.</p>
                  )
                })()}
              </div>

            </div>
          )}

          <DialogFooter className="px-6 py-4 border-t bg-muted/20 gap-2">
            <Button variant="ghost" className="rounded-xl" onClick={() => setIsDialogOpen(false)}>
              Batal
            </Button>
            <Button
              className="justify-center items-center flex rounded-xl btn-gradient text-white border-0 px-8 gap-2 h-10"
              onClick={handleSave}
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
    </div>
  )
}
