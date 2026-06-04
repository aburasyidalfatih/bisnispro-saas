"use client"

import { useEffect, useState } from"react"
import { Button } from"@/components/ui/button"
import { toast } from"@/hooks/use-toast"
import { FileText, AlertCircle, ExternalLink, ShieldCheck } from"lucide-react"
import Link from"next/link"

import { TenantBilling, PlanInfo, InvoiceData } from"./_components/types"
import { PlanCards } from"./_components/plan-cards"
import { CheckoutDialog } from"./_components/checkout-dialog"
import { InvoiceDialog } from"./_components/invoice-dialog"

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
  const [showCheckoutModal, setShowCheckoutModal] = useState(false)
  const [copied, setCopied] = useState(false)

  // Discount states
  const [discountCodeInput, setDiscountCodeInput] = useState("")
  const [validatingDiscount, setValidatingDiscount] = useState(false)
  const [appliedDiscount, setAppliedDiscount] = useState<{ code: string, type?: string, cashbackAmount?: number, percentage: number, expiresAt?: string | null, bonusMonths?: number } | null>(null)
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
          let timeString =""
          if (hours > 0) timeString += `${hours} jam `
          if (minutes > 0 || hours > 0) timeString += `${minutes} menit `
          timeString += `${seconds} detik`
          setDiscountTimeLeft(timeString +" Lagi")
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
          fetch("/api/tenant/billing", { cache:"no-store" }),
          fetch("/api/plans", { cache:"no-store" }),
        ])
        const billingData = await billingRes.json()
        const plansData: PlanInfo[] = await plansRes.json()
        setBilling(billingData)
        setStudentCount(billingData?.pricing?.MIN_STUDENTS || 50)
        const proData = plansData.find((p) => p.slug ==="pro") || null
        const liteData = plansData.find((p) => p.slug ==="lite") || null
        setProPlan(proData)
        setLitePlan(liteData)
        setFreePlan(plansData.find((p) => p.slug ==="free") || null)
        
        // Ensure default selected plan is valid
        if (billingData?.plan ==="lite") {
          // Lite tenant: default perpanjang Lite
          setSelectedPlanSlug("lite")
        } else if (billingData?.plan !=="pro") {
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
        toast({ title:"Error", description:"Gagal memuat data.", variant:"destructive" })
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [])

  const pricing = billing?.pricing || { PRICE_PER_STUDENT: 30000, MIN_STUDENTS: 50 }
  const isPro = billing?.plan ==="pro"
  const isLite = billing?.plan ==="lite"
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

  const selectedPlanInfo = selectedPlanSlug ==="pro" ? proPlan : selectedPlanSlug ==="lite" ? litePlan : null
  const baseSubTotal = selectedPlanSlug ==="pro" ? studentCount * effectivePricePerStudent : (litePlan?.price || 0)
  const subTotal = baseSubTotal * proratedRatio
  
  let discountAmount = 0
  if (appliedDiscount) {
    if (appliedDiscount.type === "CASHBACK") {
      discountAmount = 0 // Cashback doesn't reduce total cost
    } else {
      discountAmount = subTotal * (appliedDiscount.percentage / 100)
    }
  }
  
  const totalCost = subTotal - discountAmount

  const handleValidateDiscount = async (isAuto = false) => {
    if (!discountCodeInput) return
    setValidatingDiscount(true)
    try {
      const res = await fetch("/api/tenant/billing/validate-discount", {
        method:"POST",
        headers: {"Content-Type":"application/json" },
        body: JSON.stringify({ code: discountCodeInput }),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error ||"Kode tidak valid")
      setAppliedDiscount({ 
        code: result.code, 
        type: result.type,
        cashbackAmount: result.cashbackAmount,
        percentage: result.percentage, 
        expiresAt: result.expiresAt, 
        bonusMonths: result.bonusMonths 
      })
      if (!isAuto) {
        if (result.type === "CASHBACK") {
          toast({ title:"Berhasil", description: `Kupon Cashback berhasil diterapkan!` })
        } else {
          toast({ title:"Berhasil", description: `Diskon ${result.percentage}% diterapkan!` })
        }
      }
    } catch (err: any) {
      setAppliedDiscount(null)
      if (!isAuto) {
        toast({ title:"Gagal", description: err.message, variant:"destructive" })
      }
    } finally {
      setValidatingDiscount(false)
    }
  }

  // Auto-apply discount code
  useEffect(() => {
    if (discountCodeInput.length >= 3 && !appliedDiscount) {
      const handler = setTimeout(() => {
        handleValidateDiscount(true)
      }, 800)
      return () => clearTimeout(handler)
    } else if (!discountCodeInput && appliedDiscount) {
      setAppliedDiscount(null)
    }
  }, [discountCodeInput])

  const handleRemoveDiscount = () => {
    setAppliedDiscount(null)
    setDiscountCodeInput("")
  }

  const handleCheckout = async () => {
    if (selectedPlanSlug ==="pro" && studentCount < minStudents) {
      toast({ title:"Gagal", description: `Minimal ${minStudents} siswa`, variant:"destructive" })
      return
    }
    setCheckingOut(true)
    const endpoint = isPro ?"/api/tenant/billing/addon" :"/api/tenant/billing/checkout"
    try {
      const res = await fetch(endpoint, {
        method:"POST",
        headers: {"Content-Type":"application/json" },
        body: JSON.stringify({ studentCount: selectedPlanSlug ==="pro" ? studentCount : 0, planSlug: selectedPlanSlug, discountCode: appliedDiscount?.code }),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error ||"Gagal membuat invoice")
      setInvoice(result)
      setShowInvoice(true)
    } catch (err: any) {
      toast({ title:"Error", description: err.message, variant:"destructive" })
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

      <PlanCards
        billing={billing}
        freePlan={freePlan}
        litePlan={litePlan}
        proPlan={proPlan}
        pricing={pricing}
        isPro={isPro}
        isLite={isLite}
        effectivePricePerStudent={effectivePricePerStudent}
        isUsingLockedPrice={isUsingLockedPrice}
        checkingOut={checkingOut}
        daysRemaining={daysRemaining}
        setSelectedPlanSlug={setSelectedPlanSlug}
        setShowCheckoutModal={setShowCheckoutModal}
      />

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

      <CheckoutDialog
        showCheckoutModal={showCheckoutModal}
        setShowCheckoutModal={setShowCheckoutModal}
        selectedPlanSlug={selectedPlanSlug}
        isPro={isPro}
        daysRemaining={daysRemaining}
        minStudents={minStudents}
        studentCount={studentCount}
        setStudentCount={setStudentCount}
        baseSubTotal={baseSubTotal}
        subTotal={subTotal}
        appliedDiscount={appliedDiscount}
        totalCost={totalCost}
        effectivePricePerStudent={effectivePricePerStudent}
        isUsingLockedPrice={isUsingLockedPrice}
        discountCodeInput={discountCodeInput}
        setDiscountCodeInput={setDiscountCodeInput}
        validatingDiscount={validatingDiscount}
        handleRemoveDiscount={handleRemoveDiscount}
        handleValidateDiscount={handleValidateDiscount}
        discountTimeLeft={discountTimeLeft}
        checkingOut={checkingOut}
        billing={billing}
        handleCheckout={handleCheckout}
      />

      <InvoiceDialog
        showInvoice={showInvoice}
        setShowInvoice={setShowInvoice}
        invoice={invoice}
        selectedPlanSlug={selectedPlanSlug}
        billing={billing}
        copied={copied}
        copyRef={copyRef}
      />
    </div>
  )
}
