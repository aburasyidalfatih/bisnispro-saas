"use client"

import { useEffect, useState, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  MapPin, Clock, CheckCircle, LogIn, LogOut, Loader2,
  Navigation, AlertCircle, Calendar, Camera, X
} from "lucide-react"
import { formatInTimeZone } from "date-fns-tz"
import { id as localeId } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { useGeolocation } from "./_hooks/use-geolocation"
import { useSelfieCapture } from "./_hooks/use-selfie-capture"
import { PermitFormDialog } from "./_components/permit-form-dialog"
import { PermitHistoryList } from "./_components/permit-history-list"
import { AttendanceHistoryList } from "./_components/attendance-history-list"

type AttendanceRecord = {
  id: string; date: string; status: string
  checkInAt?: string; checkOutAt?: string
  checkInLat?: number; checkInLng?: number; checkInPhoto?: string; notes?: string
}

const STATUS_CFG: Record<string, { label: string; color: string; bg: string }> = {
  HADIR: { label: "Hadir", color: "text-emerald-600", bg: "bg-emerald-500/10 border-emerald-300" },
  IZIN: { label: "Izin", color: "text-blue-600", bg: "bg-blue-500/10 border-blue-300" },
  SAKIT: { label: "Sakit", color: "text-amber-600", bg: "bg-amber-500/10 border-amber-300" },
  ALPHA: { label: "Alpha", color: "text-red-600", bg: "bg-red-500/10 border-red-300" },
}

export default function GTKAttendancePage() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const tenant = session?.user?.tenants?.[0]

  const [staff, setStaff] = useState<any>(null)
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null)
  const [history, setHistory] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [tz, setTz] = useState("Asia/Jakarta")
  const [checkingIn, setCheckingIn] = useState(false)
  const [checkingOut, setCheckingOut] = useState(false)
  const [notes, setNotes] = useState("")
  const [now, setNow] = useState(new Date())
  const [requireSelfie, setRequireSelfie] = useState(false)

  // Permits state
  const [permits, setPermits] = useState<any[]>([])
  const [permitsLoading, setPermitsLoading] = useState(true)

  const geo = useGeolocation()
  const selfie = useSelfieCapture(tenant?.id)

  // Live clock
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => {
      clearInterval(t)
      selfie.stopCamera()
    }
  }, [selfie.stopCamera])

  // Fetch staff profile
  useEffect(() => {
    if (!tenant) return
    fetch(`/api/panel-gtk/profil?tenantId=${tenant.id}`)
      .then(r => r.json())
      .then(data => {
        setStaff(data.error ? null : data)
        if (data.error) setLoading(false)
      })
      .catch(console.error)
  }, [tenant])

  // Fetch today's record and history
  const fetchAttendance = useCallback(async () => {
    if (!tenant || !staff) return
    try {
      const [todayRes, histRes, websiteRes] = await Promise.all([
        fetch(`/api/gtk/attendance/today?tenantId=${tenant.id}&staffId=${staff.id}`),
        fetch(`/api/gtk/attendance?tenantId=${tenant.id}&staffId=${staff.id}&take=30`),
        fetch(`/api/tenant/website?tenantId=${tenant.id}`)
      ])
      const todayData = await todayRes.json()
      const histData = await histRes.json()
      const websiteData = await websiteRes.json()

      setTodayRecord(todayData.record || null)
      setHistory(histData.data || [])
      setRequireSelfie(websiteData?.settings?.attendanceRequireSelfie || false)
      setTz(websiteData?.settings?.timezone || websiteData?.settings?.attendance?.timezone || "Asia/Jakarta")
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [tenant, staff])

  useEffect(() => { fetchAttendance() }, [fetchAttendance])

  const fetchPermits = useCallback(async () => {
    if (!tenant || !staff) return
    setPermitsLoading(true)
    try {
      const res = await fetch(`/api/gtk/attendance/permits?tenantId=${tenant.id}&staffId=${staff.id}&take=20`)
      const d = await res.json()
      setPermits(d.data || [])
    } catch (e) {
      console.error(e)
    } finally {
      setPermitsLoading(false)
    }
  }, [tenant, staff])

  useEffect(() => { fetchPermits() }, [fetchPermits])

  // Check-in
  const handleCheckIn = async () => {
    if (!staff || !tenant) return
    if (geo.geoState !== "success" || !geo.coords) {
      toast({ title: "Aktifkan GPS terlebih dahulu", variant: "destructive" })
      return
    }
    if (requireSelfie && !selfie.photoPreview) {
      toast({ title: "Wajib mengambil foto selfie", variant: "destructive" })
      return
    }
    setCheckingIn(true)
    try {
      const res = await fetch("/api/gtk/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId: tenant.id, staffId: staff.id,
          checkInLat: geo.coords.lat, checkInLng: geo.coords.lng,
          checkInPhoto: selfie.photoPreview || undefined, notes,
        }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      toast({ title: "✅ Check-in berhasil!", description: `Lokasi tercatat: ${geo.locationName}` })
      fetchAttendance()
    } catch (err: any) {
      toast({ title: "Gagal check-in", description: err.message, variant: "destructive" })
    } finally {
      setCheckingIn(false)
    }
  }

  // Check-out
  const handleCheckOut = async () => {
    if (!staff || !tenant || !todayRecord) return
    if (geo.geoState !== "success" || !geo.coords) {
      toast({ title: "Aktifkan GPS terlebih dahulu", variant: "destructive" })
      return
    }
    setCheckingOut(true)
    try {
      const res = await fetch(`/api/gtk/attendance/${todayRecord.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId: tenant?.id, notes,
          checkOutLat: geo.coords.lat, checkOutLng: geo.coords.lng
        }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      toast({ title: "✅ Check-out berhasil!" })
      fetchAttendance()
    } catch (err: any) {
      toast({ title: "Gagal check-out", description: err.message, variant: "destructive" })
    } finally {
      setCheckingOut(false)
    }
  }

  const alreadyCheckedIn = !!todayRecord?.checkInAt
  const alreadyCheckedOut = !!todayRecord?.checkOutAt

  const workDuration = (alreadyCheckedIn && todayRecord?.checkInAt)
    ? Math.floor((Date.now() - new Date(todayRecord.checkInAt).getTime()) / 60000)
    : null

  // Summary bulan ini
  const thisMonth = history.filter(r => new Date(r.date).getMonth() === now.getMonth())
  const summary = {
    HADIR: thisMonth.filter(r => r.status === "HADIR").length,
    IZIN: thisMonth.filter(r => r.status === "IZIN").length,
    SAKIT: thisMonth.filter(r => r.status === "SAKIT").length,
    ALPHA: thisMonth.filter(r => r.status === "ALPHA").length,
  }

  if (!staff && !loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <AlertCircle className="h-14 w-14 text-amber-500 mx-auto" />
          <h2 className="text-xl font-bold">Profil GTK Tidak Ditemukan</h2>
          <p className="text-muted-foreground text-sm">Akun Anda belum terhubung ke data GTK. Hubungi admin.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="pb-12 space-y-5 max-w-xl mx-auto md:mt-8 md:rounded-3xl md:overflow-hidden md:border md:shadow-2xl md:shadow-indigo-500/10 bg-background">
      {/* Hero Header */}
      <div className="bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 pt-10 pb-20 px-6">
        <p className="text-indigo-200 text-sm">Absensi Harian</p>
        <h1 className="text-white text-2xl font-black mt-1">{staff?.name || "Guru"}</h1>
        <p className="text-indigo-200 text-sm">{staff?.role || "Pengajar"} · {formatInTimeZone(now, tz, "EEEE, d MMMM yyyy", { locale: localeId })}</p>
        <div className="mt-4 text-center">
          <p className="text-white text-5xl font-black tracking-tight font-mono">
            {formatInTimeZone(now, tz, "HH:mm")}
            <span className="text-indigo-300 text-2xl">{formatInTimeZone(now, tz, ":ss")}</span>
          </p>
          <p className="text-indigo-300 text-sm mt-1">{tz === "Asia/Jayapura" ? "WIT" : tz === "Asia/Makassar" ? "WITA" : "WIB"}</p>
        </div>
      </div>

      <div className="px-5 -mt-14 space-y-4 relative z-10">
        {/* Status Card Hari Ini */}
        <Card className="glass border-0 shadow-xl">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="font-bold text-sm">Status Hari Ini</p>
              {todayRecord ? (
                <Badge variant="outline" className={cn(STATUS_CFG[todayRecord.status]?.bg, STATUS_CFG[todayRecord.status]?.color, "border text-xs font-bold")}>
                  {STATUS_CFG[todayRecord.status]?.label || todayRecord.status}
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-slate-100 text-slate-500 border-slate-200 text-xs font-bold">Belum Absen</Badge>
              )}
            </div>

            {/* Timeline Check-in / Check-out */}
            <div className="flex gap-0 mb-5">
              <div className="flex-1">
                <div className={cn("rounded-xl p-3 border text-center transition-all", alreadyCheckedIn ? "bg-emerald-500/10 border-emerald-300" : "bg-muted/50 border-dashed border-muted-foreground/30")}>
                  <LogIn className={cn("h-5 w-5 mx-auto mb-1", alreadyCheckedIn ? "text-emerald-600" : "text-muted-foreground")} />
                  <p className="text-xs text-muted-foreground">Absen Masuk</p>
                  <p className={cn("font-black text-base", alreadyCheckedIn ? "text-emerald-600" : "text-muted-foreground")}>
                    {alreadyCheckedIn ? formatInTimeZone(new Date(todayRecord!.checkInAt!), tz, "HH:mm") : "--:--"}
                  </p>
                </div>
              </div>
              <div className="flex items-center px-3">
                {workDuration !== null && !alreadyCheckedOut ? (
                  <div className="text-center"><Clock className="h-4 w-4 text-indigo-500 mx-auto" /><p className="text-[10px] text-indigo-500 font-bold">{workDuration}m</p></div>
                ) : (
                  <div className="h-px w-6 bg-border" />
                )}
              </div>
              <div className="flex-1">
                <div className={cn("rounded-xl p-3 border text-center transition-all", alreadyCheckedOut ? "bg-indigo-500/10 border-indigo-300" : "bg-muted/50 border-dashed border-muted-foreground/30")}>
                  <LogOut className={cn("h-5 w-5 mx-auto mb-1", alreadyCheckedOut ? "text-indigo-600" : "text-muted-foreground")} />
                  <p className="text-xs text-muted-foreground">Absen Pulang</p>
                  <p className={cn("font-black text-base", alreadyCheckedOut ? "text-indigo-600" : "text-muted-foreground")}>
                    {alreadyCheckedOut ? formatInTimeZone(new Date(todayRecord!.checkOutAt!), tz, "HH:mm") : "--:--"}
                  </p>
                </div>
              </div>
            </div>

            {/* GPS + Selfie + Actions */}
            <div className="space-y-3">
              {!alreadyCheckedOut && (
                <Button variant="outline" className={cn("w-full rounded-xl gap-2", geo.geoState === "success" && "border-emerald-400 text-emerald-600")} onClick={geo.getLocation} disabled={geo.geoState === "loading" || geo.geoState === "success"}>
                  {geo.geoState === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : geo.geoState === "success" ? <><CheckCircle className="h-4 w-4" /> Lokasi terdeteksi</> : <><Navigation className="h-4 w-4" /> Aktifkan GPS</>}
                </Button>
              )}

              {geo.geoState === "success" && geo.coords && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-emerald-500/10 border border-emerald-200">
                    <MapPin className="h-4 w-4 text-emerald-600 shrink-0" />
                    <p className="text-xs text-emerald-700 font-mono truncate">{geo.locationName}</p>
                  </div>
                  <div className="w-full h-48 rounded-xl overflow-hidden border shadow-sm">
                    <iframe width="100%" height="100%" frameBorder="0" style={{ border: 0 }}
                      src={`https://www.openstreetmap.org/export/embed.html?bbox=${geo.coords.lng-0.005},${geo.coords.lat-0.005},${geo.coords.lng+0.005},${geo.coords.lat+0.005}&layer=mapnik&marker=${geo.coords.lat},${geo.coords.lng}`}
                      allowFullScreen
                    ></iframe>
                  </div>

                  {requireSelfie && !alreadyCheckedIn && (
                    <div className="rounded-xl border p-3 bg-muted/30">
                      <p className="text-xs font-bold mb-2 flex items-center gap-1.5"><Camera className="h-3.5 w-3.5 text-primary"/> Foto Selfie (Wajib)</p>
                      <canvas ref={selfie.canvasRef} className="hidden" />
                      {selfie.isCameraOpen ? (
                        <div className="relative w-full rounded-lg overflow-hidden border border-border bg-black">
                          <video ref={selfie.videoRef} autoPlay playsInline className="w-full h-auto min-h-[200px] object-cover scale-x-[-1]" />
                          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-3">
                            <Button size="icon" variant="destructive" className="h-12 w-12 rounded-full shadow-lg" onClick={selfie.stopCamera}><X className="h-5 w-5" /></Button>
                            <Button variant="ghost" size="icon" className="h-12 w-12 rounded-full shadow-lg bg-emerald-500 hover:bg-emerald-600" onClick={selfie.capturePhoto}><Camera className="h-5 w-5 text-white" /></Button>
                          </div>
                        </div>
                      ) : selfie.photoPreview ? (
                        <div className="relative w-full h-48 rounded-lg overflow-hidden border border-border bg-black">
                          <img src={selfie.photoPreview} alt="Selfie" className="w-full h-full object-cover scale-x-[-1]" loading="lazy" decoding="async" />
                          <Button onClick={() => selfie.setPhotoPreview("")} className="absolute top-2 right-2 bg-destructive text-white p-1.5 rounded-full shadow-md hover:bg-destructive/90"><X className="h-4 w-4" /></Button>
                        </div>
                      ) : (
                        <div onClick={selfie.uploadingPhoto ? undefined : selfie.startCamera} className="w-full h-32 rounded-lg border-2 border-dashed border-primary/40 flex flex-col items-center justify-center cursor-pointer hover:bg-primary/5 transition-colors">
                          {selfie.uploadingPhoto ? (
                            <div className="flex flex-col items-center"><Loader2 className="h-8 w-8 text-primary animate-spin mb-2" /><span className="text-xs font-medium text-muted-foreground">Memproses...</span></div>
                          ) : (
                            <><Camera className="h-8 w-8 text-primary mb-2 opacity-80" /><span className="text-xs font-medium text-muted-foreground">Ketuk untuk buka kamera</span></>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {todayRecord?.checkInLat && todayRecord?.checkInLng && (
                <a href={`https://maps.google.com/?q=${todayRecord.checkInLat},${todayRecord.checkInLng}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2 rounded-xl bg-blue-500/10 border border-blue-200 hover:bg-blue-100 transition-colors">
                  <MapPin className="h-4 w-4 text-blue-600 shrink-0" />
                  <p className="text-xs text-blue-700">Lihat lokasi absen masuk di Maps</p>
                </a>
              )}

              {!alreadyCheckedOut && (
                <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Catatan (opsional)..." className="rounded-xl text-sm" />
              )}

              {!alreadyCheckedIn ? (
                <Button className="w-full h-14 rounded-2xl text-base font-bold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-lg shadow-emerald-500/30" disabled={checkingIn || geo.geoState !== "success"} onClick={handleCheckIn}>
                  {checkingIn ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <LogIn className="mr-2 h-5 w-5" />}
                  Absen Masuk Sekarang
                </Button>
              ) : !alreadyCheckedOut ? (
                <Button className="w-full h-14 rounded-2xl text-base font-bold bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 shadow-lg shadow-indigo-500/30" disabled={checkingOut} onClick={handleCheckOut}>
                  {checkingOut ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <LogOut className="mr-2 h-5 w-5" />}
                  Absen Pulang Sekarang
                </Button>
              ) : (
                <div className="flex items-center justify-center gap-2 py-4 text-emerald-600 font-bold">
                  <CheckCircle className="h-5 w-5" /> Absensi hari ini selesai!
                </div>
              )}

              {/* Pengajuan Izin */}
              {tenant && staff && (
                <PermitFormDialog tenantId={tenant.id} staffId={staff.id} onSubmitted={fetchPermits} />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Rekap Bulan Ini */}
        <div>
          <p className="font-bold text-sm mb-3 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            Rekap {formatInTimeZone(now, tz, "MMMM yyyy", { locale: localeId })}
          </p>
          <div className="grid grid-cols-4 gap-2">
            {Object.entries(STATUS_CFG).map(([key, cfg]) => (
              <div key={key} className={cn("rounded-2xl p-3 border text-center", cfg.bg)}>
                <p className={cn("text-2xl font-black", cfg.color)}>{summary[key as keyof typeof summary]}</p>
                <p className="text-[10px] text-muted-foreground font-medium mt-0.5">{cfg.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Riwayat Absensi */}
        <AttendanceHistoryList history={history} loading={loading} tz={tz} />

        {/* Riwayat Pengajuan Izin */}
        <PermitHistoryList permits={permits} loading={permitsLoading} tz={tz} />
      </div>
    </div>
  )
}
