"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/hooks/use-toast"
import { Smartphone, RefreshCcw, LogOut, Send, CheckCircle2, AlertCircle, QrCode, Clock, Save } from "lucide-react"
import { getWaStatus, startWaSession, logoutWaSession, sendWaMessageTest, updateWaDelay } from "@/lib/actions/whatsapp"
import Image from "next/image"

export function WhatsappManager({ tenantId: propTenantId }: { tenantId?: string } = {}) {
  const { data: session } = useSession()
  const tenantId = propTenantId || session?.user?.tenants?.[0]?.id

  const [status, setStatus] = useState<"DISCONNECTED" | "CONNECTING" | "CONNECTED">("DISCONNECTED")
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  
  // Test message state
  const [testPhone, setTestPhone] = useState("")
  const [testMessage, setTestMessage] = useState("")
  const [sending, setSending] = useState(false)
  
  // Delay state
  const [delayMin, setDelayMin] = useState(5)
  const [delayMax, setDelayMax] = useState(15)
  const [savingDelay, setSavingDelay] = useState(false)

  // Resolve tenantId if impersonating
  const activeTenantId = tenantId || getImpersonateTenantId()

  function getImpersonateTenantId() {
    if (typeof document === 'undefined') return null
    const match = document.cookie.match(/impersonate-tenant=([^;]+)/)
    // We ideally need the ID, not slug. If slug, we should have fetched the ID earlier. 
    // For simplicity, assume session handles it, or handle edge case if needed.
    return match ? null : null // placeholder
  }

  // Polling function
  useEffect(() => {
    if (!activeTenantId) return

    let intervalId: NodeJS.Timeout

    const fetchStatus = async () => {
      try {
        const data = await getWaStatus(activeTenantId)
        setStatus(data.status as any)
        setQrCode(data.qrCode)
        if (data.delayMin) setDelayMin(data.delayMin)
        if (data.delayMax) setDelayMax(data.delayMax)
        setLoading(false)

        // If it's connecting, poll every 3 seconds to get the QR or status update
        if (data.status === 'CONNECTING') {
          intervalId = setTimeout(fetchStatus, 3000)
        }
      } catch (error) {
        console.error("Failed to fetch WA status", error)
        setLoading(false)
      }
    }

    fetchStatus()

    return () => clearTimeout(intervalId)
  }, [activeTenantId, status])

  const handleStartSession = async () => {
    if (!activeTenantId) return
    setStatus("CONNECTING")
    setLoading(true)
    
    const res = await startWaSession(activeTenantId)
    if (res.error) {
      toast({ title: "Gagal", description: res.error, variant: "destructive" })
      setStatus("DISCONNECTED")
      setLoading(false)
    } else {
      toast({ title: "Memulai Sesi", description: "Menghasilkan QR Code, mohon tunggu..." })
    }
  }

  const handleLogout = async () => {
    if (!activeTenantId) return
    setLoading(true)
    const res = await logoutWaSession(activeTenantId)
    if (res.error) {
      toast({ title: "Gagal", description: res.error, variant: "destructive" })
    } else {
      toast({ title: "Berhasil", description: "Sesi WhatsApp diputus." })
      setStatus("DISCONNECTED")
      setQrCode(null)
    }
    setLoading(false)
  }

  const handleTestMessage = async () => {
    if (!activeTenantId || !testPhone || !testMessage) return
    setSending(true)
    const res = await sendWaMessageTest(activeTenantId, testPhone, testMessage)
    if (res.error) {
      toast({ title: "Gagal", description: res.error, variant: "destructive" })
    } else {
      toast({ title: "Berhasil", description: "Pesan uji coba terkirim!" })
      setTestPhone("")
      setTestMessage("")
    }
    setSending(false)
  }

  const handleSaveDelay = async () => {
    if (!activeTenantId) return
    if (delayMin >= delayMax) {
      toast({ title: "Gagal", description: "Jeda Min harus lebih kecil dari Jeda Max", variant: "destructive" })
      return
    }
    setSavingDelay(true)
    const res = await updateWaDelay(activeTenantId, delayMin, delayMax)
    if (res.error) {
      toast({ title: "Gagal", description: res.error, variant: "destructive" })
    } else {
      toast({ title: "Tersimpan", description: "Pengaturan antrean dan jeda berhasil disimpan." })
    }
    setSavingDelay(false)
  }

  if (loading && status === "DISCONNECTED") {
    return <div className="skeleton h-64 w-full rounded-2xl" />
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Kolom Kiri: Status & Koneksi */}
      <div className="space-y-6">
        <Card className="glass border-0 shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
              status === 'CONNECTED' ? 'bg-emerald-500/10 text-emerald-600' :
              status === 'CONNECTING' ? 'bg-amber-500/10 text-amber-600' :
              'bg-rose-500/10 text-rose-600'
            }`}>
              <Smartphone className="h-6 w-6" />
            </div>
            <div>
              <CardTitle>Status Koneksi</CardTitle>
              <CardDescription>
                {status === 'CONNECTED' ? 'Perangkat tertaut & siap digunakan' :
                 status === 'CONNECTING' ? 'Menunggu pemindaian QR Code...' :
                 'Belum ada perangkat yang tertaut'}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center p-6 min-h-[300px]">
          {status === "DISCONNECTED" && (
            <div className="text-center space-y-4">
              <div className="bg-muted/50 p-6 rounded-full inline-block mb-2">
                <QrCode className="h-12 w-12 text-muted-foreground/50" />
              </div>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                Tautkan nomor WhatsApp sekolah Anda untuk mulai mengirim notifikasi dan broadcast ke siswa & wali murid.
              </p>
              <Button onClick={handleStartSession} className="rounded-xl w-full" size="lg">
                <RefreshCcw className="mr-2 h-4 w-4" /> Generate QR Code
              </Button>
            </div>
          )}

          {status === "CONNECTING" && (
            <div className="text-center space-y-6 w-full">
              {qrCode ? (
                <div className="space-y-4 flex flex-col items-center">
                  <div className="bg-white p-4 rounded-2xl shadow-sm border inline-block">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={qrCode} alt="WhatsApp QR Code" className="w-64 h-64 object-contain" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-semibold">Pindai QR Code</p>
                    <p className="text-xs text-muted-foreground">Buka WhatsApp di HP &gt; Perangkat Tertaut &gt; Tautkan Perangkat</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 space-y-4">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                  <p className="text-sm text-muted-foreground animate-pulse">Menghasilkan QR Code...</p>
                </div>
              )}
              <Button variant="outline" onClick={handleLogout} className="rounded-xl w-full">Batal</Button>
            </div>
          )}

          {status === "CONNECTED" && (
            <div className="text-center w-full flex flex-col items-center justify-center h-full space-y-6">
              <div className="bg-emerald-500/10 p-6 rounded-full inline-block">
                <CheckCircle2 className="h-16 w-16 text-emerald-500" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-emerald-600">Terhubung</h3>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                  Gateway WhatsApp berjalan aktif. Sistem sekarang dapat mengirimkan notifikasi secara otomatis.
                </p>
              </div>
              <Button variant="destructive" onClick={handleLogout} className="rounded-xl w-full max-w-xs" disabled={loading}>
                <LogOut className="mr-2 h-4 w-4" /> Putuskan Koneksi
              </Button>
            </div>
          )}
        </CardContent>
        </Card>

        {/* Pengaturan Antrean & Delay */}
        <Card className="glass border-0 shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600">
                <Clock className="h-6 w-6" />
              </div>
              <div>
                <CardTitle>Pengaturan Antrean & Delay</CardTitle>
                <CardDescription>Atur jeda waktu (detik) antar pesan agar aman dari blokir spam.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Jeda Min (Detik)</Label>
                <Input 
                  type="number" 
                  min={1} 
                  value={delayMin} 
                  onChange={(e) => setDelayMin(Number(e.target.value))} 
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label>Jeda Max (Detik)</Label>
                <Input 
                  type="number" 
                  min={2} 
                  value={delayMax} 
                  onChange={(e) => setDelayMax(Number(e.target.value))} 
                  className="rounded-xl"
                />
              </div>
            </div>
            <Button 
              className="w-full gap-2 rounded-xl border border-input bg-background hover:bg-accent hover:text-accent-foreground" 
              onClick={handleSaveDelay}
              disabled={savingDelay}
            >
              <Save className="h-4 w-4" /> {savingDelay ? "Menyimpan..." : "Simpan Pengaturan Delay"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Kolom Kanan: Uji Coba Pengiriman */}
      <Card className={`glass border-0 shadow-lg transition-all duration-500 ${status !== 'CONNECTED' ? 'opacity-50 grayscale pointer-events-none' : ''} h-fit`}>
        <CardHeader>
          <CardTitle>Uji Coba Pengiriman</CardTitle>
          <CardDescription>Kirim pesan pengujian untuk memastikan gateway berfungsi normal.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Nomor Tujuan (WhatsApp)</Label>
            <Input 
              placeholder="Contoh: 081234567890" 
              value={testPhone} 
              onChange={(e) => setTestPhone(e.target.value)} 
              className="rounded-xl"
            />
            <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-1">
              <AlertCircle className="h-3 w-3" /> Format dimulai dari 08 atau 62.
            </p>
          </div>
          <div className="space-y-2">
            <Label>Pesan Uji Coba</Label>
            <textarea 
              className="flex min-h-[120px] w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Halo, ini adalah pesan uji coba dari sistem SchoolPro."
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
            />
          </div>
          <Button 
            className="w-full rounded-xl btn-gradient text-white border-0" 
            onClick={handleTestMessage}
            disabled={sending || !testPhone || !testMessage}
          >
            {sending ? "Mengirim..." : (
              <>
                <Send className="mr-2 h-4 w-4" /> Kirim Pesan Sekarang
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
