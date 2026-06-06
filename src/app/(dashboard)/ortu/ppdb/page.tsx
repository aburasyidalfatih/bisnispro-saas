"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { UserPlus, ArrowRight, ArrowLeft, Wallet, ClipboardList, CheckCircle, FileText } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { format } from "date-fns"
import { id as localeId } from "date-fns/locale"
import { derivePpdbStatus } from "@/features/ppdb/lib/ppdb-workflow"

export default function PpdbPortalPage() {
  const { data: session } = useSession()
  const [registrations, setRegistrations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!session?.user?.id) return
    fetch(`/api/ppdb/pendaftar/user`) // I need to create this API
      .then((r) => r.json())
      .then(setRegistrations)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [session])

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>

  return (
    <div className="pb-10 font-sans">
      {/* Top Header Mobile Style */}
      <div className="bg-primary rounded-b-[2.5rem] pt-6 pb-24 px-6 relative z-0">
        <div className="flex items-center justify-between text-primary-foreground mb-4">
          <div className="flex items-center gap-3">
            <Link href="/ortu" className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
               <ArrowLeft className="h-4 w-4" />
            </Link>
            <h1 className="font-bold text-lg">Portal PPDB</h1>
          </div>
        </div>
        <p className="text-primary-foreground/80 text-sm">Kelola pendaftaran siswa baru Anda secara online.</p>
      </div>

      <div className="-mt-14 relative z-10 px-5 space-y-5">
        <Link href="/ortu/ppdb/daftar" className="block w-full">
          <Button className="w-full rounded-xl btn-gradient text-white shadow-lg shadow-primary/20 border-0 h-12 text-sm font-bold flex items-center justify-center gap-2">
            <UserPlus className="h-4 w-4" /> Mulai Pendaftaran Baru
          </Button>
        </Link>

        <div className="grid gap-5">
        {registrations.length > 0 ? (
          registrations.map((reg) => {
            const workflow = derivePpdbStatus(reg)
            return (
              <Card key={reg.id} className="glass border-0 shadow-xl shadow-primary/5 overflow-hidden group transition-all hover:-translate-y-1 hover:shadow-2xl hover:shadow-primary/10">
                <div className="p-6 md:p-8">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                    <div className="flex gap-5 items-center">
                       <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary border border-primary/10 shadow-inner">
                          <UserPlus className="h-8 w-8" />
                       </div>
                       <div>
                          <h3 className="text-2xl font-black text-foreground">{reg.namaLengkap}</h3>
                          <div className="flex flex-wrap items-center gap-2 mt-1.5">
                             <Badge variant="outline" className="text-[10px] font-mono font-bold bg-white/50 dark:bg-black/50 border-primary/20 text-primary">{reg.noPendaftaran}</Badge>
                             <span className="text-xs font-medium text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">{reg.periode?.nama}</span>
                          </div>
                       </div>
                    </div>
                    
                    <div className="flex flex-col md:items-end gap-3">
                       <div className="flex items-center gap-2 bg-primary/5 px-3 py-1.5 rounded-xl border border-primary/10">
                          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status Saat Ini:</span>
                          <span className="text-xs font-bold text-primary">{workflow.label}</span>
                       </div>
                       <Link href={`/ortu/ppdb/status/${reg.id}`} className="w-full md:w-auto">
                          <Button className="rounded-xl btn-gradient text-white shadow-lg shadow-primary/20 border-0 font-bold w-full h-11 flex items-center justify-center">
                            Lanjutkan Proses <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                       </Link>
                    </div>
                  </div>

                  <div className="mt-8 pt-8 border-t border-border/60 relative">
                     {/* Connecting Line background */}
                     <div className="absolute top-[52px] left-[10%] right-[10%] h-[2px] bg-muted dark:bg-slate-800 -z-10" />
                     {/* Connecting Line foreground */}
                     <div 
                        className="absolute top-[52px] left-[10%] h-[2px] bg-emerald-500 transition-all duration-700 ease-in-out -z-10" 
                        style={{ width: `${Math.min(100, Math.max(0, ((workflow.stepNumber - 1) / 3) * 80))}%` }} 
                     />
                     
                     <div className="flex items-start justify-between w-full">
                        <WorkflowStep 
                          step={1} 
                          label="Registrasi" 
                          done={true} 
                          active={false} 
                        />
                        <WorkflowStep 
                          step={2} 
                          label="Pembayaran" 
                          done={workflow.stepNumber > 3} 
                          active={workflow.stepNumber === 2 || workflow.stepNumber === 3} 
                        />
                        <WorkflowStep 
                          step={3} 
                          label="Formulir" 
                          done={workflow.stepNumber > 4} 
                          active={workflow.stepNumber === 4} 
                        />
                        <WorkflowStep 
                          step={4} 
                          label="Selesai" 
                          done={reg.status === "DITERIMA" || reg.status === "SINKRONISASI"} 
                          active={workflow.stepNumber > 7 && reg.status !== "DITERIMA" && reg.status !== "SINKRONISASI"} 
                        />
                     </div>
                  </div>
                </div>
              </Card>
            )
          })
        ) : (
          <Card className="glass border-dashed border-2 bg-transparent py-20">
             <CardContent className="flex flex-col items-center justify-center text-center">
                <div className="h-20 w-20 rounded-full bg-primary/5 flex items-center justify-center mb-4">
                   <ClipboardList className="h-10 w-10 text-primary opacity-20" />
                </div>
                <h3 className="text-lg font-bold">Belum Ada Pendaftaran</h3>
                <p className="text-muted-foreground text-sm max-w-sm mt-2 mb-8">Anda belum memiliki riwayat pendaftaran siswa baru. Silakan klik tombol di bawah untuk mulai mendaftar.</p>
                <Link href="/ortu/ppdb/daftar">
                   <Button className="rounded-xl btn-gradient text-white shadow-xl border-0 h-12 px-8 flex items-center justify-center">
                     Mulai Daftar Sekarang
                   </Button>
                </Link>
             </CardContent>
          </Card>
        )}
        </div>
      </div>
    </div>
  )
}

function WorkflowStep({ step, label, done, active }: { step: number, label: string, done: boolean, active: boolean }) {
  return (
    <div className="flex flex-col items-center gap-3 bg-card/80 dark:bg-slate-900/80 px-2 rounded-xl">
       <div className={cn(
         "h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold border-[3px] transition-all duration-500",
         done ? "bg-emerald-500 border-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]" : 
         active ? "bg-background border-primary text-primary shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)] scale-110" : 
         "bg-muted/50 border-muted text-muted-foreground"
       )}>
          {done ? <CheckCircle className="h-5 w-5" /> : step}
       </div>
       <span className={cn(
         "text-[10px] md:text-xs font-bold text-center tracking-wide", 
         done ? "text-emerald-600 dark:text-emerald-400" : 
         active ? "text-primary" : 
         "text-muted-foreground"
       )}>
         {label}
       </span>
    </div>
  )
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(" ")
}
