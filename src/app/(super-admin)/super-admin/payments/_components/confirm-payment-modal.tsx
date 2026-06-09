import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle
} from "@/components/ui/dialog"
import { ShieldCheck } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface Payment {
  id: string
  reference: string
  amount: number
  method: string | null
  status: string
  plan: string
  createdAt: string
  paidAt: string | null
  metadata: any
  tenant: { name: string; slug: string }
}

interface ConfirmPaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payment: Payment | null;
  onSuccess: () => void;
}

export function ConfirmPaymentModal({ open, onOpenChange, payment, onSuccess }: ConfirmPaymentModalProps) {
  const [confirming, setConfirming] = useState(false)

  const handleConfirm = async () => {
    if (!payment) return
    setConfirming(true)
    try {
      const res = await fetch("/api/super-admin/payments/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId: payment.id }),
      })
      const result = await res.json()
      if (res.ok) {
        toast({ title: "✅ Berhasil!", description: result.message })
        onOpenChange(false)
        onSuccess()
      } else {
        toast({ title: "Gagal", description: result.error, variant: "destructive" })
      }
    } catch (e) {
      toast({ title: "Gagal", description: "Terjadi kesalahan.", variant: "destructive" })
    } finally {
      setConfirming(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10">
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
            </div>
            Konfirmasi Pembayaran
          </DialogTitle>
          <DialogDescription>
            Tindakan ini akan mengaktifkan paket berlangganan untuk tenant berikut secara permanen.
          </DialogDescription>
        </DialogHeader>
        {payment && (
          <div className="py-2 space-y-3">
            <div className="rounded-2xl bg-muted/50 border p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tenant</span>
                <span className="font-bold">{payment.tenant.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Nominal</span>
                <span className="font-bold text-primary">Rp {payment.amount.toLocaleString("id-ID")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Jumlah Siswa</span>
                <span className="font-bold">{(payment.metadata as any)?.studentCount || "—"} siswa</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Masa Aktif</span>
                <span className="font-bold">1 Tahun</span>
              </div>
            </div>
            <p className="text-xs text-amber-600 bg-amber-50 rounded-xl p-3 border border-amber-200">
              ⚠️ Pastikan Anda sudah menerima pembayaran dari tenant sebelum mengkonfirmasi.
            </p>
          </div>
        )}
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={confirming} className="rounded-xl">
            Batal
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={confirming}
            className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white border-0 gap-2 flex items-center justify-center"
          >
            {confirming ? (
              <><div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> Memproses...</>
            ) : (
              <><ShieldCheck className="h-4 w-4" /> Ya, Konfirmasi & Aktifkan Paket</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
