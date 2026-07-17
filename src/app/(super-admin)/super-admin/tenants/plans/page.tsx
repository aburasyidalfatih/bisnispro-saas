"use client"

import { useEffect, useState } from "react"
import { toast } from "@/hooks/use-toast"
import { PlanCard } from "./_components/plan-card"
import { EditPlanModal } from "./_components/edit-plan-modal"
import { SubscriptionPlan } from "./_components/types"

export default function PlansPage() {
  const [loading, setLoading] = useState(true)
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [editingPlan, setEditingPlan] = useState<Partial<SubscriptionPlan> | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)

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
    setIsDialogOpen(true)
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
        {plans.map((plan) => (
          <PlanCard 
            key={plan.id}
            plan={plan}
            pricing={pricing}
            onEdit={openEdit}
            onToggleActive={handleToggleActive}
          />
        ))}
      </div>

      {/* ─── Edit Dialog ─── */}
      <EditPlanModal
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        plan={editingPlan}
        onUpdatePlan={(p) => setEditingPlan(prev => ({ ...prev, ...p }))}
        pricing={pricing}
        onUpdatePricing={(p) => setPricing(prev => ({ ...prev, ...p }))}
        onSave={handleSave}
        saving={saving}
      />
    </div>
  )
}
