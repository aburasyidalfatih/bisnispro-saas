"use client"

import { useEffect, useState, use } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Wallet, UploadCloud, CheckCircle, Info, CreditCard } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { confirmPayment } from "@/features/ppdb/actions/ppdb-actions"
import { ImageUploadDirect } from "@/components/ui/image-upload-direct"

export default function PpdbPaymentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data: session } = useSession()
  const { toast } = useToast()
  const router = useRouter()
  const [tagihan, setTagihan] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [rekening, setRekening] = useState<any[]>([])

  useEffect(() => {
    // Fetch tagihan detail
    fetch(`/api/ppdb/tagihan/${id}`) // I need this API
      .then(r => r.json())
      .then(setTagihan)
      .catch(() => {})
      .finally(() => setLoading(false))

    // Fetch bank accounts
    const tid = session?.user?.tenants?.[0]?.id
    if (tid) {
      fetch(`/api/ppdb/rekening?tenantId=${tid}`) // I need this API
        .then(r => r.json())
        .then(setRekening)
        .catch(() => {})
    }
  }, [id, session])

  const [formData, setFormData] = useState({
    buktiUrl: "",
    nominal: 0
  })

  const handleConfirm = async () => {
    if (!formData.buktiUrl || !formData.nominal) {
      toast({ title: "Error", description: "Lengkapi data bukti pembayaran", variant: "destructive" })
      return
    }

    setSubmitting(true)
    try {
      const res = await confirmPayment({
        tagihanId: id,
        nominal: formData.nominal,
        buktiUrl: formData.buktiUrl
      })

      if (res.success) {
        toast({ title: "Berhasil!", description: "Konfirmasi pembayaran telah dikirim." })
        router.push(`/ortu/ppdb/status/${tagihan.pendaftarId}`)
      }
    } catch (error) {
      console.error(error)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>

  return (
    <div className="pb-10 font-sans">
      {/* Top Header Mobile Style */}
      <div className="bg-primary rounded-b-[2.5rem] pt-6 pb-24 px-6 relative z-0">
        <div className="flex items-center gap-3 text-primary-foreground mb-4">
          <Link href={`/ortu/ppdb`} className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm shrink-0">
             <ArrowLeft className="h-4 w-4" />
          </Link>
          <h1 className="font-bold text-lg">Pembayaran {tagihan?.jenis}</h1>
        </div>
        <p className="text-primary-foreground/80 text-sm">Silakan transfer sesuai nominal ke salah satu rekening di bawah.</p>
      </div>

      <div className="-mt-14 relative z-10 px-5 space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
        {/* Left: Bank Accounts */}
        <div className="space-y-6">
           <Card className="glass border-0 shadow-xl p-8 bg-gradient-to-br from-primary/10 to-transparent">
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Total Tagihan</span>
              <h2 className="text-4xl font-black text-primary mt-1">Rp {tagihan?.nominal.toLocaleString()}</h2>
              <div className="mt-6 p-4 rounded-2xl bg-white/50 dark:bg-black/20 border border-white flex gap-3 items-center">
                 <Info className="h-4 w-4 text-primary" />
                 <p className="text-[11px] leading-tight">Mohon transfer dengan nominal <b>persis</b> agar verifikasi lebih cepat.</p>
              </div>
           </Card>

           <div className="space-y-3">
              <h3 className="text-sm font-bold px-2">Daftar Rekening Pembayaran</h3>
              {rekening.length > 0 ? rekening.map((rek) => (
                <Card key={rek.id} className="glass border-0 shadow-sm p-4 group">
                   <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                         <div className="h-10 w-10 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center border border-border/50">
                            <CreditCard className="h-5 w-5 text-muted-foreground" />
                         </div>
                         <div>
                            <p className="text-xs font-bold uppercase text-muted-foreground">{rek.bankName}</p>
                            <p className="text-lg font-mono font-bold tracking-wider">{rek.noRekening}</p>
                            <p className="text-[10px] font-medium">a.n {rek.atasNama}</p>
                         </div>
                      </div>
                      <Button variant="ghost" size="sm" className="rounded-lg text-[10px] uppercase font-bold" onClick={() => {
                        navigator.clipboard.writeText(rek.noRekening)
                        toast({ title: "Salin", description: "Nomor rekening disalin" })
                      }}>Salin</Button>
                   </div>
                </Card>
              )) : (
                <div className="text-center py-10 text-muted-foreground text-xs italic">Rekening bank belum tersedia.</div>
              )}
           </div>
        </div>

        {/* Right: Confirmation Form */}
        <Card className="glass border-0 shadow-xl overflow-hidden">
           <CardHeader className="bg-primary/5 border-b border-primary/10">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                 <UploadCloud className="h-5 w-5 text-primary" /> Konfirmasi Pembayaran
              </CardTitle>
           </CardHeader>
           <CardContent className="p-6 space-y-6">
              <div className="space-y-2">
                 <Label>Nominal yang Ditransfer</Label>
                 <Input 
                   type="number" 
                   placeholder="Masukkan jumlah yang Anda bayar"
                   className="h-12 rounded-xl border-0 bg-muted/50 font-bold"
                   value={formData.nominal || ""}
                   onChange={(e) => setFormData({...formData, nominal: parseInt(e.target.value) || 0})}
                 />
              </div>

              <div className="space-y-2">
                 <Label>Bukti Transfer (Gambar/PDF)</Label>
                 <ImageUploadDirect 
                    value={formData.buktiUrl}
                    onChange={(url) => setFormData({...formData, buktiUrl: url})}
                    tenantId={session?.user?.tenants?.[0]?.id || "unknown"}
                    subDir="bukti-transfer"
                 />
              </div>

              <Button 
                className="w-full h-12 rounded-xl btn-gradient text-white font-bold border-0 flex items-center justify-center"
                onClick={handleConfirm}
                disabled={submitting}
              >
                {submitting ? "Mengirim..." : "Konfirmasi Sekarang"}
              </Button>
           </CardContent>
        </Card>
      </div>
      </div>
    </div>
  )
}
