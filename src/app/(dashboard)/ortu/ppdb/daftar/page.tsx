"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { UserPlus, Calendar, ArrowRight, ArrowLeft, ClipboardList, Info } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { submitRegistration } from "@/features/ppdb/actions/ppdb-actions"

export default function PpdbRegisterPage() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const router = useRouter()
  const [periods, setPeriods] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  
  const [tenantId, setTenantId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    periodeId: "",
    namaLengkap: "",
  })

  useEffect(() => {
    const tid = session?.user?.tenants?.[0]?.id
    if (tid) setTenantId(tid)
  }, [session])

  useEffect(() => {
    if (!tenantId) return
    fetch(`/api/ppdb/periode?tenantId=${tenantId}&active=true`)
      .then((r) => r.json())
      .then((data) => {
        const activeOnly = data.filter((p: any) => p.isActive)
        setPeriods(activeOnly)
        if (activeOnly.length > 0) {
          setFormData(prev => ({ ...prev, periodeId: activeOnly[0].id }))
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [tenantId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!session?.user?.id || !tenantId || !formData.periodeId || !formData.namaLengkap) {
      toast({ title: "Error", description: "Mohon lengkapi seluruh data", variant: "destructive" })
      return
    }

    setSubmitting(true)
    try {
      const selectedPeriod = periods.find(p => p.id === formData.periodeId)
      const nominal = selectedPeriod?.pengaturan?.biayaPendaftaran || 0

      const result = await submitRegistration({
        tenantId,
        userId: session.user.id,
        periodeId: formData.periodeId,
        namaLengkap: formData.namaLengkap,
        nominalPendaftaran: nominal
      })

      if (result.success) {
        toast({ title: "Berhasil!", description: "Pendaftaran awal berhasil disimpan." })
        router.push(`/dashboard/ppdb/portal/status/${result.data?.pendaftar.id}`)
      } else {
        toast({ title: "Gagal", description: result.error, variant: "destructive" })
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
          <button type="button" onClick={() => router.back()} className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
             <ArrowLeft className="h-4 w-4" />
          </button>
          <h1 className="font-bold text-lg">Daftar Siswa Baru</h1>
        </div>
        <p className="text-primary-foreground/80 text-sm">Lengkapi formulir awal pendaftaran.</p>
      </div>

      <div className="-mt-14 relative z-10 px-5 space-y-5">

      {periods.length === 0 ? (
        <Card className="glass border-0 shadow-lg p-10 text-center">
           <Info className="h-12 w-12 text-amber-500 mx-auto mb-4 opacity-50" />
           <h3 className="text-lg font-bold">Pendaftaran Sedang Tutup</h3>
           <p className="text-muted-foreground text-sm mt-2">Maaf, saat ini tidak ada gelombang pendaftaran yang sedang dibuka.</p>
           <Button variant="outline" className="mt-6 rounded-xl" onClick={() => router.back()}>Kembali</Button>
        </Card>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="glass border-0 shadow-xl overflow-hidden">
            <CardHeader className="bg-primary/5 border-b border-primary/10">
               <CardTitle className="text-lg font-bold flex items-center gap-2">
                 <ClipboardList className="h-5 w-5 text-primary" /> Informasi Dasar
               </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="periode">Gelombang Pendaftaran</Label>
                <Select 
                  value={formData.periodeId} 
                  onValueChange={(val) => setFormData({ ...formData, periodeId: val })}
                >
                  <SelectTrigger className="h-12 rounded-xl border-0 bg-muted/50">
                    <SelectValue placeholder="Pilih gelombang..." />
                  </SelectTrigger>
                  <SelectContent>
                    {periods.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.nama} (Biaya: Rp {p.pengaturan?.biayaPendaftaran?.toLocaleString()})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[10px] text-muted-foreground">Silakan pilih gelombang yang masih tersedia.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="nama">Nama Lengkap Calon Siswa</Label>
                <Input 
                  id="nama"
                  placeholder="Masukkan nama lengkap sesuai akta kelahiran"
                  value={formData.namaLengkap}
                  onChange={(e) => setFormData({ ...formData, namaLengkap: e.target.value })}
                  className="h-12 rounded-xl border-0 bg-muted/50"
                  required
                />
              </div>

              <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 flex gap-4">
                 <div className="h-10 w-10 shrink-0 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Info className="h-5 w-5 text-primary" />
                 </div>
                 <div className="space-y-1">
                    <p className="text-xs font-bold">Penting!</p>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Setelah menekan tombol daftar, Anda akan mendapatkan <b>Nomor Pendaftaran</b> dan diwajibkan melakukan pembayaran biaya pendaftaran untuk melanjutkan ke tahap berikutnya.
                    </p>
                 </div>
              </div>
            </CardContent>
          </Card>

          <Button 
            type="submit" 
            className="w-full h-14 rounded-2xl btn-gradient text-white text-lg font-bold shadow-xl shadow-primary/20 group"
            disabled={submitting}
          >
            {submitting ? "Sedang Memproses..." : (
              <>Daftar Sekarang <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" /></>
            )}
          </Button>
        </form>
      )}
      </div>
    </div>
  )
}
