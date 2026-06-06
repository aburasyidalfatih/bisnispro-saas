import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle
} from "@/components/ui/dialog"
import { XCircle } from "lucide-react"
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

interface CancelPaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payment: Payment | null;
  onSuccess: () => void;
}

export function CancelPaymentModal({ open, onOpenChange, payment, onSuccess }: CancelPaymentModalProps) {
  const [canceling, setCanceling] = useState(false)

  const handleCancel = async () => {
    if (!payment) return
    setCanceling(true)
    try {
      const res = await fetch("/api/super-admin/payments/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId: payment.id }),
      })
      const result = await res.json()
      if (res.ok) {
        toast({ title: "Dibatalkan", description: result.message })
        onOpenChange(false)
        onSuccess()
      } else {
        toast({ title: "Gagal", description: result.error, variant: "destructive" })
      }
    } catch (e) {
      toast({ title: "Gagal", description: "Terjadi kesalahan.", variant: "destructive" })
    } finally {
      setCanceling(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-rose-600">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500/10">
              <XCircle className="h-5 w-5" />
            </div>
            Tolak Pembayaran
          </DialogTitle>
          <DialogDescription>
            Anda yakin ingin membatalkan transaksi dari <strong>{payment?.tenant.name}</strong> ini?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-4">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={canceling} className="rounded-xl">
            Tutup
          </Button>
          <Button
            onClick={handleCancel}
            disabled={canceling}
            className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90 hover:bg-rose-700 text-white border-0 gap-2"
          >
            {canceling ? "Memproses..." : "Ya, Tolak Transaksi"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
