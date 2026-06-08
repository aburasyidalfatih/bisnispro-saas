"use client"
import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Clock, MapPin, Loader2, Save, TrendingUp, CalendarCheck, Settings, FileText, Camera } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import Link from "next/link"

export default function GtkAttendanceSettingsPage() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const tenant = session?.user?.tenants?.[0]

  const activeTab: string = "settings"

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  const [form, setForm] = useState({
    gtkCheckIn: "07:00",
    gtkCheckOut: "15:00",
    lateTolerance: "15",
    radiusGps: "100",
    schoolLat: "",
    schoolLng: "",
    requireSelfie: false,
  })

  useEffect(() => {
    if (!tenant) return
    const fetchSettings = async () => {
      try {
        const res = await fetch(`/api/tenant/settings?tenantId=${tenant.id}`)
        const data = await res.json()
        const att = data?.attendance || {}
        setForm({
          gtkCheckIn: att.gtkCheckIn || "07:00",
          gtkCheckOut: att.gtkCheckOut || "15:00",
          lateTolerance: att.lateTolerance?.toString() || "15",
          radiusGps: att.radiusGps?.toString() || "100",
          schoolLat: att.schoolLat?.toString() || "",
          schoolLng: att.schoolLng?.toString() || "",
          requireSelfie: data?.attendanceRequireSelfie || false,
        })
      } catch (err) {
        console.error("Gagal memuat pengaturan", err)
      } finally {
        setLoading(false)
      }
    }
    fetchSettings()
  }, [tenant])

  const handleSave = async () => {
    if (!tenant) return
    setSaving(true)
    try {
      const payload = {
        settings: {
          attendance: {
            gtkCheckIn: form.gtkCheckIn,
            gtkCheckOut: form.gtkCheckOut,
            lateTolerance: parseInt(form.lateTolerance) || 0,
            radiusGps: parseInt(form.radiusGps) || 0,
            schoolLat: parseFloat(form.schoolLat) || null,
            schoolLng: parseFloat(form.schoolLng) || null,
          },
          attendanceRequireSelfie: form.requireSelfie,
        }
      }

      const res = await fetch("/api/tenant/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId: tenant.id, settings: payload.settings })
      })

      if (!res.ok) throw new Error((await res.json()).error)
      toast({ title: "Pengaturan berhasil disimpan" })
    } catch (err: any) {
      toast({ title: "Gagal menyimpan", description: err.message, variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Presensi Guru & Staf</h1>
          <p className="text-sm text-muted-foreground">Monitor, koreksi, dan rekap absensi karyawan profesional.</p>
        </div>
      </div>

      {/* Tabs Selector */}
      <div className="flex border-b border-border/50 pb-px overflow-x-auto gap-1">
        {[
          { id: "overview", label: "Overview", icon: TrendingUp, href: "/admin/attendance/gtk/overview" },
          { id: "presence", label: "Presensi Harian", icon: CalendarCheck, href: "/admin/attendance/gtk/presence" },
          { id: "permits", label: "Perizinan", icon: FileText, href: "/admin/attendance/gtk/permits" },
          { id: "settings", label: "Pengaturan", icon: Settings, href: "/admin/attendance/gtk/settings" },
        ].map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <Link
              key={tab.id}
              href={tab.href}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 text-xs font-semibold transition-all border-b-2 -mb-px rounded-t-xl shrink-0",
                isActive 
                  ? "border-primary text-primary bg-primary/5"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30"
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </Link>
          )
        })}
      </div>

      {/* Main Content */}
      <Card className="glass border-0 shadow-sm overflow-hidden max-w-4xl">
        <CardHeader className="border-b border-border/50 bg-white/50 dark:bg-zinc-950/50 pb-4">
          <CardTitle className="text-base font-bold">Pengaturan Jam Kerja & GPS</CardTitle>
          <CardDescription>Atur kebijakan waktu kehadiran, jam kerja, dan batas radius lokasi untuk presensi mandiri staf.</CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-8">
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : (
            <>
              {/* Jam Kerja */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <Clock className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold text-sm">Jadwal & Waktu</h3>
                </div>
                <div className="grid sm:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Jam Masuk</label>
                    <Input 
                      type="time" 
                      value={form.gtkCheckIn} 
                      onChange={e => setForm(f => ({ ...f, gtkCheckIn: e.target.value }))}
                      className="rounded-xl font-mono text-sm h-11"
                    />
                    <p className="text-[10px] text-muted-foreground">Waktu wajib staf sudah melakukan check-in.</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Jam Pulang</label>
                    <Input 
                      type="time" 
                      value={form.gtkCheckOut} 
                      onChange={e => setForm(f => ({ ...f, gtkCheckOut: e.target.value }))}
                      className="rounded-xl font-mono text-sm h-11"
                    />
                    <p className="text-[10px] text-muted-foreground">Waktu minimal staf diperbolehkan check-out.</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Toleransi Telat (Menit)</label>
                    <Input 
                      type="number" 
                      value={form.lateTolerance} 
                      onChange={e => setForm(f => ({ ...f, lateTolerance: e.target.value }))}
                      className="rounded-xl text-sm h-11"
                    />
                    <p className="text-[10px] text-muted-foreground">Batas kelonggaran waktu sebelum dicatat telat.</p>
                  </div>
                </div>
              </div>

              {/* Wajib Selfie */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <Camera className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold text-sm">Wajib Selfie (Swafoto)</h3>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-border bg-muted/20 px-4 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                      <Camera className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold leading-tight text-foreground">Wajibkan Foto Selfie</p>
                      <p className="text-xs text-muted-foreground mt-1">Guru harus mengambil foto wajah saat melakukan check-in dan check-out absensi.</p>
                    </div>
                  </div>
                  <button onClick={() => setForm(f => ({ ...f, requireSelfie: !f.requireSelfie }))}
                    className={cn("relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors",
                      form.requireSelfie ? "bg-primary" : "bg-muted-foreground/30")}
                    role="switch" aria-checked={form.requireSelfie}>
                    <span className={cn("inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform",
                      form.requireSelfie ? "translate-x-6" : "translate-x-1")} />
                  </button>
                </div>
              </div>

              {/* Lokasi / GPS */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <MapPin className="h-4 w-4 text-emerald-600" />
                  <h3 className="font-semibold text-sm">Pembatasan Lokasi (GPS)</h3>
                </div>
                <div className="grid sm:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Garis Lintang (Latitude)</label>
                    <Input 
                      type="text" 
                      placeholder="-6.2088"
                      value={form.schoolLat} 
                      onChange={e => setForm(f => ({ ...f, schoolLat: e.target.value }))}
                      className="rounded-xl font-mono text-sm h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Garis Bujur (Longitude)</label>
                    <Input 
                      type="text" 
                      placeholder="106.8456"
                      value={form.schoolLng} 
                      onChange={e => setForm(f => ({ ...f, schoolLng: e.target.value }))}
                      className="rounded-xl font-mono text-sm h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Radius Maksimal (Meter)</label>
                    <Input 
                      type="number" 
                      placeholder="100"
                      value={form.radiusGps} 
                      onChange={e => setForm(f => ({ ...f, radiusGps: e.target.value }))}
                      className="rounded-xl text-sm h-11"
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-xl border">
                  <strong>Tip:</strong> Kosongkan Latitude dan Longitude jika tidak ingin membatasi lokasi check-in/check-out secara spesifik menggunakan GPS.
                </p>
              </div>

              <div className="flex justify-end pt-4">
                <Button onClick={handleSave} disabled={saving} className="rounded-xl px-8 font-semibold shadow-sm gap-2">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Simpan Pengaturan
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
