"use client"

import { useEffect, useState, use } from "react"
import { Button } from "@/components/ui/button"
import { Calendar, CheckCircle, ArrowRight, ClipboardList, Wallet, FileText, UserPlus } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { format } from "date-fns"
import { id as localeId } from "date-fns/locale"
import Link from "next/link"
import { useRouting } from "@/components/providers/routing-provider"

export const revalidate = 60;


export default function PublicPpdbPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const { resolveHref } = useRouting()

  useEffect(() => {
    fetch(`/api/public/ppdb/${slug}`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [slug])

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>

  const activePeriode = data?.activePeriode

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pt-20 pb-20">
      <div className="max-w-6xl mx-auto px-4">
        {/* Hero Section */}
        <div className="text-center space-y-4 mb-16">
           <Badge className="bg-primary/10 text-primary border-primary/20 rounded-full px-4 py-1">PPDB Online {new Date().getFullYear()}</Badge>
           <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">Penerimaan Siswa Baru <br /><span className="text-primary">{data?.schoolName}</span></h1>
           <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Selamat datang di portal pendaftaran siswa baru. Kami mengundang putra-putri terbaik untuk bergabung dan tumbuh bersama kami.</p>
        </div>

        {activePeriode ? (
          <div className="grid lg:grid-cols-2 gap-12 items-center">
             <div className="space-y-8">
                <div className="space-y-4">
                   <h2 className="text-2xl font-bold">Gelombang Sedang Dibuka</h2>
                   <Card className="glass border-0 shadow-xl p-6 bg-gradient-to-br from-primary/5 to-transparent">
                      <h3 className="text-xl font-bold text-primary">{activePeriode.nama}</h3>
                      <div className="flex items-center gap-2 text-muted-foreground mt-2 text-sm">
                         <Calendar className="h-4 w-4" />
                         <span>Masa Pendaftaran: <b>{format(new Date(activePeriode.tanggalBuka), "d MMM yyyy", { locale: localeId })}</b> s/d <b>{format(new Date(activePeriode.tanggalTutup), "d MMM yyyy", { locale: localeId })}</b></span>
                      </div>
                      <div className="mt-6 flex items-center gap-4">
                         <div className="flex flex-col">
                            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Biaya Pendaftaran</span>
                            <span className="text-lg font-extrabold">Rp {activePeriode.pengaturan?.biayaPendaftaran?.toLocaleString() || "0"}</span>
                         </div>
                         <div className="h-10 w-px bg-border/50 mx-2" />
                         <div className="flex flex-col">
                            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Sisa Kuota</span>
                            <span className="text-lg font-extrabold">{activePeriode.pengaturan?.kuota || "∞"} Kursi</span>
                         </div>
                      </div>
                   </Card>
                </div>

                <div className="space-y-4">
                   <h3 className="text-lg font-bold">Alur Pendaftaran</h3>
                   <div className="space-y-3">
                      <StepItem icon={UserPlus} title="Registrasi Awal" desc="Buat akun dan pilih gelombang pendaftaran." />
                      <StepItem icon={Wallet} title="Bayar & Konfirmasi" desc="Lakukan pembayaran pendaftaran dan upload bukti." />
                      <StepItem icon={ClipboardList} title="Lengkapi Data" desc="Isi formulir lengkap dan unggah berkas persyaratan." />
                      <StepItem icon={CheckCircle} title="Hasil & Daftar Ulang" desc="Pantau pengumuman dan lakukan daftar ulang jika diterima." />
                   </div>
                </div>
             </div>

             <div className="lg:pl-10">
                <Card className="glass border-0 shadow-2xl p-8 bg-white dark:bg-white/5 rounded-[32px] border-t border-l border-white/20">
                   <h3 className="text-2xl font-bold mb-6 text-center">Daftar Sekarang</h3>
                   <div className="space-y-4">
                      <p className="text-sm text-center text-muted-foreground mb-8">Silakan login atau buat akun terlebih dahulu untuk melanjutkan proses pendaftaran.</p>
                      <Link href={`/login?callbackUrl=${resolveHref("/ppdb/daftar")}`}>
                         <Button className="w-full h-14 rounded-2xl btn-gradient text-white text-lg font-bold shadow-xl shadow-primary/20 group flex items-center justify-center">
                           Mulai Pendaftaran <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                         </Button>
                      </Link>
                      <div className="relative py-4 text-center">
                         <div className="absolute inset-x-0 top-1/2 h-px bg-border/50" />
                         <span className="relative bg-white dark:bg-[#0f172a] px-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Atau</span>
                      </div>
                      <Link href={resolveHref("/ppdb/cek-status")}>
                         <Button variant="outline" className="w-full h-14 rounded-2xl glass border-0 text-primary font-bold">
                           Cek Status Pendaftaran
                         </Button>
                      </Link>
                   </div>
                   <div className="mt-8 p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10 flex gap-3 items-start">
                      <FileText className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        Pastikan Anda menyiapkan scan <b>Ijazah, Akta Kelahiran, dan KK</b> dalam format PDF atau Gambar sebelum mengisi formulir lengkap.
                      </p>
                   </div>
                </Card>
             </div>
          </div>
        ) : (
          <Card className="glass border-0 shadow-xl p-12 text-center flex flex-col items-center">
             <Calendar className="h-16 w-16 text-muted-foreground mb-4 opacity-20" />
             <h2 className="text-2xl font-bold">Pendaftaran Belum Dibuka</h2>
             <p className="text-muted-foreground mt-2 max-w-md">Saat ini tidak ada gelombang pendaftaran yang aktif. Silakan hubungi bagian administrasi sekolah untuk informasi lebih lanjut.</p>
             <Button variant="outline" className="mt-8 rounded-xl" asChild>
                <Link href={resolveHref("/")}>Kembali ke Beranda</Link>
             </Button>
          </Card>
        )}
      </div>
    </div>
  )
}

function StepItem({ icon: Icon, title, desc }: any) {
  return (
    <div className="flex gap-4 p-4 rounded-2xl hover:bg-white/50 dark:hover:bg-white/5 transition-colors group">
       <div className="h-10 w-10 shrink-0 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
          <Icon className="h-5 w-5" />
       </div>
       <div>
          <h4 className="text-sm font-bold">{title}</h4>
          <p className="text-xs text-muted-foreground">{desc}</p>
       </div>
    </div>
  )
}

function Badge({ children, className }: any) {
  return <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium", className)}>{children}</span>
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(" ")
}
