import { Card, CardContent, CardDescription, CardHeader, CardTitle } from"@/components/ui/card"
import { Button } from"@/components/ui/button"
import { Badge } from"@/components/ui/badge"
import { CheckCircle2, Zap, ShieldCheck, Star, ArrowRight, Users } from"lucide-react"
import { cn } from"@/lib/utils"
import { TenantBilling, PlanInfo } from"./types"

interface PlanCardsProps {
  billing: TenantBilling | null
  freePlan: PlanInfo | null
  litePlan: PlanInfo | null
  proPlan: PlanInfo | null
  pricing: { PRICE_PER_STUDENT: number; MIN_STUDENTS: number }
  isPro: boolean
  isLite: boolean
  effectivePricePerStudent: number
  isUsingLockedPrice: boolean
  checkingOut: boolean
  daysRemaining: number
  setSelectedPlanSlug: (slug: string) => void
  setShowCheckoutModal: (show: boolean) => void
}

export function PlanCards({
  billing, freePlan, litePlan, proPlan, pricing, isPro, isLite,
  effectivePricePerStudent, isUsingLockedPrice, checkingOut, daysRemaining,
  setSelectedPlanSlug, setShowCheckoutModal
}: PlanCardsProps) {
  return (
    <div className="grid gap-6 md:grid-cols-3">
      {/* ── Card FREE ── */}
      <Card className={cn("border-0 shadow-lg overflow-hidden flex flex-col relative transition-all",
        billing?.plan ==="free" ?"ring-2 ring-slate-400" :"glass"
      )}>
        <div className="h-1.5 bg-slate-300" />
        {billing?.plan ==="free" && (
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
                <div className="flex items-center gap-2.5 text-sm"><CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" /><span>Website Perusahaan</span></div>
                <div className="flex items-center gap-2.5 text-sm"><CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" /><span>Data Master</span></div>
                <div className="flex items-center gap-2.5 text-sm"><CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" /><span>Subdomain Gratis</span></div>
              </>
            )}
          </div>

          <div className="mt-auto pt-3">
            {billing?.plan ==="free" ? (
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
      {litePlan && <Card className={cn("border-0 shadow-lg overflow-hidden flex flex-col relative transition-all",
        billing?.plan ==="lite" ?"ring-2 ring-blue-500" :"glass",
        litePlan?.isPopular && billing?.plan !=="lite" &&"ring-2 ring-primary/30"
      )}>
        <div className="h-1.5 bg-gradient-to-r from-blue-400 to-indigo-500" />
        {billing?.plan ==="lite" && (
          <div className="absolute top-4 right-4 z-10">
            <Badge className="bg-blue-600 text-white text-[10px] shadow-md">Paket Anda</Badge>
          </div>
        )}
        {litePlan?.isPopular && billing?.plan !=="lite" && (
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
              <CardDescription>{litePlan?.description ||"Paket menengah untuk perusahaan berkembang"}</CardDescription>
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
          {billing?.plan ==="lite" && billing.expiresAt && (
            <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/30 rounded-xl px-3 py-2.5">
              <div className="flex items-center gap-2">
                <div className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                </div>
                <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">Aktif</span>
              </div>
              <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                s/d {new Date(billing.expiresAt).toLocaleDateString("id-ID", { day:"numeric", month:"short", year:"numeric" })}
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
                <div className="flex items-center gap-2.5 text-sm"><CheckCircle2 className="h-4 w-4 text-blue-500 shrink-0" /><span>Kehadiran Staf (GTK)</span></div>
                <div className="flex items-center gap-2.5 text-sm"><CheckCircle2 className="h-4 w-4 text-blue-500 shrink-0" /><span>Semua fitur Free</span></div>
              </>
            )}
          </div>

          <div className="mt-auto pt-3">
            {billing?.plan ==="lite" ? (
              <Button 
                className="w-full h-11 rounded-xl btn-gradient text-white border-0 gap-2 font-semibold shadow-lg shadow-primary/20 flex items-center justify-center"
                disabled={checkingOut || billing?.hasPendingInvoice || !billing?.upgradeEnabled}
                onClick={() => { setSelectedPlanSlug("lite"); setShowCheckoutModal(true) }}
              >
                {checkingOut ?"Membuat Invoice..." :"Perpanjang Sekarang"}
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : billing?.plan ==="pro" ? (
              <Button disabled className="w-full h-11 rounded-xl cursor-default" variant="ghost">
                Sudah di paket PRO
              </Button>
            ) : (
              <Button 
                className="w-full h-11 rounded-xl bg-primary hover:bg-blue-700 text-white border-0 gap-2 font-semibold shadow-lg shadow-blue-500/20"
                disabled={checkingOut || billing?.hasPendingInvoice || !billing?.upgradeEnabled}
                onClick={() => { setSelectedPlanSlug("lite"); setShowCheckoutModal(true) }}
              >
                {checkingOut ?"Membuat Invoice..." :"Upgrade ke Lite"}
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>}

      {/* ── Card PRO ── */}
      {proPlan && <Card className={cn("border-0 shadow-lg overflow-hidden flex flex-col relative transition-all",
        billing?.plan ==="pro" ?"ring-2 ring-emerald-500" :"glass"
      )}>
        <div className="h-1.5 bg-gradient-to-r from-yellow-400 to-amber-500" />
        {billing?.plan ==="pro" && (
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
              <CardDescription>{proPlan?.description ||"Fitur lengkap untuk perusahaan modern"}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col flex-1 space-y-4">
          <div>
            <div className="flex items-end gap-1">
              <span className="text-sm font-semibold text-muted-foreground">Rp</span>
              <span className="text-3xl font-black">{Number(effectivePricePerStudent).toLocaleString("id-ID")}</span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">Per klien / tahun · Min. {pricing.MIN_STUDENTS} klien</p>
            {isUsingLockedPrice && (
              <span className="text-[9px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded font-semibold dark:bg-blue-900/30 dark:text-blue-400">Harga Kontrak</span>
            )}
          </div>

          {/* Masa aktif + kapasitas jika Pro */}
          {billing?.plan ==="pro" && (
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
                  s/d {billing?.expiresAt ? new Date(billing.expiresAt).toLocaleDateString("id-ID", { day:"numeric", month:"short", year:"numeric" }) :"Selamanya"}
                </span>
              </div>
              <div className="flex items-center justify-between bg-muted/40 rounded-xl px-3 py-2">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Kapasitas</span>
                <span className="text-sm font-bold flex items-center gap-1">
                  <Users className="h-3.5 w-3.5 text-primary" /> {billing?.employeeCount || 0} Karyawan
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
                <div className="flex items-center gap-2.5 text-sm"><CheckCircle2 className="h-4 w-4 text-amber-500 shrink-0" /><span>Manajemen Operasional</span></div>
                <div className="flex items-center gap-2.5 text-sm"><CheckCircle2 className="h-4 w-4 text-amber-500 shrink-0" /><span>Keuangan & Invoicing</span></div>
                <div className="flex items-center gap-2.5 text-sm"><CheckCircle2 className="h-4 w-4 text-amber-500 shrink-0" /><span>Absensi Klien & Donasi</span></div>
              </>
            )}
          </div>

          <div className="mt-auto pt-3">
            {billing?.plan ==="pro" ? (
              <Button 
                className="w-full h-11 rounded-xl btn-gradient text-white border-0 gap-2 font-semibold shadow-lg shadow-primary/20 flex items-center justify-center"
                disabled={checkingOut || billing?.hasPendingInvoice || !billing?.upgradeEnabled}
                onClick={() => { setSelectedPlanSlug("pro"); setShowCheckoutModal(true) }}
              >
                Tambah Kuota Klien
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button 
                className="w-full h-11 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white border-0 gap-2 font-semibold shadow-lg shadow-amber-500/20"
                disabled={checkingOut || billing?.hasPendingInvoice || !billing?.upgradeEnabled}
                onClick={() => { setSelectedPlanSlug("pro"); setShowCheckoutModal(true) }}
              >
                Upgrade ke Pro
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>}
    </div>
  )
}
