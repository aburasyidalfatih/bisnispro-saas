"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/hooks/use-toast"
import {
  CheckCircle2, Zap, Users, Info, ArrowRight,
  ShieldCheck, Star, FileText, Clock, Copy, ExternalLink,
  AlertCircle, CheckCheck, MessageCircle, Tag, Percent
} from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"

interface TenantBilling {
  id: string; name: string; plan: string; studentQuota: number
  isActive: boolean; expiresAt: string | null
  pricing: { PRICE_PER_STUDENT: number; MIN_STUDENTS: number }
  hasPendingInvoice?: boolean
  upgradeEnabled?: boolean
  manualPayment?: { bank: string; number: string; name: string; waNumber: string }
  lockedPricePerStudent?: number | null
}
interface PlanInfo {
  slug: string; name: string; description: string; price: number
  interval: string; maxStudents: number; maxStorage: number
  features: string[]; isPopular: boolean
}
interface InvoiceData {
  id: string; reference: string; amount: number; studentCount?: number; aiTokens?: number
  pricePerStudent?: number; tenantName: string
  expiredAt: string; status: string; createdAt: string
  subTotal?: number; discountAmount?: number
}



export default function BillingPage() {
  const [loading, setLoading] = useState(true)
  const [checkingOut, setCheckingOut] = useState(false)
  const [billing, setBilling] = useState<TenantBilling | null>(null)
  const [proPlan, setProPlan] = useState<PlanInfo | null>(null)
  const [litePlan, setLitePlan] = useState<PlanInfo | null>(null)
  const [freePlan, setFreePlan] = useState<PlanInfo | null>(null)
  const [selectedPlanSlug, setSelectedPlanSlug] = useState("pro")
  const [studentCount, setStudentCount] = useState(50)
  const [invoice, setInvoice] = useState<InvoiceData | null>(null)
  const [showInvoice, setShowInvoice] = useState(false)
  const [showProCalculator, setShowProCalculator] = useState(false)
  const [copied, setCopied] = useState(false)


  // Discount states
  const [discountCodeInput, setDiscountCodeInput] = useState("")
  const [validatingDiscount, setValidatingDiscount] = useState(false)
  const [appliedDiscount, setAppliedDiscount] = useState<{ code: string, percentage: number, expiresAt?: string | null, bonusMonths?: number } | null>(null)
  const [discountTimeLeft, setDiscountTimeLeft] = useState<string | null>(null)

  useEffect(() => {
    let timer: NodeJS.Timeout
    if (appliedDiscount?.expiresAt) {
      const updateTimer = () => {
        const now = new Date().getTime()
        const target = new Date(appliedDiscount.expiresAt!).getTime()
        const diff = target - now
        if (diff <= 0) {
          setDiscountTimeLeft("Diskon sudah berakhir")
          setAppliedDiscount(null)
        } else {
          const hours = Math.floor(diff / (1000 * 60 * 60))
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
          const seconds = Math.floor((diff % (1000 * 60)) / 1000)
          let timeString = ""
          if (hours > 0) timeString += `${hours} jam `
          if (minutes > 0 || hours > 0) timeString += `${minutes} menit `
          timeString += `${seconds} detik`
          setDiscountTimeLeft(timeString + " Lagi")
        }
      }
      updateTimer()
      timer = setInterval(updateTimer, 1000)
    } else {
      setDiscountTimeLeft(null)
    }
    return () => clearInterval(timer)
  }, [appliedDiscount])

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [billingRes, plansRes] = await Promise.all([
          fetch("/api/tenant/billing", { cache: "no-store" }),
          fetch("/api/plans", { cache: "no-store" }),
        ])
        const billingData = await billingRes.json()
        const plansData: PlanInfo[] = await plansRes.json()
        setBilling(billingData)
        setStudentCount(billingData?.pricing?.MIN_STUDENTS || 50)
        const proData = plansData.find((p) => p.slug === "pro") || null
        const liteData = plansData.find((p) => p.slug === "lite") || null
        setProPlan(proData)
        setLitePlan(liteData)
        setFreePlan(plansData.find((p) => p.slug === "free") || null)
        
        // Ensure default selected plan is valid
        if (billingData?.plan === "lite") {
          // Lite tenant: default perpanjang Lite
          setSelectedPlanSlug("lite")
        } else if (billingData?.plan !== "pro") {
          // Free tenant: default ke Pro, fallback ke Lite
          if (proData) {
            setSelectedPlanSlug("pro")
          } else if (liteData) {
            setSelectedPlanSlug("lite")
          } else {
            setSelectedPlanSlug("")
          }
        }
      } catch {
        toast({ title: "Error", description: "Gagal memuat data.", variant: "destructive" })
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [])

  const pricing = billing?.pricing || { PRICE_PER_STUDENT: 30000, MIN_STUDENTS: 50 }
  const isPro = billing?.plan === "pro"
  const isLite = billing?.plan === "lite"
  const isPaid = isPro || isLite // tenant sudah berbayar
  const minStudents = isPro ? 1 : pricing.MIN_STUDENTS

  // Harga efektif: PRO aktif → harga kontrak (locked), lainnya → harga terbaru
  const effectivePricePerStudent = (isPro && billing?.lockedPricePerStudent)
    ? billing.lockedPricePerStudent
    : pricing.PRICE_PER_STUDENT
  const isUsingLockedPrice = isPro && !!billing?.lockedPricePerStudent && billing.lockedPricePerStudent !== pricing.PRICE_PER_STUDENT

  let proratedRatio = 1
  let daysRemaining = 365
  if (isPro && billing?.expiresAt) {
    const msPerDay = 24 * 60 * 60 * 1000
    const now = new Date()
    const expires = new Date(billing.expiresAt)
    daysRemaining = Math.max(0, Math.ceil((expires.getTime() - now.getTime()) / msPerDay))
    proratedRatio = Math.min(daysRemaining / 365, 1)
  }

  const selectedPlanInfo = selectedPlanSlug === "pro" ? proPlan : selectedPlanSlug === "lite" ? litePlan : null
  const baseSubTotal = selectedPlanSlug === "pro" ? studentCount * effectivePricePerStudent : (litePlan?.price || 0)
  const subTotal = baseSubTotal * proratedRatio
  const discountAmount = appliedDiscount ? subTotal * (appliedDiscount.percentage / 100) : 0
  const totalCost = subTotal - discountAmount

  const selectedPlanFeatures = selectedPlanInfo?.features || []
  const currentPlanFeatures = isPro ? (proPlan?.features || []) : billing?.plan === "lite" ? (litePlan?.features || []) : (freePlan?.features || [])

  const handleValidateDiscount = async () => {
    if (!discountCodeInput) return
    setValidatingDiscount(true)
    try {
      const res = await fetch("/api/tenant/billing/validate-discount", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: discountCodeInput }),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || "Kode tidak valid")
      setAppliedDiscount({ code: result.code, percentage: result.percentage, expiresAt: result.expiresAt, bonusMonths: result.bonusMonths })
      toast({ title: "Berhasil", description: `Diskon ${result.percentage}% diterapkan!` })
    } catch (err: any) {
      setAppliedDiscount(null)
      toast({ title: "Gagal", description: err.message, variant: "destructive" })
    } finally {
      setValidatingDiscount(false)
    }
  }

  const handleRemoveDiscount = () => {
    setAppliedDiscount(null)
    setDiscountCodeInput("")
  }

  const handleCheckout = async () => {
    if (selectedPlanSlug === "pro" && studentCount < minStudents) {
      toast({ title: "Gagal", description: `Minimal ${minStudents} siswa`, variant: "destructive" })
      return
    }
    setCheckingOut(true)
    const endpoint = isPro ? "/api/tenant/billing/addon" : "/api/tenant/billing/checkout"
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentCount: selectedPlanSlug === "pro" ? studentCount : 0, planSlug: selectedPlanSlug, discountCode: appliedDiscount?.code }),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || "Gagal membuat invoice")
      setInvoice(result)
      setShowInvoice(true)
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" })
    } finally {
      setCheckingOut(false)
    }
  }



  const copyRef = () => {
    if (!invoice) return
    navigator.clipboard.writeText(invoice.reference)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 rounded-xl bg-muted animate-pulse" />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="h-72 rounded-2xl bg-muted animate-pulse" />
          <div className="lg:col-span-2 h-72 rounded-2xl bg-muted animate-pulse" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Langganan & Penagihan</h1>
          <p className="text-muted-foreground mt-1 text-sm">Kelola paket sekolah dan kuota siswa Anda.</p>
        </div>
        <Button variant="outline" className="gap-2 rounded-xl" asChild>
          <Link href="/admin/billing/history">
            <FileText className="h-4 w-4" /> Riwayat Invoice
          </Link>
        </Button>
      </div>

      {/* ── Perbandingan 3 Paket ── */}
      <div className="grid gap-6 md:grid-cols-3">

        {/* ── Card FREE ── */}
        <Card className={cn(
          "border-0 shadow-lg overflow-hidden flex flex-col relative transition-all",
          billing?.plan === "free" ? "ring-2 ring-slate-400" : "glass"
        )}>
          <div className="h-1.5 bg-slate-300" />
          {billing?.plan === "free" && (
            <div className="absolute top-4 right-4 z-10">
              <Badge className="bg-slate-600 text-white text-[10px] shadow-md">Paket Anda</Badge>
            </div>
          )}
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center dark:bg-slate-800">
                <Zap className="h-5 w-5 text-slate-600 dark:text-slate-300" />
              </div>
              <div>
                <CardTitle className="text-lg">Free</CardTitle>
                <CardDescription>Untuk memulai digitalisasi</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col flex-1 space-y-4">
            <div>
              <div className="flex items-end gap-1">
                <span className="text-3xl font-black">Gratis</span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">Tanpa biaya selamanya</p>
            </div>

            <div className="border-t pt-4 space-y-2.5 flex-1">
              {(freePlan?.features || []).length > 0 ? (
                (freePlan?.features || []).map((feat: string, i: number) => (
                  <div key={i} className="flex items-center gap-2.5 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))
              ) : (
                <>
                  <div className="flex items-center gap-2.5 text-sm"><CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" /><span>Website Sekolah</span></div>
                  <div className="flex items-center gap-2.5 text-sm"><CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" /><span>Data Master</span></div>
                  <div className="flex items-center gap-2.5 text-sm"><CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" /><span>Subdomain Gratis</span></div>
                </>
              )}
            </div>

            <div className="mt-auto pt-3">
              {billing?.plan === "free" ? (
                <Button disabled className="w-full h-11 rounded-xl cursor-default" variant="outline">
                  <CheckCircle2 className="h-4 w-4 mr-2" /> Paket Aktif
                </Button>
              ) : (
                <Button disabled className="w-full h-11 rounded-xl cursor-default" variant="ghost">
                  Paket Dasar
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ── Card LITE ── */}
        {litePlan && <Card className={cn(
          "border-0 shadow-lg overflow-hidden flex flex-col relative transition-all",
          billing?.plan === "lite" ? "ring-2 ring-blue-500" : "glass",
          litePlan?.isPopular && billing?.plan !== "lite" && "ring-2 ring-primary/30"
        )}>
          <div className="h-1.5 bg-gradient-to-r from-blue-400 to-indigo-500" />
          {billing?.plan === "lite" && (
            <div className="absolute top-4 right-4 z-10">
              <Badge className="bg-blue-600 text-white text-[10px] shadow-md">Paket Anda</Badge>
            </div>
          )}
          {litePlan?.isPopular && billing?.plan !== "lite" && (
            <div className="absolute top-4 right-4 z-10">
              <Badge className="bg-primary/10 text-primary text-[10px]">Populer</Badge>
            </div>
          )}
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <ShieldCheck className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Lite</CardTitle>
                <CardDescription>{litePlan?.description || "Paket menengah untuk sekolah berkembang"}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col flex-1 space-y-4">
            <div>
              <div className="flex items-end gap-1">
                <span className="text-sm font-semibold text-muted-foreground">Rp</span>
                <span className="text-3xl font-black">{(litePlan?.price || 1000000).toLocaleString("id-ID")}</span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">Per tahun · Biaya tetap</p>
            </div>

            {/* Masa aktif jika Lite */}
            {billing?.plan === "lite" && billing.expiresAt && (
              <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/30 rounded-xl px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <div className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                  </div>
                  <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">Aktif</span>
                </div>
                <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                  s/d {new Date(billing.expiresAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                </span>
              </div>
            )}

            <div className="border-t pt-4 space-y-2.5 flex-1">
              {(litePlan?.features || []).length > 0 ? (
                (litePlan?.features || []).map((feat: string, i: number) => (
                  <div key={i} className="flex items-center gap-2.5 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-blue-500 shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))
              ) : (
                <>
                  <div className="flex items-center gap-2.5 text-sm"><CheckCircle2 className="h-4 w-4 text-blue-500 shrink-0" /><span>Custom Domain</span></div>
                  <div className="flex items-center gap-2.5 text-sm"><CheckCircle2 className="h-4 w-4 text-blue-500 shrink-0" /><span>Broadcast WhatsApp</span></div>
                  <div className="flex items-center gap-2.5 text-sm"><CheckCircle2 className="h-4 w-4 text-blue-500 shrink-0" /><span>Semua fitur Free</span></div>
                </>
              )}
            </div>

            <div className="mt-auto pt-3">
              {billing?.plan === "lite" ? (
                <Button 
                  className="w-full h-11 rounded-xl btn-gradient text-white border-0 gap-2 font-semibold shadow-lg shadow-primary/20"
                  disabled={checkingOut || billing?.hasPendingInvoice || !billing?.upgradeEnabled}
                  onClick={() => { setSelectedPlanSlug("lite"); handleCheckout() }}
                >
                  {checkingOut && selectedPlanSlug === "lite" ? "Membuat Invoice..." : "Perpanjang Sekarang"}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : billing?.plan === "pro" ? (
                <Button disabled className="w-full h-11 rounded-xl cursor-default" variant="ghost">
                  Sudah di paket PRO
                </Button>
              ) : (
                <Button 
                  className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white border-0 gap-2 font-semibold shadow-lg shadow-blue-500/20"
                  disabled={checkingOut || billing?.hasPendingInvoice || !billing?.upgradeEnabled}
                  onClick={() => { setSelectedPlanSlug("lite"); handleCheckout() }}
                >
                  {checkingOut && selectedPlanSlug === "lite" ? "Membuat Invoice..." : "Upgrade ke Lite"}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>}

        {/* ── Card PRO ── */}
        {proPlan && <Card className={cn(
          "border-0 shadow-lg overflow-hidden flex flex-col relative transition-all",
          billing?.plan === "pro" ? "ring-2 ring-emerald-500" : "glass"
        )}>
          <div className="h-1.5 bg-gradient-to-r from-yellow-400 to-amber-500" />
          {billing?.plan === "pro" && (
            <div className="absolute top-4 right-4 z-10">
              <Badge className="bg-emerald-600 text-white text-[10px] shadow-md">Paket Anda</Badge>
            </div>
          )}
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <Star className="h-5 w-5 fill-amber-500 text-amber-500" />
              </div>
              <div>
                <CardTitle className="text-lg">PRO</CardTitle>
                <CardDescription>{proPlan?.description || "Fitur lengkap untuk sekolah modern"}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col flex-1 space-y-4">
            <div>
              <div className="flex items-end gap-1">
                <span className="text-sm font-semibold text-muted-foreground">Rp</span>
                <span className="text-3xl font-black">{Number(effectivePricePerStudent).toLocaleString("id-ID")}</span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">Per siswa / tahun · Min. {pricing.MIN_STUDENTS} siswa</p>
              {isUsingLockedPrice && (
                <span className="text-[9px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded font-semibold dark:bg-blue-900/30 dark:text-blue-400">Harga Kontrak</span>
              )}
            </div>

            {/* Masa aktif + kapasitas jika Pro */}
            {billing?.plan === "pro" && (
              <div className="space-y-2">
                <div className="flex items-center justify-between bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/30 rounded-xl px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <div className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </div>
                    <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">Aktif</span>
                  </div>
                  <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                    s/d {billing?.expiresAt ? new Date(billing.expiresAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "Selamanya"}
                  </span>
                </div>
                <div className="flex items-center justify-between bg-muted/40 rounded-xl px-3 py-2">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Kapasitas</span>
                  <span className="text-sm font-bold flex items-center gap-1">
                    <Users className="h-3.5 w-3.5 text-primary" /> {billing?.studentQuota || 0} Siswa
                  </span>
                </div>
              </div>
            )}

            <div className="border-t pt-4 space-y-2.5 flex-1">
              {(proPlan?.features || []).length > 0 ? (
                (proPlan?.features || []).map((feat: string, i: number) => (
                  <div key={i} className="flex items-center gap-2.5 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-amber-500 shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))
              ) : (
                <>
                  <div className="flex items-center gap-2.5 text-sm"><CheckCircle2 className="h-4 w-4 text-amber-500 shrink-0" /><span>Semua fitur Lite</span></div>
                  <div className="flex items-center gap-2.5 text-sm"><CheckCircle2 className="h-4 w-4 text-amber-500 shrink-0" /><span>Akademik & E-Rapor</span></div>
                  <div className="flex items-center gap-2.5 text-sm"><CheckCircle2 className="h-4 w-4 text-amber-500 shrink-0" /><span>Keuangan & E-Kantin</span></div>
                  <div className="flex items-center gap-2.5 text-sm"><CheckCircle2 className="h-4 w-4 text-amber-500 shrink-0" /><span>Kehadiran & Donasi</span></div>
                </>
              )}
            </div>

            <div className="mt-auto pt-3">
              {billing?.plan === "pro" ? (
                <Button 
                  className="w-full h-11 rounded-xl btn-gradient text-white border-0 gap-2 font-semibold shadow-lg shadow-primary/20"
                  disabled={checkingOut || billing?.hasPendingInvoice || !billing?.upgradeEnabled}
                  onClick={() => { setSelectedPlanSlug("pro"); setShowProCalculator(true) }}
                >
                  Tambah Kuota Siswa
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button 
                  className="w-full h-11 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white border-0 gap-2 font-semibold shadow-lg shadow-amber-500/20"
                  disabled={checkingOut || billing?.hasPendingInvoice || !billing?.upgradeEnabled}
                  onClick={() => { setSelectedPlanSlug("pro"); setShowProCalculator(true) }}
                >
                  {billing?.plan === "lite" ? "Upgrade ke Pro" : "Upgrade ke Pro"}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>}
      </div>

      {/* Pending Invoice Alert */}
      {billing?.hasPendingInvoice && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-800 dark:bg-amber-950/20 dark:border-amber-800/30 dark:text-amber-400">
          <div className="flex gap-2 items-start">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>Kamu punya invoice aktif. Jika ingin membuat invoice baru, harap batalkan invoice sebelumnya.</span>
          </div>
          <Link href="/admin/billing/history" className="font-bold underline underline-offset-2 text-amber-700 hover:text-amber-900 flex items-center gap-1 shrink-0 dark:text-amber-500 transition">
            Lihat Riwayat <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
      )}

      {/* Upgrade disabled */}
      {!billing?.upgradeEnabled && (
        <div className="bg-muted/50 border rounded-xl p-4 text-center text-sm text-muted-foreground">
          <ShieldCheck className="h-6 w-6 mx-auto mb-2 text-muted-foreground/50" />
          Fitur upgrade paket sedang dinonaktifkan oleh Super Admin. Hubungi admin pusat untuk upgrade.
        </div>
      )}

      {/* ── PRO Calculator Dialog ── */}
      <Dialog open={showProCalculator} onOpenChange={setShowProCalculator}>
        <DialogContent className="max-w-md rounded-2xl p-0 overflow-hidden border-0 shadow-2xl">
          <div className="h-1.5 bg-gradient-to-r from-amber-400 to-orange-500" />
          <DialogHeader className="px-6 pt-5 pb-2">
            <DialogTitle className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
              </div>
              {isPro ? "Tambah Kuota Siswa" : "Upgrade ke PRO"}
            </DialogTitle>
            <DialogDescription>
              {isPro 
                ? `Biaya disesuaikan (pro-rata) dengan sisa masa aktif Anda (${daysRemaining} hari).`
                : "Masukkan jumlah siswa untuk menghitung biaya."
              }
            </DialogDescription>
          </DialogHeader>

          <div className="px-6 py-4 space-y-4">
            {/* Student Count */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-semibold">
                <Users className="h-4 w-4 text-primary" /> {isPro ? "Jumlah Tambah Siswa" : "Jumlah Siswa Aktif"}
              </Label>
              <Input
                type="number" min={minStudents}
                value={studentCount}
                onChange={(e) => setStudentCount(Number(e.target.value))}
                className="rounded-xl h-12 text-lg font-semibold"
              />
              <p className="text-[11px] text-muted-foreground">
                Minimal {isPro ? "tambah" : "upgrade"}: <strong>{minStudents} siswa</strong>
              </p>
            </div>

            {/* Cost Calculation */}
            <div className="p-4 rounded-2xl bg-primary/5 border border-primary/15 space-y-1.5">
              <p className="text-xs text-muted-foreground font-medium">Estimasi Biaya {isPro && "(Pro-rata)"}</p>
              
              {isPro && (
                <div className="flex justify-between text-[11px] text-muted-foreground mb-1">
                  <span>Harga Normal ({studentCount} siswa)</span>
                  <span>Rp {baseSubTotal.toLocaleString("id-ID")}</span>
                </div>
              )}
              
              {appliedDiscount && (
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-muted-foreground line-through">Rp {subTotal.toLocaleString("id-ID")}</span>
                  <span className="text-emerald-600 font-bold bg-emerald-100 px-1.5 py-0.5 rounded text-[10px]">-{appliedDiscount.percentage}%</span>
                </div>
              )}

              <div className="flex items-end gap-1 text-primary">
                <span className="text-sm font-semibold">Rp</span>
                <span className="text-3xl font-bold">{totalCost.toLocaleString("id-ID")}</span>
              </div>
              <p className="text-[11px] text-primary/70 italic">
                Rp {Number(effectivePricePerStudent).toLocaleString("id-ID")} / siswa / tahun
                {isUsingLockedPrice && (
                  <span className="ml-1.5 text-[9px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded font-semibold not-italic dark:bg-blue-900/30 dark:text-blue-400">Harga Kontrak</span>
                )}
              </p>
            </div>

            {/* Discount Input */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold flex items-center gap-1.5 text-muted-foreground">
                <Tag className="h-3.5 w-3.5" /> Punya Kode Diskon?
              </Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Masukkan kode diskon..."
                  value={discountCodeInput}
                  onChange={(e) => setDiscountCodeInput(e.target.value.toUpperCase())}
                  disabled={!!appliedDiscount || validatingDiscount}
                  className="rounded-xl font-mono uppercase tracking-widest text-sm h-10"
                />
                {appliedDiscount ? (
                  <Button variant="outline" className="rounded-xl h-10 text-destructive border-destructive/20 hover:bg-destructive/10" onClick={handleRemoveDiscount}>
                    Hapus
                  </Button>
                ) : (
                  <Button variant="secondary" className="rounded-xl h-10 px-6 font-semibold" onClick={handleValidateDiscount} disabled={!discountCodeInput || validatingDiscount}>
                    {validatingDiscount ? "..." : "Gunakan"}
                  </Button>
                )}
              </div>
              {appliedDiscount && (
                <div className="flex flex-col gap-1 mt-1">
                  <p className="text-xs text-emerald-600 flex items-center gap-1 font-medium">
                    <CheckCircle2 className="h-3 w-3" /> Kode {appliedDiscount.code} berhasil diterapkan!
                  </p>
                  {(appliedDiscount.bonusMonths ?? 0) > 0 && (
                    <p className="text-[11px] text-blue-600 font-medium ml-4 mt-0.5">
                      + Gratis Perpanjangan {appliedDiscount.bonusMonths} Bulan
                    </p>
                  )}
                  {discountTimeLeft && (
                    <p className="text-[10px] text-amber-600 font-medium ml-4 mt-0.5">
                      kode diskon akan berakhir {discountTimeLeft}.
                    </p>
                  )}
                </div>
              )}
            </div>

            <Button
              className="w-full h-12 rounded-xl btn-gradient text-white border-0 gap-2 text-base font-semibold shadow-lg shadow-primary/20"
              disabled={checkingOut || studentCount < minStudents || billing?.hasPendingInvoice}
              onClick={() => { handleCheckout(); }}
            >
              {checkingOut ? "Membuat Invoice..." : isPro ? "Buat Tagihan Penambahan Kuota" : "Upgrade ke Pro Sekarang"}
              <ArrowRight className="h-5 w-5" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>



      {/* ── Invoice Dialog ── */}
      <Dialog open={showInvoice} onOpenChange={setShowInvoice}>
        <DialogContent className="max-w-md rounded-2xl p-0 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-br from-primary to-primary/80 px-6 pt-6 pb-8 text-white">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center">
                <FileText className="h-5 w-5" />
              </div>
              <DialogHeader className="space-y-0">
                <DialogTitle className="text-white text-lg">Invoice Berhasil Dibuat</DialogTitle>
                <DialogDescription className="text-white/70 text-xs">
                  Silakan lakukan pembayaran sebelum batas waktu
                </DialogDescription>
              </DialogHeader>
            </div>

            {/* Reference */}
            <div className="bg-white/10 rounded-xl p-3 flex items-center justify-between gap-2">
              <div>
                <p className="text-[10px] text-white/60 uppercase tracking-wide">Nomor Invoice</p>
                <p className="text-sm font-mono font-bold">{invoice?.reference}</p>
              </div>
              <button onClick={copyRef} className="h-8 w-8 rounded-lg bg-white/20 hover:bg-white/30 transition flex items-center justify-center shrink-0">
                {copied ? <CheckCheck className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="px-6 py-5 space-y-4 -mt-4 bg-card rounded-t-2xl">
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Nama Sekolah</span>
                <span className="font-semibold">{invoice?.tenantName}</span>
              </div>
              {invoice?.aiTokens ? (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pembelian</span>
                  <span className="font-semibold text-blue-600">{invoice.aiTokens.toLocaleString("id-ID")} Token AI</span>
                </div>
              ) : (
                <>
                  {(invoice?.studentCount || 0) > 0 ? (
                    <>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Jumlah Siswa</span>
                        <span className="font-semibold">{invoice?.studentCount} siswa</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Harga per Siswa</span>
                        <span className="font-semibold">Rp {Number(invoice?.pricePerStudent || 0).toLocaleString("id-ID")}</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Paket</span>
                      <span className="font-semibold uppercase">{selectedPlanSlug}</span>
                    </div>
                  )}
                </>
              )}
              {invoice?.discountAmount && invoice.discountAmount > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Diskon</span>
                  <span className="font-semibold text-emerald-600">- Rp {Number(invoice.discountAmount).toLocaleString("id-ID")}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between text-base font-bold">
                <span>Total Pembayaran</span>
                <span className="text-primary">Rp {Number(invoice?.amount || 0).toLocaleString("id-ID")}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> Berlaku hingga</span>
                <span className="font-medium text-amber-600">
                  {invoice?.expiredAt ? new Date(invoice.expiredAt).toLocaleString("id-ID", {
                    day: "numeric", month: "short", year: "numeric",
                    hour: "2-digit", minute: "2-digit"
                  }) : "-"}
                </span>
              </div>
            </div>

            <div className="bg-slate-50 border rounded-xl p-3.5 space-y-3 dark:bg-slate-800/50">
              <p className="font-semibold text-[10px] text-muted-foreground uppercase tracking-wider">Rekening Pembayaran</p>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-sm">{billing?.manualPayment?.bank || "Bank Pembayaran"}</p>
                  <p className="text-muted-foreground text-[11px]">a.n {billing?.manualPayment?.name || "Nama Pemilik"}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-sm">{billing?.manualPayment?.number || "-"}</span>
                  <button onClick={() => {
                    navigator.clipboard.writeText(billing?.manualPayment?.number || "")
                    toast({ description: "Nomor rekening disalin" })
                  }} className="text-muted-foreground hover:text-primary transition"><Copy className="h-4 w-4" /></button>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 dark:bg-amber-900/10 dark:border-amber-800/30 dark:text-amber-400">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>Invoice ini akan dikonfirmasi secara manual oleh admin. Hubungi kami via WhatsApp setelah melakukan pembayaran.</span>
              </div>
              <Button size="sm" className="shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 h-8 rounded-lg" asChild>
                <a href={`https://wa.me/${billing?.manualPayment?.waNumber || "6281234567890"}?text=Halo%20Admin%2C%20saya%20ingin%20konfirmasi%20pembayaran%20untuk%20invoice%20${invoice?.reference}`} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="h-3.5 w-3.5" /> Konfirmasi WA
                </a>
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <Button variant="outline" className="rounded-xl" onClick={() => setShowInvoice(false)}>
                Tutup
              </Button>
              <Button className="rounded-xl gap-1.5 btn-gradient text-white border-0" asChild>
                <Link href="/admin/billing/history">
                  <ExternalLink className="h-4 w-4" /> Lihat Riwayat
                </Link>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
