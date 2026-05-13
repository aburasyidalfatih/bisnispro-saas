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
  const [freePlan, setFreePlan] = useState<PlanInfo | null>(null)
  const [studentCount, setStudentCount] = useState(50)
  const [invoice, setInvoice] = useState<InvoiceData | null>(null)
  const [showInvoice, setShowInvoice] = useState(false)
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
        setProPlan(plansData.find((p) => p.slug === "pro") || null)
        setFreePlan(plansData.find((p) => p.slug === "free") || null)
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
  const minStudents = isPro ? 1 : pricing.MIN_STUDENTS

  let proratedRatio = 1
  let daysRemaining = 365
  if (isPro && billing?.expiresAt) {
    const msPerDay = 24 * 60 * 60 * 1000
    const now = new Date()
    const expires = new Date(billing.expiresAt)
    daysRemaining = Math.max(0, Math.ceil((expires.getTime() - now.getTime()) / msPerDay))
    proratedRatio = Math.min(daysRemaining / 365, 1)
  }

  const baseSubTotal = studentCount * pricing.PRICE_PER_STUDENT
  const subTotal = baseSubTotal * proratedRatio
  const discountAmount = appliedDiscount ? subTotal * (appliedDiscount.percentage / 100) : 0
  const totalCost = subTotal - discountAmount

  const proFeatures = proPlan?.features || []
  const currentPlanFeatures = isPro ? (proPlan?.features || []) : (freePlan?.features || [])

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
    if (studentCount < minStudents) {
      toast({ title: "Gagal", description: `Minimal ${minStudents} siswa`, variant: "destructive" })
      return
    }
    setCheckingOut(true)
    const endpoint = isPro ? "/api/tenant/billing/addon" : "/api/tenant/billing/checkout"
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentCount, discountCode: appliedDiscount?.code }),
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

      <div className="grid gap-6 lg:grid-cols-3">

        {/* ── Card Paket Saat Ini ── */}
        <Card className={cn(
          "lg:col-span-1 border-0 shadow-xl overflow-hidden flex flex-col relative",
          isPro 
            ? "bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-900 text-white border border-emerald-500/30" 
            : "glass border border-white/20"
        )}>
          {/* Subtle overlay pattern for PRO */}
          {isPro && (
            <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay pointer-events-none" />
          )}

          <div className={cn("h-1.5 w-full relative z-10", isPro ? "bg-gradient-to-r from-yellow-300 to-yellow-500" : "bg-slate-300")} />
          
          <CardHeader className="relative z-10 pb-4">
            <CardTitle className="text-base flex items-center gap-2.5">
              {isPro ? (
                <div className="h-9 w-9 rounded-xl bg-yellow-400/20 flex items-center justify-center border border-yellow-400/30 shadow-[0_0_15px_rgba(250,204,21,0.2)]">
                  <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                </div>
              ) : (
                <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Zap className="h-5 w-5 text-primary" />
                </div>
              )}
              <span className={cn("font-bold tracking-wide", isPro && "text-white")}>Paket Saat Ini</span>
            </CardTitle>
            <CardDescription className={cn("mt-1", isPro ? "text-emerald-100/70" : "text-muted-foreground")}>
              Status akun sekolah Anda
            </CardDescription>
          </CardHeader>
          
          <CardContent className="flex flex-col flex-1 space-y-5 relative z-10">
            <div className="flex items-center gap-4">
              <div className={cn(
                "text-5xl font-black uppercase tracking-widest drop-shadow-sm",
                isPro 
                  ? "bg-gradient-to-b from-white via-emerald-50 to-emerald-200/80 bg-clip-text text-transparent" 
                  : "text-foreground"
              )}>
                {billing?.plan?.toUpperCase() || "FREE"}
              </div>
              
              {isPro && (
                <div className="flex flex-col border-l border-emerald-500/30 pl-4 py-1">
                  <span className="text-[10px] font-bold text-emerald-300/80 uppercase tracking-widest mb-0.5">Kapasitas</span>
                  <span className="text-xl font-black text-white flex items-center gap-1.5">
                    {billing?.studentQuota || 0} 
                    <span className="text-sm font-semibold text-emerald-100/70">Siswa</span>
                  </span>
                </div>
              )}
            </div>

            {currentPlanFeatures.length > 0 && (
              <div className={cn("pt-4 border-t space-y-3", isPro ? "border-emerald-500/30" : "border-border/40")}>
                <p className={cn(
                  "text-[10px] font-bold uppercase tracking-wider",
                  isPro ? "text-emerald-300/80" : "text-muted-foreground"
                )}>
                  Fitur Paket
                </p>
                <ul className="space-y-2.5">
                  {currentPlanFeatures.map((feat, i) => (
                    <li key={i} className={cn("flex items-center gap-3 text-sm font-medium", isPro ? "text-emerald-50" : "text-foreground")}>
                      <div className={cn("h-5 w-5 rounded-full flex items-center justify-center shrink-0", isPro ? "bg-yellow-400/20 border border-yellow-400/30" : "bg-emerald-100")}>
                        <CheckCircle2 className={cn("h-3.5 w-3.5", isPro ? "text-yellow-400" : "text-emerald-600")} />
                      </div>
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {!isPro && currentPlanFeatures.length === 0 && (
              <div className="pt-3 border-t border-border/40">
                <p className="text-xs text-muted-foreground flex items-start gap-2">
                  <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  Upgrade ke PRO untuk akses fitur lengkap.
                </p>
              </div>
            )}

            <div className="mt-auto pt-4">
              {isPro ? (
                 <div className="flex items-center justify-between bg-emerald-950/40 border border-emerald-500/20 rounded-xl px-4 py-3.5 backdrop-blur-sm">
                   <div className="flex flex-col">
                     <span className="text-[10px] text-emerald-300/80 font-bold uppercase tracking-widest mb-1">Status</span>
                     <span className="text-sm font-bold text-white flex items-center gap-2">
                       <div className="relative flex h-2.5 w-2.5">
                         <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                         <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                       </div>
                       Aktif
                     </span>
                   </div>
                   <div className="flex flex-col text-right">
                     <span className="text-[10px] text-emerald-300/80 font-bold uppercase tracking-widest mb-1">Berlaku Hingga</span>
                     <span className="text-sm font-bold text-emerald-50">
                       {billing?.expiresAt ? new Date(billing.expiresAt).toLocaleDateString("id-ID", { month: "short", year: "numeric", day: "numeric" }) : "Selamanya"}
                     </span>
                   </div>
                 </div>
              ) : (
                <Button disabled className="w-full h-11 rounded-xl cursor-default" variant="outline">
                  Paket Anda saat ini
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ── Card Upgrade PRO ── */}
        {billing?.upgradeEnabled ? (
          <Card className="lg:col-span-2 glass border-0 overflow-hidden">
            <div className="h-1.5 bg-gradient-to-r from-primary to-primary/60" />
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <ShieldCheck className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>{isPro ? "Tambah Kuota Siswa" : "Upgrade ke Paket PRO"}</CardTitle>
                <CardDescription>
                  {isPro 
                    ? `Biaya penambahan kuota akan disesuaikan (Pro-rata) dengan sisa masa aktif langganan Anda (${daysRemaining} hari).` 
                    : (proPlan?.description || "Bayar sesuai jumlah siswa aktif (Pay-per-Student)")}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Calculator */}
              <div className="space-y-4">
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
                    Rp {Number(pricing.PRICE_PER_STUDENT).toLocaleString("id-ID")} / siswa / tahun
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
              </div>

              {/* Features */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold">Fitur yang Anda dapatkan:</Label>
                {proFeatures.length > 0 ? (
                  <ul className="space-y-2">
                    {proFeatures.map((feat, i) => (
                      <li key={i} className="flex items-center gap-2.5 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground italic">Tidak ada fitur yang dikonfigurasi.</p>
                )}
              </div>
            </div>

            {billing?.hasPendingInvoice && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-800 dark:bg-amber-950/20 dark:border-amber-800/30 dark:text-amber-400 mb-4">
                <div className="flex gap-2 items-start">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>Kamu punya invoice aktif, jika ingin membuat invoice baru harap batalkan invoice sebelumnya.</span>
                </div>
                <Link href="/admin/billing/history" className="font-bold underline underline-offset-2 text-amber-700 hover:text-amber-900 flex items-center gap-1 shrink-0 dark:text-amber-500 transition">
                  Lihat Riwayat <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            )}

            <Button
              className="w-full h-12 rounded-xl btn-gradient text-white border-0 gap-2 text-base font-semibold shadow-lg shadow-primary/20"
              disabled={checkingOut || studentCount < minStudents || billing?.hasPendingInvoice}
              onClick={handleCheckout}
            >
              {checkingOut ? "Membuat Invoice..." : (isPro ? "Buat Tagihan Penambahan Kuota" : "Upgrade Sekarang")}
              <ArrowRight className="h-5 w-5" />
            </Button>
          </CardContent>
        </Card>
        ) : (
          <Card className="lg:col-span-2 glass border-0 flex flex-col items-center justify-center p-10 text-center min-h-[350px]">
            <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mb-5">
              <ShieldCheck className="h-8 w-8 text-muted-foreground" />
            </div>
            <CardTitle className="text-xl mb-2 text-muted-foreground">Upgrade ke Paket PRO</CardTitle>
            <CardDescription className="max-w-md mx-auto">
              Fitur upgrade paket secara mandiri sedang dinonaktifkan sementara oleh Super Admin. Silakan hubungi admin pusat untuk melakukan upgrade paket langganan Anda.
            </CardDescription>
          </Card>
        )}
      </div>



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
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Jumlah Siswa</span>
                    <span className="font-semibold">{invoice?.studentCount} siswa</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Harga per Siswa</span>
                    <span className="font-semibold">Rp {Number(invoice?.pricePerStudent || 0).toLocaleString("id-ID")}</span>
                  </div>
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
