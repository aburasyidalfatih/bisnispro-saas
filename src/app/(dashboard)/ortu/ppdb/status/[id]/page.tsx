"use client"

import { useEffect, useState, use } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { 
  ArrowLeft, CheckCircle, XCircle, Wallet, ClipboardList, 
  FileText, UserCheck, AlertCircle, Clock, Calendar,
  ArrowRight, UploadCloud, Megaphone 
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { format } from "date-fns"
import { id as localeId } from "date-fns/locale"
import { derivePpdbStatus, PpdbStatus } from "@/features/ppdb/lib/ppdb-workflow"
import confetti from "canvas-confetti"

export default function PpdbStatusPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data: session } = useSession()
  const { toast } = useToast()
  const [applicant, setApplicant] = useState<any>(null)
  const [loading, setLoading] = useState(true)

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

  useEffect(() => {
    if (applicant?.status === "DITERIMA" || applicant?.status === "SINKRONISASI") {
       confetti({
         particleCount: 200,
         spread: 90,
         origin: { y: 0.6 }
       })
    }
  }, [applicant?.status])

  const handleFinalize = async () => {
    try {
      const res = await fetch(`/api/ppdb/pendaftar/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dataFormulir: { ...applicant.dataFormulir, isFinalized: true }
        })
      });
      if (res.ok) {
        toast({ title: "Data Terkirim!", description: "Data Anda berhasil difinalisasi." });
        fetchDetail();
      }
    } catch (error) {
      toast({ title: "Gagal", variant: "destructive" });
    }
  }

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>
  if (!applicant) return <div className="text-center py-20">Data tidak ditemukan.</div>

  const workflow = derivePpdbStatus(applicant)

  return (
    <div className="pb-10 font-sans">
      {/* Top Header Mobile Style */}
      <div className="bg-primary rounded-b-[2.5rem] pt-6 pb-24 px-6 relative z-0">
        <div className="flex items-center justify-between text-primary-foreground mb-4">
          <div className="flex items-center gap-3">
            <Link href="/ortu/ppdb" className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm shrink-0">
               <ArrowLeft className="h-4 w-4" />
            </Link>
            <h1 className="font-bold text-lg max-w-[200px] truncate">{applicant.namaLengkap}</h1>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-primary-foreground/80 text-sm">Status: <span className="font-bold text-white">{workflow.label}</span></p>
          <Badge variant="outline" className="px-2 py-0.5 rounded-full border-white/20 text-white bg-white/10 font-mono text-[10px]">
             {applicant.noPendaftaran}
          </Badge>
        </div>
      </div>

      <div className="-mt-14 relative z-10 px-5 space-y-6">
        <div className="grid gap-6 lg:grid-cols-3">
        {/* Progress Stepper (Left) */}
        <div className="lg:col-span-1">
           <Card className="glass border-0 shadow-sm p-6 sticky top-24">
              <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-6">Alur Pendaftaran</h3>
              <div className="space-y-6 relative">
                 <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-muted" />
                 
                 <StepItem 
                   number={1} 
                   label="Registrasi Berhasil" 
                   active={workflow.stepNumber >= 1} 
                   done={workflow.stepNumber > 1} 
                 />
                 <StepItem 
                   number={2} 
                   label="Pembayaran Pendaftaran" 
                   active={workflow.stepNumber >= 2} 
                   done={workflow.stepNumber > 3} 
                 />
                 <StepItem 
                   number={3} 
                   label="Pengisian Formulir" 
                   active={workflow.stepNumber >= 4} 
                   done={workflow.stepNumber > 4} 
                 />
                 <StepItem 
                   number={4} 
                   label="Upload Berkas" 
                   active={workflow.stepNumber >= 5} 
                   done={workflow.stepNumber > 5} 
                 />
                 <StepItem 
                   number={5} 
                   label="Verifikasi Data" 
                   active={workflow.stepNumber >= 6} 
                   done={workflow.stepNumber > 7} 
                 />
                 <StepItem 
                   number={6} 
                   label="Pengumuman" 
                   active={workflow.stepNumber >= 8} 
                   done={applicant.status === "DITERIMA"} 
                 />
                 <StepItem 
                   number={7} 
                   label="Daftar Ulang" 
                   active={workflow.stepNumber >= 9} 
                   done={applicant.isSynced} 
                 />
              </div>
           </Card>
        </div>

        {/* Action Center (Center/Right) */}
        <div className="lg:col-span-2 space-y-6">
           <Card className="glass border-0 shadow-xl overflow-hidden bg-gradient-to-br from-primary/5 via-transparent to-transparent">
              <CardContent className="p-8">
                 <WorkflowAction workflow={workflow} applicant={applicant} handleFinalize={handleFinalize} />
              </CardContent>
           </Card>

           {/* Quick Summary Card */}
           <div className="grid sm:grid-cols-2 gap-4">
              <Card className="glass border-0 p-5 flex items-center gap-4">
                 <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600">
                    <Calendar className="h-5 w-5" />
                 </div>
                 <div>
                    <p className="text-[10px] uppercase font-bold text-muted-foreground">Gelombang</p>
                    <p className="text-sm font-bold">{applicant.periode?.nama}</p>
                 </div>
              </Card>
              <Card className="glass border-0 p-5 flex items-center gap-4">
                 <div className="h-10 w-10 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-600">
                    <Wallet className="h-5 w-5" />
                 </div>
                 <div>
                    <p className="text-[10px] uppercase font-bold text-muted-foreground">Tagihan Aktif</p>
                    <p className="text-sm font-bold">Rp {applicant.tagihan?.find((t: any) => t.status === "BELUM_LUNAS")?.nominal.toLocaleString() || "0"}</p>
                 </div>
              </Card>
           </div>
        </div>
      </div>
      </div>
    </div>
  )
}

function StepItem({ number, label, active, done }: { number: number, label: string, active: boolean, done: boolean }) {
  return (
    <div className="flex items-center gap-4 relative z-10">
       <div className={cn(
         "h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition-all duration-300",
         done ? "bg-emerald-500 border-emerald-500 text-white" : 
         active ? "bg-white dark:bg-slate-900 border-primary text-primary shadow-[0_0_10px_rgba(var(--primary-rgb),0.3)]" : 
         "bg-white dark:bg-slate-900 border-muted text-muted-foreground"
       )}>
          {done ? <CheckCircle className="h-3 w-3" /> : number}
       </div>
       <span className={cn(
         "text-xs font-semibold transition-colors duration-300",
         active || done ? "text-foreground" : "text-muted-foreground"
       )}>
         {label}
       </span>
    </div>
  )
}

function WorkflowAction({ workflow, applicant, handleFinalize }: { workflow: any, applicant: any, handleFinalize: () => void }) {
  const status = workflow.currentStatus as PpdbStatus

  switch (status) {
    case "MENUNGGU_PEMBAYARAN_PENDAFTARAN":
      return (
        <div className="space-y-6 text-center py-4">
           <div className="h-20 w-20 rounded-[2rem] bg-amber-500/10 flex items-center justify-center mx-auto text-amber-600">
              <Wallet className="h-10 w-10" />
           </div>
           <div className="space-y-2">
              <h2 className="text-2xl font-extrabold">Menunggu Pembayaran</h2>
              <p className="text-muted-foreground max-w-sm mx-auto">Silakan lakukan pembayaran biaya pendaftaran untuk mengaktifkan formulir lengkap Anda.</p>
           </div>
           <div className="p-6 rounded-3xl bg-amber-500/5 border border-amber-500/10 space-y-4">
              <div className="flex justify-between text-sm">
                 <span className="text-muted-foreground">Total Bayar:</span>
                 <span className="font-bold text-lg">Rp {applicant.tagihan?.[0]?.nominal.toLocaleString()}</span>
              </div>
              <Button className="w-full h-12 rounded-xl btn-gradient text-white border-0 font-bold flex items-center justify-center" asChild>
                 <Link href={`/ortu/ppdb/pembayaran/${applicant.tagihan?.[0]?.id}`}>Bayar Sekarang</Link>
              </Button>
           </div>
        </div>
      )
    
    case "VERIFIKASI_PEMBAYARAN_PENDAFTARAN":
      return (
        <div className="space-y-6 text-center py-4">
           <div className="h-20 w-20 rounded-[2rem] bg-blue-500/10 flex items-center justify-center mx-auto text-blue-600 animate-pulse">
              <Clock className="h-10 w-10" />
           </div>
           <div className="space-y-2">
              <h2 className="text-2xl font-extrabold">Sedang Diverifikasi</h2>
              <p className="text-muted-foreground max-w-sm mx-auto">Bukti pembayaran Anda sudah kami terima dan sedang dalam proses pengecekan oleh bendahara sekolah.</p>
           </div>
           <p className="text-xs text-muted-foreground italic">Pengecekan biasanya memakan waktu 1-24 jam kerja.</p>
        </div>
      )

    case "PENGISIAN_FORMULIR":
      return (
        <div className="space-y-6 text-center py-4">
           <div className="h-20 w-20 rounded-[2rem] bg-emerald-500/10 flex items-center justify-center mx-auto text-emerald-600">
              <ClipboardList className="h-10 w-10" />
           </div>
           <div className="space-y-2">
              <h2 className="text-2xl font-extrabold">Isi Formulir Lengkap</h2>
              <p className="text-muted-foreground max-w-sm mx-auto">Pembayaran lunas! Sekarang silakan lengkapi data profil, orang tua, dan asal sekolah Anda.</p>
           </div>
           <Button className="w-full h-14 rounded-2xl btn-gradient text-white border-0 font-bold text-lg flex items-center justify-center" asChild>
              <Link href={`/ortu/ppdb/formulir/${applicant.id}`}>Mulai Isi Formulir <ArrowRight className="ml-2 h-5 w-5" /></Link>
           </Button>
        </div>
      )

    case "UPLOAD_BERKAS":
      return (
        <div className="space-y-6 text-center py-4">
           <div className="h-20 w-20 rounded-[2rem] bg-violet-500/10 flex items-center justify-center mx-auto text-violet-600">
              <UploadCloud className="h-10 w-10" />
           </div>
           <div className="space-y-2">
              <h2 className="text-2xl font-extrabold">Unggah Berkas</h2>
              <p className="text-muted-foreground max-w-sm mx-auto">Data formulir sudah disimpan. Tahap terakhir adalah mengunggah dokumen persyaratan yang diminta.</p>
           </div>
           <Button className="w-full h-14 rounded-2xl btn-gradient text-white border-0 font-bold text-lg flex items-center justify-center" asChild>
              <Link href={`/ortu/ppdb/berkas/${applicant.id}`}>Unggah Dokumen <ArrowRight className="ml-2 h-5 w-5" /></Link>
           </Button>
        </div>
      )

    case "FINALISASI":
      return (
        <div className="space-y-6 text-center py-4">
           <div className="h-20 w-20 rounded-[2rem] bg-emerald-500/10 flex items-center justify-center mx-auto text-emerald-600">
              <CheckCircle className="h-10 w-10" />
           </div>
           <div className="space-y-2">
              <h2 className="text-2xl font-extrabold">Finalisasi Data</h2>
              <p className="text-muted-foreground max-w-sm mx-auto">Semua berkas dan formulir telah lengkap. Pastikan data Anda sudah benar sebelum dikirimkan ke panitia, karena data tidak bisa diubah lagi.</p>
           </div>
           <Button onClick={handleFinalize} className="w-full h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white border-0 font-bold text-lg shadow-lg shadow-emerald-500/20">
              Kirim Data Sekarang <ArrowRight className="ml-2 h-5 w-5" />
           </Button>
        </div>
      )

    case "VERIFIKASI_BERKAS":
      return (
        <div className="space-y-6 text-center py-4">
           <div className="h-20 w-20 rounded-[2rem] bg-blue-500/10 flex items-center justify-center mx-auto text-blue-600">
              <FileText className="h-10 w-10" />
           </div>
           <div className="space-y-2">
              <h2 className="text-2xl font-extrabold">Data Sedang Diulas</h2>
              <p className="text-muted-foreground max-w-sm mx-auto">Seluruh data dan berkas Anda telah masuk ke meja panitia PPDB. Mohon tunggu proses validasi dokumen.</p>
           </div>
           <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10 flex gap-3 items-center text-left">
              <AlertCircle className="h-5 w-5 text-blue-600 shrink-0" />
              <p className="text-[11px] text-muted-foreground leading-tight">Kami akan mengirimkan notifikasi jika ada berkas yang kurang jelas atau perlu diunggah ulang.</p>
           </div>
        </div>
      )

    case "PENGUMUMAN":
      return (
        <div className="space-y-6 text-center py-4">
           <div className="h-20 w-20 rounded-[2rem] bg-indigo-500/10 flex items-center justify-center mx-auto text-indigo-600">
              <Megaphone className="h-10 w-10" />
           </div>
           <div className="space-y-2">
              <h2 className="text-2xl font-extrabold">Menunggu Pengumuman</h2>
              <p className="text-muted-foreground max-w-sm mx-auto">Selamat! Data Anda telah terverifikasi. Saat ini Anda sedang dalam tahap seleksi. Pengumuman akan muncul di halaman ini.</p>
           </div>
           <div className="py-2 px-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold inline-block mx-auto">Hasil seleksi segera hadir</div>
        </div>
      )

    case "TAGIHAN_DAFTAR_ULANG":
    case "BAYAR_DAFTAR_ULANG":
    case "VERIFIKASI_DAFTAR_ULANG": {
      const tagihanDU = applicant.tagihan?.find((t: any) => t.jenis === "DAFTAR_ULANG")
      const items: { nama: string; nominal: number }[] = tagihanDU?.items ?? []
      const hasPendingPayment = tagihanDU?.pembayaran?.some((p: any) => p.status === "PENDING")
      return (
        <div className="space-y-6 py-2">
           <div className="text-center space-y-3">
              <div className="h-20 w-20 rounded-[2rem] bg-emerald-500/10 flex items-center justify-center mx-auto text-emerald-600">
                 <UserCheck className="h-10 w-10" />
              </div>
              <div className="space-y-1">
                 <h2 className="text-2xl font-extrabold text-emerald-600">Selamat! Anda Diterima 🎉</h2>
                 <p className="text-muted-foreground text-sm max-w-sm mx-auto">Anda dinyatakan lulus seleksi. Selesaikan pembayaran daftar ulang untuk mengonfirmasi kehadiran Anda.</p>
              </div>
           </div>

           {tagihanDU ? (
             <div className="rounded-2xl border overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 bg-emerald-50 dark:bg-emerald-950/30 border-b">
                   <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Tagihan Daftar Ulang</p>
                      <p className="text-sm font-semibold mt-0.5">Rincian Pembayaran</p>
                   </div>
                   <Badge className={tagihanDU.status === "LUNAS" ? "bg-emerald-500 text-white" : "bg-amber-500 text-white"}>
                      {tagihanDU.status}
                   </Badge>
                </div>

                {/* Items breakdown */}
                <div className="divide-y divide-border/50">
                   {items.map((item, i) => (
                     <div key={i} className="flex justify-between items-center px-5 py-3">
                        <span className="text-sm">{item.nama}</span>
                        <span className="font-semibold text-sm">Rp {item.nominal.toLocaleString("id-ID")}</span>
                     </div>
                   ))}
                </div>

                {/* Total */}
                <div className="flex justify-between items-center px-5 py-4 bg-muted/40 border-t border-t-2 border-primary/20">
                   <span className="font-bold">Total Daftar Ulang</span>
                   <span className="text-xl font-extrabold text-primary">Rp {tagihanDU.nominal?.toLocaleString("id-ID")}</span>
                </div>

                {/* CTA */}
                {tagihanDU.status !== "LUNAS" && (
                  <div className="px-5 py-4 border-t">
                     {hasPendingPayment ? (
                       <div className="text-center py-2">
                          <p className="text-sm text-amber-600 font-semibold animate-pulse">⏳ Bukti pembayaran sedang diverifikasi...</p>
                          <p className="text-xs text-muted-foreground mt-1">Proses verifikasi 1-24 jam kerja.</p>
                       </div>
                     ) : (
                       <Button className="w-full h-12 rounded-xl btn-gradient text-white border-0 font-bold flex items-center justify-center" asChild>
                          <Link href={`/ortu/ppdb/pembayaran/${tagihanDU.id}`}>
                             Bayar Daftar Ulang
                          </Link>
                       </Button>
                     )}
                  </div>
                )}
             </div>
           ) : (
             <div className="p-4 rounded-2xl border-2 border-dashed border-emerald-500/20 text-center">
                <p className="text-sm font-medium text-muted-foreground">Tagihan daftar ulang sedang disiapkan oleh panitia...</p>
             </div>
           )}
        </div>
      )
    }

    case "SINKRONISASI":
      return (
        <div className="space-y-6 text-center py-4">
           <div className="h-20 w-20 rounded-[2rem] bg-emerald-500 flex items-center justify-center mx-auto text-white shadow-xl shadow-emerald-500/30">
              <CheckCircle className="h-10 w-10" />
           </div>
           <div className="space-y-2">
              <h2 className="text-2xl font-extrabold">Pendaftaran Selesai</h2>
              <p className="text-muted-foreground max-w-sm mx-auto">Selamat bergabung di keluarga besar kami! Anda sudah resmi menjadi siswa. Data Anda telah disinkronkan ke sistem akademik.</p>
           </div>
           <div className="flex flex-col items-center gap-2">
              <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">NIS: {applicant.student?.nis || "Sedang Dibuat"}</Badge>
              <Button variant="outline" className="rounded-xl mt-4" asChild>
                 <Link href="/ortu/student">Buka Portal Siswa</Link>
              </Button>
           </div>
        </div>
      )

    case "DITOLAK":
      return (
        <div className="space-y-6 text-center py-4">
           <div className="h-20 w-20 rounded-[2rem] bg-red-500/10 flex items-center justify-center mx-auto text-red-600">
              <XCircle className="h-10 w-10" />
           </div>
           <div className="space-y-2">
              <h2 className="text-2xl font-extrabold text-red-600">Mohon Maaf</h2>
              <p className="text-muted-foreground max-w-sm mx-auto">Berdasarkan hasil seleksi panitia, pendaftaran Anda belum dapat kami terima untuk saat ini.</p>
           </div>
           <p className="text-xs text-muted-foreground">Terima kasih telah berpartisipasi dalam PPDB kami.</p>
        </div>
      )

    default:
      return <div>Status tidak dikenal.</div>
  }
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(" ")
}
