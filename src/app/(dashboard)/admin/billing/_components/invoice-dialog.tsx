import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from"@/components/ui/dialog"
import { Button } from"@/components/ui/button"
import { Separator } from"@/components/ui/separator"
import { FileText, CheckCheck, Copy, Clock, AlertCircle, MessageCircle, ExternalLink } from"lucide-react"
import Link from"next/link"
import { toast } from"@/hooks/use-toast"
import { TenantBilling, InvoiceData } from"./types"

interface InvoiceDialogProps {
  showInvoice: boolean
  setShowInvoice: (show: boolean) => void
  invoice: InvoiceData | null
  selectedPlanSlug: string
  billing: TenantBilling | null
  copied: boolean
  copyRef: () => void
}

export function InvoiceDialog({
  showInvoice, setShowInvoice, invoice, selectedPlanSlug, billing, copied, copyRef
}: InvoiceDialogProps) {
  return (
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
            <Button variant="ghost" size="icon" onClick={copyRef} className="h-8 w-8 rounded-lg bg-white/20 hover:bg-white/30 transition flex items-center justify-center shrink-0">
              {copied ? <CheckCheck className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4 -mt-4 bg-card rounded-t-2xl">
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Nama Perusahaan</span>
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
                      <span className="text-muted-foreground">Jumlah Klien</span>
                      <span className="font-semibold">{invoice?.studentCount} klien</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Harga per Klien</span>
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
                  day:"numeric", month:"short", year:"numeric",
                  hour:"2-digit", minute:"2-digit"
                }) :"-"}
              </span>
            </div>
          </div>

          <div className="bg-slate-50 border rounded-xl p-3.5 space-y-3 dark:bg-slate-800/50">
            <p className="font-semibold text-[10px] text-muted-foreground uppercase tracking-wider">Rekening Pembayaran</p>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-sm">{billing?.manualPayment?.bank ||"Bank Pembayaran"}</p>
                <p className="text-muted-foreground text-[11px]">a.n {billing?.manualPayment?.name ||"Nama Pemilik"}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-sm">{billing?.manualPayment?.number ||"-"}</span>
                <Button variant="ghost" size="icon" onClick={() => {
                  navigator.clipboard.writeText(billing?.manualPayment?.number ||"")
                  toast({ description:"Nomor rekening disalin" })
                }} className="h-8 w-8 text-muted-foreground hover:text-primary transition"><Copy className="h-4 w-4" /></Button>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 dark:bg-amber-900/10 dark:border-amber-800/30 dark:text-amber-400">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>Invoice ini akan dikonfirmasi secara manual oleh admin. Hubungi kami via WhatsApp setelah melakukan pembayaran.</span>
            </div>
            <Button size="sm" className="shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 h-8 rounded-lg" asChild>
              <a href={`https://wa.me/${billing?.manualPayment?.waNumber ||"6281234567890"}?text=Halo%20Admin%2C%20saya%20ingin%20konfirmasi%20pembayaran%20untuk%20invoice%20${invoice?.reference}`} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="h-3.5 w-3.5" /> Konfirmasi WA
              </a>
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <Button variant="outline" className="rounded-xl" onClick={() => setShowInvoice(false)}>
              Tutup
            </Button>
            <Button className="rounded-xl gap-1.5 btn-gradient text-white border-0 flex items-center justify-center h-10 px-4" asChild>
              <Link href="/admin/billing/history">
                <ExternalLink className="h-4 w-4" /> Lihat Riwayat
              </Link>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
