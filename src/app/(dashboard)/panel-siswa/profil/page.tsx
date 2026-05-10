"use client"

import { useEffect, useState } from "react"
import { useSession, signOut } from "next-auth/react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { User, Mail, Phone, MapPin, ShieldCheck, LogOut, ChevronRight, Loader2 } from "lucide-react"

export default function ProfilSiswaPage() {
  const { data: session } = useSession()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProfil = async () => {
      try {
        const res = await fetch("/api/siswa/profil")
        if (res.ok) {
          setData(await res.json())
        }
      } catch (e) {
        console.error("Failed to load profile data", e)
      } finally {
        setLoading(false)
      }
    }
    fetchProfil()
  }, [])

  if (loading) {
    return <div className="h-screen w-full flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
  }

  return (
    <div className="space-y-6 pb-24">
      {/* Header Profile */}
      <div className="bg-primary rounded-3xl p-6 text-white shadow-lg shadow-primary/30 flex flex-col items-center text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full blur-xl -ml-5 -mb-5" />
        
        <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center border-4 border-white/50 backdrop-blur-sm mb-4 relative z-10 shadow-xl">
          <User className="w-12 h-12 text-white" />
        </div>
        <h2 className="font-black text-2xl relative z-10">{session?.user?.name || "Siswa Demo"}</h2>
        <p className="text-primary-foreground/80 font-medium relative z-10">{session?.user?.email}</p>
        
        <div className="mt-4 flex gap-2 relative z-10">
          <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold tracking-wider border border-white/30 backdrop-blur-sm shadow-sm">
            NISN: {data?.nisn || "00000000"}
          </span>
          <span className={`${data?.status === 'AKTIF' ? 'bg-emerald-500/80 border-emerald-400' : 'bg-red-500/80 border-red-400'} px-3 py-1 rounded-full text-xs font-bold tracking-wider border backdrop-blur-sm shadow-sm`}>
            {data?.status || "AKTIF"}
          </span>
        </div>
      </div>

      {/* Info Cards */}
      <div className="space-y-3">
        <h3 className="font-bold text-slate-800 ml-1">Informasi Pribadi</h3>
        
        <Card className="glass border-0 shadow-sm overflow-hidden">
          <CardContent className="p-0 divide-y divide-slate-100">
            <div className="flex items-center justify-between p-4 bg-white hover:bg-slate-50 transition-colors cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase">Data Diri</p>
                  <p className="text-sm font-semibold text-slate-800">Lengkap</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-300" />
            </div>

            <div className="flex items-center justify-between p-4 bg-white hover:bg-slate-50 transition-colors cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase">Keamanan Akun</p>
                  <p className="text-sm font-semibold text-slate-800">Password & PIN</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-300" />
            </div>
            
            <div className="flex items-center justify-between p-4 bg-white hover:bg-slate-50 transition-colors cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase">Alamat</p>
                  <p className="text-sm font-semibold text-slate-800 line-clamp-1">{data?.address || "Belum ada alamat"}</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-300" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Button 
        variant="destructive" 
        className="w-full h-14 rounded-2xl font-bold shadow-lg shadow-red-500/20"
        onClick={async () => {
          await signOut({ redirect: false })
          window.location.href = "/login"
        }}
      >
        <LogOut className="w-5 h-5 mr-2" /> KELUAR AKUN
      </Button>

    </div>
  )
}
