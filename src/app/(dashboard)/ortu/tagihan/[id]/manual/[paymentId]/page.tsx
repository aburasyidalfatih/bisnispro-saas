import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import { UploadProofForm } from "./_components/upload-proof-form"

export default async function ManualInvoicePaymentPage({ params }: { params: Promise<{ id: string, paymentId: string }> }) {
  const { id, paymentId } = await params
  const session = await auth()
  if (!session?.user) redirect("/login")

  const payment = await db.invoicePayment.findUnique({
    where: { id: paymentId },
    include: { tenant: true }
  })

  if (!payment) {
    redirect(`/ortu/tagihan/${id}`)
  }

  const invoice = await db.invoice.findUnique({
     where: { id }
  })

  let meta: any = {}
  try {
     meta = JSON.parse(payment.notes || "{}")
  } catch (e) {}

  const isPaid = payment.status === "VERIFIED"
  const isPending = payment.status === "PENDING_VERIFICATION"

  return (
    <div className="pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-xl mx-auto md:mt-8 md:rounded-3xl md:overflow-hidden md:border md:shadow-2xl md:shadow-indigo-500/10 bg-background">
      {/* Header Premium */}
      <div className="bg-gradient-to-br from-indigo-600 to-purple-700 pt-10 pb-20 px-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <svg className="h-32 w-32 -mr-10 -mt-10" fill="currentColor" viewBox="0 0 24 24"><path d="M21 18v1a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v1h-9a2 2 0 00-2 2v8a2 2 0 002 2h9zm-9-2h10V8H12v8zm4-2.5a1.5 1.5 0 110-3 1.5 1.5 0 010 3z" /></svg>
        </div>
        <div className="relative z-10">
          <Link href={`/ortu/tagihan/${id}`} className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-white/20 text-white hover:bg-white/30 backdrop-blur-md transition-colors mb-6 cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6"><path d="m15 18-6-6 6-6"/></svg>
          </Link>
          <h1 className="text-2xl font-black text-white">Instruksi Pembayaran</h1>
          <p className="text-indigo-200 mt-1 text-sm">Transfer manual untuk pembayaran tagihan {invoice?.title}.</p>
        </div>
      </div>

      <div className="px-5 -mt-12 space-y-5 relative z-10">
         <Card className="glass border-0 shadow-xl overflow-hidden">
            <CardContent className="p-6">
               <div className="text-center mb-6">
                  <p className="text-sm font-semibold text-muted-foreground mb-1">Total Pembayaran</p>
                  <p className="text-3xl font-black text-primary">Rp {payment.amount.toLocaleString("id-ID")}</p>
               </div>

               <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-6">
                  <p className="text-xs text-muted-foreground mb-2">Transfer ke rekening berikut:</p>
                  <p className="text-lg font-bold text-foreground">{meta?.bankName}</p>
                  <p className="text-2xl font-mono font-black text-primary my-1 tracking-widest">{meta?.accountNumber}</p>
                  <p className="text-sm font-medium text-muted-foreground">a/n {meta?.accountName}</p>
               </div>

               {isPaid ? (
                  <div className="text-center p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
                     <p className="text-emerald-600 font-bold">Pembayaran Berhasil Diverifikasi</p>
                     <p className="text-xs text-emerald-600/80 mt-1">Tagihan ini telah dinyatakan lunas.</p>
                  </div>
               ) : isPending ? (
                  <div className="text-center p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                     <p className="text-amber-600 font-bold">Menunggu Verifikasi Admin</p>
                     <p className="text-xs text-amber-600/80 mt-1">Bukti transfer Anda sedang dicek oleh petugas. Tagihan akan otomatis lunas setelah diverifikasi.</p>
                  </div>
               ) : (
                  <UploadProofForm paymentId={payment.id} invoiceId={id} />
               )}
            </CardContent>
         </Card>
      </div>
    </div>
  )
}
