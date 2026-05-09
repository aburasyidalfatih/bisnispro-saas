"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { ChevronLeft, Receipt, Wallet, CreditCard, Building, Info, ShieldCheck, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { format } from "date-fns"
import { id as localeId } from "date-fns/locale"

export default function PaymentCheckoutPage({ params }: { params: { id: string } }) {
  const { data: session } = useSession()
  const tenantId = session?.user?.tenants?.[0]?.id
  const router = useRouter()
  const { toast } = useToast()

  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)
  const [invoice, setInvoice] = useState<any>(null)
  const [wallet, setWallet] = useState<any>(null)
  
  const [paymentMethod, setPaymentMethod] = useState<"WALLET" | "MANUAL">("WALLET")
  const [autoDebit, setAutoDebit] = useState(false)

  useEffect(() => {
    if (!tenantId || !params.id) return
    
    // Simulate fetching invoice detail & wallet
    const fetchData = async () => {
       try {
          const res = await fetch(`/api/ortu/invoices?tenantId=${tenantId}`)
          const invoices = await res.json()
          const inv = invoices.find((i: any) => i.id === params.id)
          if (inv) setInvoice(inv)

          const childRes = await fetch(`/api/ortu/children?tenantId=${tenantId}`)
          const childrenData = await childRes.json()
          if (inv && childrenData.children) {
             const child = childrenData.children.find((c: any) => c.id === inv.studentId)
             if (child?.walletAccount) setWallet(child.walletAccount)
          }
       } catch (e) {
          console.error(e)
       } finally {
          setLoading(false)
       }
    }

    fetchData()
  }, [tenantId, params.id])

  const handlePayment = async () => {
    if (!invoice) return
    setPaying(true)
    
    // Simulasi proses bayar
    setTimeout(() => {
       setPaying(false)
       
       if (paymentMethod === "WALLET") {
          if (wallet?.balance < invoice.amountDue) {
             toast({ title: "Saldo Tidak Cukup", description: "Saldo tabungan anak tidak mencukupi untuk membayar tagihan ini.", variant: "destructive" })
             return
          }
          toast({ title: "Pembayaran Berhasil!", description: "Tagihan telah lunas dipotong dari tabungan siswa." })
       } else {
          toast({ title: "Menunggu Pembayaran", description: "Silakan lakukan transfer ke nomor Virtual Account yang telah dikirimkan." })
       }
       
       if (autoDebit) {
          toast({ title: "Auto-Debit Aktif", description: "Tagihan bulan depan akan otomatis memotong saldo tabungan jika mencukupi." })
       }
       
       router.push("/ortu/tagihan")
    }, 1500)
  }

  if (loading) {
     return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  }

  if (!invoice) {
     return (
        <div className="p-6 text-center">
           <p className="text-muted-foreground">Tagihan tidak ditemukan.</p>
           <Button className="mt-4" onClick={() => router.back()}>Kembali</Button>
        </div>
     )
  }

  const isWalletDisabled = !wallet || wallet.balance < invoice.amountDue

  return (
    <div className="pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-lg mx-auto bg-background min-h-screen">
      {/* Header */}
      <div className="bg-primary pt-10 pb-6 px-6 sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-4 text-primary-foreground">
          <button onClick={() => router.back()} className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors">
            <ChevronLeft className="h-6 w-6" />
          </button>
          <div>
             <h1 className="text-xl font-bold">Pembayaran</h1>
             <p className="text-xs opacity-80">No. {invoice.code}</p>
          </div>
        </div>
      </div>

      <div className="px-5 mt-6 space-y-6">
        {/* Ringkasan Tagihan */}
        <div className="text-center">
           <p className="text-sm text-muted-foreground mb-1">Total Pembayaran</p>
           <h2 className="text-4xl font-black text-foreground mb-2">Rp {invoice.amountDue.toLocaleString('id-ID')}</h2>
           <Badge className="bg-rose-500/10 text-rose-600 border-rose-200">Belum Dibayar</Badge>
        </div>

        <Card className="glass border-0 shadow-sm rounded-2xl overflow-hidden">
           <CardContent className="p-0">
              <div className="p-4 border-b flex justify-between items-center">
                 <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                       <Receipt className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                       <p className="font-bold text-sm">{invoice.title}</p>
                       <p className="text-xs text-muted-foreground">Atas Nama: {invoice.student?.name}</p>
                    </div>
                 </div>
              </div>
              <div className="p-4 bg-muted/20 text-xs flex justify-between">
                 <span className="text-muted-foreground">Jatuh Tempo</span>
                 <span className="font-semibold">{format(new Date(invoice.dueDate), "d MMMM yyyy", { locale: localeId })}</span>
              </div>
           </CardContent>
        </Card>

        {/* Pilih Metode Pembayaran */}
        <div className="space-y-3">
           <h3 className="font-bold text-sm">Pilih Metode Pembayaran</h3>
           
           {/* Metode: Tabungan (Wallet) */}
           <button 
             onClick={() => !isWalletDisabled && setPaymentMethod("WALLET")}
             className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all text-left ${paymentMethod === "WALLET" ? "border-primary bg-primary/5 shadow-sm" : "border-border bg-card hover:bg-muted/50"} ${isWalletDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
           >
              <div className="flex items-center gap-4">
                 <div className={`h-12 w-12 rounded-full flex items-center justify-center shrink-0 ${paymentMethod === "WALLET" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                    <Wallet className="h-6 w-6" />
                 </div>
                 <div>
                    <p className="font-bold text-sm">Tabungan Anak (Wallet)</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Saldo: <span className="font-semibold text-foreground">Rp {wallet?.balance.toLocaleString('id-ID') || '0'}</span></p>
                 </div>
              </div>
              <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === "WALLET" ? "border-primary bg-primary" : "border-muted-foreground"}`}>
                 {paymentMethod === "WALLET" && <div className="h-2 w-2 bg-white rounded-full" />}
              </div>
           </button>
           {isWalletDisabled && (
              <p className="text-[10px] text-rose-500 font-medium px-2 -mt-1"><Info className="h-3 w-3 inline mr-1" />Saldo tabungan tidak mencukupi untuk tagihan ini.</p>
           )}

           {/* Metode: Transfer Manual */}
           <button 
             onClick={() => setPaymentMethod("MANUAL")}
             className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all text-left ${paymentMethod === "MANUAL" ? "border-primary bg-primary/5 shadow-sm" : "border-border bg-card hover:bg-muted/50"}`}
           >
              <div className="flex items-center gap-4">
                 <div className={`h-12 w-12 rounded-full flex items-center justify-center shrink-0 ${paymentMethod === "MANUAL" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                    <Building className="h-6 w-6" />
                 </div>
                 <div>
                    <p className="font-bold text-sm">Transfer Bank / VA</p>
                    <p className="text-xs text-muted-foreground mt-0.5">BCA, Mandiri, BNI, BRI, dll</p>
                 </div>
              </div>
              <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === "MANUAL" ? "border-primary bg-primary" : "border-muted-foreground"}`}>
                 {paymentMethod === "MANUAL" && <div className="h-2 w-2 bg-white rounded-full" />}
              </div>
           </button>
        </div>

        {/* Fitur Auto-Debit */}
        <Card className="border border-indigo-500/20 bg-indigo-500/5 shadow-none rounded-2xl">
           <CardContent className="p-4 flex items-center justify-between gap-4">
              <div>
                 <div className="flex items-center gap-2 mb-1">
                    <ShieldCheck className="h-4 w-4 text-indigo-600" />
                    <h4 className="font-bold text-sm text-indigo-900">Auto-Debit Tabungan</h4>
                 </div>
                 <p className="text-[10px] text-indigo-700/80 leading-relaxed">
                    Aktifkan fitur ini agar tagihan bulan depan otomatis dibayar menggunakan saldo tabungan anak (jika saldo mencukupi).
                 </p>
              </div>
              <Switch checked={autoDebit} onCheckedChange={setAutoDebit} className="data-[state=checked]:bg-indigo-600" />
           </CardContent>
        </Card>

      </div>

      {/* Floating Checkout Button */}
      <div className="fixed bottom-0 left-0 right-0 p-5 bg-background/80 backdrop-blur-md border-t z-30 sm:static sm:bg-transparent sm:border-0 sm:mt-10 sm:p-5">
         <div className="max-w-lg mx-auto">
            <Button 
               onClick={handlePayment} 
               disabled={paying || (paymentMethod === "WALLET" && isWalletDisabled)}
               className="w-full h-14 rounded-2xl text-lg font-bold shadow-lg shadow-primary/20"
            >
               {paying ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : "Bayar Sekarang"}
            </Button>
            <p className="text-center text-[10px] text-muted-foreground mt-3 flex items-center justify-center gap-1">
               <ShieldCheck className="h-3 w-3" /> Pembayaran aman dengan enkripsi bank standar.
            </p>
         </div>
      </div>
    </div>
  )
}
