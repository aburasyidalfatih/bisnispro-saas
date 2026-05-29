"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent } from "@/components/ui/card"
import { QrCode, CreditCard, User, MapPin, Loader2 } from "lucide-react"

export default function KartuSiswaPage() {
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
    return <div className="h-[100dvh] w-full flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-purple-500" /></div>
  }

  return (
    <div className="space-y-6 pb-24">
      <div className="flex items-center gap-2 mb-4 px-1">
        <CreditCard className="w-5 h-5 text-purple-500" />
        <h2 className="font-bold text-slate-800 text-lg">Kartu Pelajar Digital</h2>
      </div>

      {/* Digital Card */}
      <div className="px-2">
        <div className="relative w-full aspect-[1.6/1] bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 rounded-2xl shadow-2xl overflow-hidden p-6 text-white border border-white/20">
          {/* Card Pattern/Texture */}
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '20px 20px' }}></div>
          <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute -top-20 -left-20 w-64 h-64 bg-black/10 rounded-full blur-3xl"></div>

          <div className="relative z-10 h-full flex flex-col justify-between">
            {/* Header Card */}
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-black text-xl tracking-tight text-white drop-shadow-md">SchoolPro SMA</h3>
                <p className="text-[10px] font-bold text-white/80 uppercase tracking-widest">Kartu Tanda Pelajar</p>
              </div>
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-md border border-white/30">
                <ShieldIcon className="w-6 h-6 text-white" />
              </div>
            </div>

            {/* Body Card */}
            <div className="flex items-end justify-between mt-4">
              <div className="flex gap-4 items-center">
                <div className="w-16 h-16 bg-white/20 rounded-xl border-2 border-white/50 backdrop-blur-md flex items-center justify-center overflow-hidden">
                  <User className="w-8 h-8 text-white/80" />
                </div>
                <div>
                  <p className="font-bold text-lg leading-tight text-white drop-shadow-md">{session?.user?.name || "Siswa Demo"}</p>
                  <p className="text-xs text-white/80 font-medium font-mono mt-1 tracking-widest">NISN: {data?.nisn || "00000000"}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* QR Code Section */}
      <div className="mt-8 px-2">
        <Card className="glass border-0 shadow-lg">
          <CardContent className="p-6 flex flex-col items-center text-center">
            <h4 className="font-bold text-slate-800 mb-2">Scan untuk Presensi / Kantin</h4>
            <p className="text-xs text-muted-foreground mb-6">Tunjukkan QR Code ini pada mesin *scanner* di gerbang sekolah atau mesin kasir kantin.</p>
            
            <div className="p-4 bg-white rounded-2xl shadow-inner border-2 border-slate-100">
              <QrCode className="w-40 h-40 text-slate-800" />
            </div>
            
            <p className="text-[10px] font-bold text-slate-400 mt-4 uppercase tracking-widest bg-slate-100 px-3 py-1 rounded-full">QR CODE OTOMATIS BERUBAH SETIAP 3 MENIT</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
    </svg>
  )
}
