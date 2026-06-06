"use client"

import { useEffect, useState, use } from"react"
import { useSession } from"next-auth/react"
import { Button } from"@/components/ui/button"
import { ArrowLeft, CheckCircle, XCircle, FileText, Wallet, User, Phone, Mail, ExternalLink } from"lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from"@/components/ui/card"
import { Badge } from"@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from"@/components/ui/tabs"
import { useToast } from"@/hooks/use-toast"
import Link from"next/link"
import { format } from"date-fns"
import { id as localeId } from"date-fns/locale"
import confetti from"canvas-confetti"

export default function PpdbPendaftarDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data: session } = useSession()
  const { toast } = useToast()
  const [applicant, setApplicant] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectedFileUrl, setSelectedFileUrl] = useState<string | null>(null)

  const fetchDetail = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/ppdb/pendaftar/${id}`)
      const data = await res.json()
      setApplicant(data)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDetail()
  }, [id])

  const handleUpdateStatus = async (newStatus: string) => {
    try {
      const res = await fetch(`/api/ppdb/pendaftar/${id}`, {
        method:"PATCH",
        headers: {"Content-Type":"application/json" },
        body: JSON.stringify({ status: newStatus }),
      })

      if (res.ok) {
        toast({ title:"Berhasil", description: `Status diupdate menjadi ${newStatus}` })
        if (newStatus ==="DITERIMA") {
           confetti({
             particleCount: 150,
             spread: 70,
             origin: { y: 0.6 }
           })
        }
        fetchDetail()
      }
    } catch (error) {
      console.error(error)
    }
  }

  const handleSync = async () => {
    try {
      const res = await fetch(`/api/ppdb/pendaftar/${id}/sync`, { method:"POST" })
      const data = await res.json()
      if (res.ok) {
        toast({ title:"Berhasil", description: data.message ||"Data berhasil disinkronisasi." })
        fetchDetail()
      } else {
        toast({ title:"Gagal", description: data.error ||"Gagal sinkronisasi", variant:"destructive" })
      }
    } catch (error) {
      toast({ title:"Error", description:"Terjadi kesalahan sistem", variant:"destructive" })
    }
  }

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>
  if (!applicant) return <div>Data tidak ditemukan.</div>

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/admin/ppdb/pendaftar">
            <Button variant="ghost" size="icon" className="rounded-xl">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
               <h1 className="text-2xl font-bold tracking-tight">{applicant.namaLengkap}</h1>
               <Badge className={
                 applicant.status ==="DITERIMA" ?"bg-emerald-500/10 text-emerald-600 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.3)]" :
                 applicant.status ==="DITOLAK" ?"bg-red-500/10 text-red-600 border-red-500/20" :"bg-amber-500/10 text-amber-600 border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.2)] animate-pulse"
               }>
                 {applicant.status}
               </Badge>
            </div>
            <p className="text-muted-foreground text-sm">No. Pendaftaran: <span className="font-mono">{applicant.noPendaftaran}</span> • Terdaftar pada {format(new Date(applicant.createdAt),"d MMMM yyyy", { locale: localeId })}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
           {applicant.status ==="DITERIMA" && (
             <Button className="rounded-xl bg-primary hover:bg-blue-700 text-white border-0" onClick={handleSync}>
               <CheckCircle className="mr-2 h-4 w-4" /> Sinkronisasi ke Siswa
             </Button>
           )}
           {applicant.status !=="DITERIMA" && applicant.status !=="SINKRONISASI" && (
             <Button className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white border-0" onClick={() => handleUpdateStatus("DITERIMA")}>
               <CheckCircle className="mr-2 h-4 w-4" /> Terima Siswa
             </Button>
           )}
           {applicant.status !=="DITOLAK" && applicant.status !=="SINKRONISASI" && (
             <Button variant="outline" className="rounded-xl text-red-600 border-red-200 hover:bg-red-50" onClick={() => handleUpdateStatus("DITOLAK")}>
               <XCircle className="mr-2 h-4 w-4" /> Tolak
             </Button>
           )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Tabs defaultValue="formulir" className="w-full">
            <TabsList className="glass border-0 p-1 rounded-xl w-full justify-start mb-4">
              <TabsTrigger value="formulir" className="rounded-lg px-6">Formulir</TabsTrigger>
              <TabsTrigger value="berkas" className="rounded-lg px-6">Berkas ({applicant.berkas?.length || 0})</TabsTrigger>
              <TabsTrigger value="pembayaran" className="rounded-lg px-6">Pembayaran</TabsTrigger>
            </TabsList>

            <TabsContent value="formulir">
               <Card className="glass border-0 shadow-sm">
                 <CardHeader>
                   <CardTitle className="text-base font-semibold">Data Calon Siswa</CardTitle>
                 </CardHeader>
                 <CardContent className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-x-8 gap-y-4">
                       <DataRow label="Nama Lengkap" value={applicant.namaLengkap} />
                       <DataRow label="Nomor Pendaftaran" value={applicant.noPendaftaran} />
                       <DataRow label="Gelombang" value={applicant.periode?.nama} />
                       <DataRow label="Email Terdaftar" value={applicant.user?.email} />
                    </div>
                    
                    <div className="pt-6 border-t border-border/50">
                       <h4 className="text-sm font-bold mb-4">Data Tambahan (Formulir)</h4>
                       {applicant.dataFormulir ? (
                         <div className="grid md:grid-cols-2 gap-4">
                            {Object.entries(applicant.dataFormulir).map(([key, val]: any) => (
                              <DataRow key={key} label={key.replace(/([A-Z])/g, ' $1').replace(/^./, (str: string) => str.toUpperCase())} value={val} />
                            ))}
                         </div>
                       ) : (
                         <div className="py-10 text-center border-2 border-dashed rounded-2xl text-muted-foreground text-xs">
                           Pendaftar belum mengisi formulir lengkap.
                         </div>
                       )}
                    </div>
                 </CardContent>
               </Card>
            </TabsContent>

            <TabsContent value="berkas">
               <div className="flex flex-col xl:flex-row gap-6">
                 {/* Daftar Berkas */}
                 <div className={`space-y-4 ${selectedFileUrl ? 'w-full xl:w-1/3' : 'w-full grid gap-4 sm:grid-cols-2'}`}>
                    {applicant.berkas?.length > 0 ? (
                      applicant.berkas.map((file: any) => (
                        <Card 
                          key={file.id} 
                          className={`glass border-0 shadow-sm overflow-hidden group cursor-pointer transition-all ${selectedFileUrl === file.fileUrl ? 'ring-2 ring-primary bg-primary/5' : 'hover:bg-white/50 dark:hover:bg-white/5'}`}
                          onClick={() => setSelectedFileUrl(file.fileUrl)}
                        >
                           <div className="p-4 flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                 <div className="h-10 w-10 rounded-xl bg-primary/5 flex items-center justify-center">
                                    <FileText className="h-5 w-5 text-primary" />
                                 </div>
                                 <div>
                                    <p className="text-sm font-semibold line-clamp-1">{file.requirement?.nama}</p>
                                    <Badge variant="outline" className="text-[9px] uppercase tracking-widest mt-1">
                                      {file.status}
                                    </Badge>
                                 </div>
                              </div>
                              <a href={file.fileUrl} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
                                 <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <ExternalLink className="h-4 w-4" />
                                 </Button>
                              </a>
                           </div>
                        </Card>
                      ))
                    ) : (
                      <div className="col-span-full py-20 text-center border-2 border-dashed rounded-3xl text-muted-foreground">
                         Belum ada berkas yang diunggah.
                      </div>
                    )}
                 </div>

                 {/* Viewer PDF / Gambar Inline */}
                 {selectedFileUrl && (
                   <div className="w-full xl:w-2/3 h-[600px] border rounded-2xl overflow-hidden bg-slate-50 dark:bg-slate-900 relative group">
                      <Button 
                         variant="secondary" 
                         size="icon" 
                         className="absolute top-4 right-4 z-10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                         onClick={() => setSelectedFileUrl(null)}
                      >
                         <XCircle className="h-5 w-5" />
                      </Button>
                      <iframe src={selectedFileUrl} className="w-full h-full border-0" title="Document Viewer" />
                   </div>
                 )}
               </div>
            </TabsContent>

            <TabsContent value="pembayaran">
               <div className="space-y-4">
                  {applicant.tagihan?.length > 0 ? applicant.tagihan.map((t: any) => {
                    const isDaftarUlang = t.jenis ==="DAFTAR_ULANG"
                    const items: { nama: string; nominal: number }[] = t.items ?? []
                    return (
                      <Card key={t.id} className="glass border-0 shadow-sm overflow-hidden">
                         <CardHeader className="flex flex-row items-center justify-between pb-2 bg-muted/30">
                            <div className="flex items-center gap-2">
                               <Wallet className={`h-4 w-4 ${isDaftarUlang ?"text-emerald-500" :"text-primary"}`} />
                               <CardTitle className="text-sm font-bold uppercase tracking-wider">
                                 {isDaftarUlang ?"Daftar Ulang" :"Biaya Pendaftaran"}
                               </CardTitle>
                            </div>
                            <Badge className={t.status ==="LUNAS" ?"bg-emerald-500/10 text-emerald-600 border-emerald-500/20" :"bg-red-500/10 text-red-600 border-red-500/20"}>
                               {t.status}
                            </Badge>
                         </CardHeader>
                         <CardContent className="pt-4 space-y-4">
                            {/* Item breakdown for daftar ulang */}
                            {isDaftarUlang && items.length > 0 && (
                              <div className="rounded-xl border overflow-hidden">
                                 <div className="divide-y divide-border/50">
                                   {items.map((item, i) => (
                                     <div key={i} className="flex justify-between px-4 py-2.5 text-xs">
                                       <span className="text-muted-foreground">{item.nama}</span>
                                       <span className="font-semibold">Rp {item.nominal.toLocaleString("id-ID")}</span>
                                     </div>
                                   ))}
                                 </div>
                                 <div className="flex justify-between px-4 py-3 bg-muted/40 border-t font-bold text-sm">
                                   <span>Total</span>
                                   <span className="text-primary">Rp {t.nominal.toLocaleString("id-ID")}</span>
                                 </div>
                              </div>
                            )}

                            {/* Non-breakdown nominal */}
                            {!isDaftarUlang && (
                              <div className="flex items-center justify-between">
                                 <span className="text-muted-foreground text-sm">Nominal Tagihan</span>
                                 <span className="text-lg font-bold">Rp {t.nominal.toLocaleString()}</span>
                              </div>
                            )}

                            <div className="space-y-2">
                               <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Riwayat Transaksi</p>
                               {t.pembayaran?.length > 0 ? (
                                 t.pembayaran.map((p: any) => (
                                   <div key={p.id} className="flex items-center justify-between p-3 rounded-xl bg-accent/30 border border-border/50 text-xs">
                                      <div className="flex items-center gap-3">
                                         <Wallet className="h-4 w-4 text-primary shrink-0" />
                                         <div>
                                            <p className="font-semibold">Rp {p.nominal.toLocaleString()}</p>
                                            <p className="text-[10px] text-muted-foreground">{format(new Date(p.createdAt),"d MMM yyyy HH:mm")}</p>
                                         </div>
                                      </div>
                                      <Badge variant="outline" className={cn("text-[10px]",
                                        p.status ==="SUCCESS" ?"text-emerald-600 border-emerald-500/30" :
                                        p.status ==="PENDING" ?"text-amber-600 border-amber-500/30" :""
                                      )}>{p.status}</Badge>
                                   </div>
                                 ))
                               ) : (
                                 <div className="text-center py-6 text-muted-foreground text-[11px] border-2 border-dashed rounded-xl">Belum ada konfirmasi pembayaran.</div>
                               )}
                            </div>
                         </CardContent>
                      </Card>
                    )
                  }) : (
                    <div className="text-center py-20 border-2 border-dashed rounded-2xl text-muted-foreground text-sm">
                      Belum ada tagihan tercatat.
                    </div>
                  )}
               </div>
            </TabsContent>

          </Tabs>
        </div>

        <div className="space-y-6">
           <Card className="glass border-0 shadow-sm">
              <CardHeader>
                 <CardTitle className="text-base font-semibold">Kontak Pendaftar</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                 <ContactItem icon={Mail} value={applicant.user?.email} label="Email" />
                 <ContactItem icon={Phone} value={applicant.user?.phone ||"-"} label="Telepon" />
                 <ContactItem icon={User} value={applicant.namaLengkap} label="Nama Akun" />
              </CardContent>
           </Card>

           <Card className="glass border-0 shadow-sm p-6 bg-gradient-to-br from-primary/10 to-transparent">
              <h3 className="text-sm font-bold mb-1">Catatan Verifikasi</h3>
              <p className="text-[11px] text-muted-foreground mb-4">Pastikan data dan berkas sudah sesuai sebelum mengubah status pendaftaran.</p>
              <div className="space-y-2">
                 <Button variant="outline" className="w-full rounded-xl glass border-0 text-xs h-9 justify-start" onClick={() => handleUpdateStatus("TERVERIFIKASI")}>
                   <CheckCircle className="mr-2 h-3.5 w-3.5 text-blue-500" /> Tandai Terverifikasi
                 </Button>
              </div>
           </Card>
        </div>
      </div>
    </div>
  )
}

function DataRow({ label, value }: { label: string, value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">{label}</p>
      <p className="text-sm font-medium">{value ||"-"}</p>
    </div>
  )
}

function ContactItem({ icon: Icon, label, value }: { icon: any, label: string, value: string }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/50 transition-colors">
       <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="h-4 w-4 text-primary" />
       </div>
       <div>
          <p className="text-[10px] text-muted-foreground font-medium leading-none mb-1">{label}</p>
          <p className="text-sm font-semibold leading-none">{value}</p>
       </div>
    </div>
  )
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join("")
}
