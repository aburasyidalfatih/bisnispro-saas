import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle
} from "@/components/ui/dialog"
import { AlertCircle } from "lucide-react"
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

interface RefundPaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payment: Payment | null;
  onSuccess: () => void;
}

export function RefundPaymentModal({ open, onOpenChange, payment, onSuccess }: RefundPaymentModalProps) {
  const [refunding, setRefunding] = useState(false)

  const handleRefund = async () => {
    if (!payment) return
    setRefunding(true)
    try {
      const res = await fetch("/api/super-admin/payments/refund", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId: payment.id }),
      })
      const result = await res.json()
      if (res.ok) {
        toast({ title: "Refund Berhasil", description: result.message })
        onOpenChange(false)
        onSuccess()
      } else {
        toast({ title: "Gagal", description: result.error, variant: "destructive" })
      }
    } catch (e) {
      toast({ title: "Gagal", description: "Terjadi kesalahan.", variant: "destructive" })
    } finally {
      setRefunding(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-orange-600">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500/10">
              <AlertCircle className="h-5 w-5" />
            </div>
            Refund & Batalkan Langganan
          </DialogTitle>
          <DialogDescription>
            Tindakan ini akan mengembalikan status transaksi menjadi <strong>Refunded</strong>, mengurangi angka omset, dan langsung menurunkan paket <strong>{payment?.tenant.name}</strong> menjadi FREE.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-4">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={refunding} className="rounded-xl">
            Batal
          </Button>
          <Button
            onClick={handleRefund}
            disabled={refunding}
            className="rounded-xl bg-orange-600 hover:bg-orange-700 text-white border-0 gap-2"
          >
            {refunding ? "Memproses..." : "Ya, Refund Sekarang"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
