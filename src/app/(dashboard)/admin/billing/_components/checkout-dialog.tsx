import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from"@/components/ui/dialog"
import { Button } from"@/components/ui/button"
import { Input } from"@/components/ui/input"
import { Label } from"@/components/ui/label"
import { Star, ShieldCheck, Users, Tag, CheckCircle2, ArrowRight } from"lucide-react"
import { cn } from"@/lib/utils"
import { TenantBilling } from"./types"

interface CheckoutDialogProps {
  showCheckoutModal: boolean
  setShowCheckoutModal: (show: boolean) => void
  selectedPlanSlug: string
  isPro: boolean
  daysRemaining: number
  minStudents: number
  studentCount: number
  setStudentCount: (count: number) => void
  baseSubTotal: number
  subTotal: number
  appliedDiscount: { code: string, type?: string, cashbackAmount?: number, percentage: number, bonusMonths?: number } | null
  totalCost: number
  effectivePricePerStudent: number
  isUsingLockedPrice: boolean
  discountCodeInput: string
  setDiscountCodeInput: (code: string) => void
  validatingDiscount: boolean
  handleRemoveDiscount: () => void
  handleValidateDiscount: () => void
  discountTimeLeft: string | null
  checkingOut: boolean
  billing: TenantBilling | null
  handleCheckout: () => void
}

export function CheckoutDialog({
  showCheckoutModal, setShowCheckoutModal, selectedPlanSlug, isPro, daysRemaining,
  minStudents, studentCount, setStudentCount, baseSubTotal, subTotal, appliedDiscount,
  totalCost, effectivePricePerStudent, isUsingLockedPrice, discountCodeInput,
  setDiscountCodeInput, validatingDiscount, handleRemoveDiscount, handleValidateDiscount,
  discountTimeLeft, checkingOut, billing, handleCheckout
}: CheckoutDialogProps) {
  return (
    <Dialog open={showCheckoutModal} onOpenChange={setShowCheckoutModal}>
      <DialogContent className="max-w-md rounded-2xl p-0 overflow-hidden border-0 shadow-2xl">
        <div className={cn("h-1.5",
          selectedPlanSlug ==="pro" ?"bg-gradient-to-r from-amber-400 to-orange-500" :"bg-gradient-to-r from-blue-400 to-indigo-500"
        )} />
        <DialogHeader className="px-6 pt-5 pb-2">
          <DialogTitle className="flex items-center gap-2">
            {selectedPlanSlug ==="pro" ? (
              <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
              </div>
            ) : (
              <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <ShieldCheck className="h-4 w-4 text-blue-600" />
              </div>
            )}
            {selectedPlanSlug ==="pro" 
              ? (isPro ?"Tambah Kuota Siswa" :"Upgrade ke PRO")
              : (billing?.plan ==="lite" ?"Perpanjang Paket LITE" :"Upgrade ke LITE")}
          </DialogTitle>
          <DialogDescription>
            {selectedPlanSlug ==="pro"
              ? (isPro 
                ? `Biaya disesuaikan (pro-rata) dengan sisa masa aktif Anda (${daysRemaining} hari).`
                :"Masukkan jumlah siswa untuk menghitung biaya.")
              :"Dapatkan fitur Lite untuk masa aktif 1 tahun ke depan."}
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-4 space-y-4">
          {/* Student Count - ONLY FOR PRO */}
          {selectedPlanSlug ==="pro" && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-semibold">
                <Users className="h-4 w-4 text-primary" /> {isPro ?"Jumlah Tambah Siswa" :"Jumlah Siswa Aktif"}
              </Label>
              <Input
                type="number" min={minStudents}
                value={studentCount}
                onChange={(e) => setStudentCount(Number(e.target.value))}
                className="rounded-xl h-12 text-lg font-semibold"
              />
              <p className="text-[11px] text-muted-foreground">
                Minimal {isPro ?"tambah" :"upgrade"}: <strong>{minStudents} siswa</strong>
              </p>
            </div>
          )}

          {/* Cost Calculation */}
          <div className="p-4 rounded-2xl bg-primary/5 border border-primary/15 space-y-1.5">
            <p className="text-xs text-muted-foreground font-medium">Estimasi Biaya {(isPro && selectedPlanSlug ==="pro") &&"(Pro-rata)"}</p>
            
            {isPro && selectedPlanSlug ==="pro" && (
              <div className="flex justify-between text-[11px] text-muted-foreground mb-1">
                <span>Harga Normal ({studentCount} siswa)</span>
                <span>Rp {baseSubTotal.toLocaleString("id-ID")}</span>
              </div>
            )}
            
            {appliedDiscount && appliedDiscount.type !== "CASHBACK" && (
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
              {selectedPlanSlug ==="pro" 
                ? <>Rp {Number(effectivePricePerStudent).toLocaleString("id-ID")} / siswa / tahun</>
                : <>Biaya perpanjangan langganan tetap</>
              }
              {isUsingLockedPrice && selectedPlanSlug ==="pro" && (
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
                  {validatingDiscount ?"..." :"Gunakan"}
                </Button>
              )}
            </div>
            {appliedDiscount && (
              <div className="flex flex-col gap-1 mt-1">
                <p className="text-xs text-emerald-600 flex items-center gap-1 font-medium">
                  <CheckCircle2 className="h-3 w-3" /> Kode {appliedDiscount.code} berhasil diterapkan!
                </p>
                {appliedDiscount.type === "CASHBACK" && (
                  <div className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-1.5 rounded-md border border-emerald-100 font-medium ml-4 mt-0.5">
                    💰 Cashback senilai {appliedDiscount.cashbackAmount ? `Rp ${appliedDiscount.cashbackAmount.toLocaleString('id-ID')}` : `${appliedDiscount.percentage}%`} akan masuk ke saldo komisi.
                  </div>
                )}
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
            className="w-full h-12 rounded-xl btn-gradient text-white border-0 gap-2 text-base font-semibold shadow-lg shadow-primary/20 flex items-center justify-center"
            disabled={checkingOut || (selectedPlanSlug ==="pro" && studentCount < minStudents) || billing?.hasPendingInvoice}
            onClick={() => { handleCheckout(); }}
          >
            {checkingOut ?"Membuat Invoice..." : 
              selectedPlanSlug ==="pro" 
                ? (isPro ?"Buat Tagihan Penambahan Kuota" :"Upgrade ke Pro Sekarang")
                : (billing?.plan ==="lite" ?"Perpanjang Lite Sekarang" :"Upgrade ke Lite Sekarang")}
            <ArrowRight className="h-5 w-5" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
