"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { 
  MonitorSmartphone, Save, Plus, Trash2, Clock, User, 
  Calendar, Loader2, PlayCircle, ExternalLink, RefreshCw 
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/hooks/use-toast"
import Link from "next/link"

const DAYS = [
  { value: "1", label: "Senin" },
  { value: "2", label: "Selasa" },
  { value: "3", label: "Rabu" },
  { value: "4", label: "Kamis" },
  { value: "5", label: "Jumat" },
  { value: "6", label: "Sabtu" },
  { value: "0", label: "Minggu" },
]

interface PiketSlot {
  id: string
  time: string
  names: string
}

interface SchoolTvClientProps {
  initialSettings: any
  tenantSlug: string
  tvUrl: string
  staffList?: { id: string; name: string; role: string | null }[]
}

export default function SchoolTvClient({ initialSettings, tenantSlug, tvUrl, staffList = [] }: SchoolTvClientProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [activeDay, setActiveDay] = useState("1") // Default to Senin
  
  // State for all days (safely initialized as arrays)
  const [piketSettings, setPiketSettings] = useState<Record<string, PiketSlot[]>>(() => {
    const defaultPiket: Record<string, PiketSlot[]> = {
      "1": [], "2": [], "3": [], "4": [], "5": [], "6": [], "0": []
    }
    if (initialSettings?.piketSettings && typeof initialSettings.piketSettings === "object") {
      const merged = { ...defaultPiket, ...initialSettings.piketSettings }
      Object.keys(merged).forEach(key => {
        if (!Array.isArray(merged[key])) {
          merged[key] = []
        }
      })
      return merged
    }
    return defaultPiket
  })

  // Sanitize staff list to prevent crash if s.name is null/undefined
  const safeStaffList = (staffList || []).filter(
    (s): s is { id: string; name: string; role: string | null } =>
      Boolean(s && s.id && s.name && typeof s.name === "string")
  )

  // Form states for adding new slot
  const [newTime, setNewTime] = useState("")
  const [selectedStaff, setSelectedStaff] = useState<string[]>([])
  const [staffSearch, setStaffSearch] = useState("")
  const [showDropdown, setShowDropdown] = useState(false)

  const [tvBarcode, setTvBarcode] = useState<{
    image?: string;
    bankAccount?: string;
    accountName?: string;
  }>(initialSettings?.tvBarcode || {})

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "Terlalu besar", description: "Ukuran gambar maksimal 2MB.", variant: "destructive" })
      return
    }
    const reader = new FileReader()
    reader.onloadend = () => {
      setTvBarcode(prev => ({ ...prev, image: reader.result as string }))
    }
    reader.readAsDataURL(file)
  }

  // Add a slot to active day
  const handleAddSlot = (e: React.FormEvent) => {
    e.preventDefault()
    const namesString = selectedStaff.join(", ")
    if (!newTime.trim() || !namesString) {
      toast({
        title: "Gagal",
        description: "Jam piket dan guru piket wajib diisi.",
        variant: "destructive"
      })
      return
    }

    const newSlot: PiketSlot = {
      id: Math.random().toString(36).substring(2, 9),
      time: newTime.trim(),
      names: namesString
    }

    setPiketSettings(prev => ({
      ...prev,
      [activeDay]: [...(prev[activeDay] || []), newSlot]
    }))

    setNewTime("")
    setSelectedStaff([])
    setStaffSearch("")
    
    toast({
      title: "Slot Ditambahkan",
      description: `Guru piket berhasil masuk antrean hari ${DAYS.find(d => d.value === activeDay)?.label}.`
    })
  }

  // Delete a slot
  const handleDeleteSlot = (day: string, id: string) => {
    setPiketSettings(prev => ({
      ...prev,
      [day]: (prev[day] || []).filter(slot => slot.id !== id)
    }))
    
    toast({
      title: "Slot Dihapus",
      description: "Data guru piket telah dihapus dari daftar."
    })
  }

  // Save to database
  const handleSaveSettings = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/tv/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ piketSettings, tvBarcode })
      })

      if (res.ok) {
        toast({
          title: "Berhasil Disimpan",
          description: "Pengaturan jadwal guru piket School TV berhasil diperbarui.",
        })
        router.refresh()
      } else {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "Gagal memperbarui data")
      }
    } catch (e: any) {
      toast({
        title: "Kesalahan",
        description: e.message || "Gagal menghubungkan ke server.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const currentDayLabel = DAYS.find(d => d.value === activeDay)?.label
  const currentDaySlots = piketSettings[activeDay] || []

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column: Quick Links & Preview */}
        <div className="space-y-6 lg:col-span-1">
          <Card className="shadow-md border-slate-200">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <PlayCircle className="h-5 w-5 text-emerald-500" />
                Akses TV Display
              </CardTitle>
              <CardDescription>
                Tautan publik layar informasi digital sekolah Anda.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-slate-50 p-3 rounded-lg border font-mono text-xs overflow-hidden text-ellipsis whitespace-nowrap text-slate-600">
                {tvUrl}
              </div>

              <Link href={tvUrl} target="_blank" className="w-full block">
                <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white gap-2" size="sm">
                  <ExternalLink className="h-4 w-4" />
                  Buka TV Display
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="shadow-md border-slate-200">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Petunjuk Pengaturan</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-3 leading-relaxed">
              <p>
                1. Pilih hari pada tab (misal: <b>Senin</b>).
              </p>
              <p>
                2. Input rentang jam tugas (misal: <code>08:00 - 10:00</code>) dan nama guru piket.
              </p>
              <p>
                3. Klik tombol <b className="text-emerald-600">Tambahkan Slot</b>.
              </p>
              <p>
                4. Anda dapat memasukkan lebih dari satu jadwal piket per hari (bergantian atau bersamaan).
              </p>
              <p className="text-amber-600 font-medium">
                5. Jangan lupa klik tombol <b>Simpan Jadwal Piket</b> di bagian bawah untuk menyimpan perubahan permanen.
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-md border-slate-200">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <QrCode className="h-5 w-5 text-indigo-500" />
                Barcode Pembayaran TV
              </CardTitle>
              <CardDescription>
                Tampilkan QR Code manual di layar TV untuk donasi/pembayaran.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold">Gambar Barcode (Max 2MB)</Label>
                <div className="flex items-center gap-3">
                  {tvBarcode.image && (
                    <div className="h-16 w-16 relative rounded-md border overflow-hidden shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={tvBarcode.image} alt="Barcode" className="object-cover w-full h-full" />
                    </div>
                  )}
                  <div className="flex-1">
                    <Input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleImageUpload}
                      className="text-xs file:bg-blue-50 file:text-blue-600 file:border-0 file:rounded-md file:px-2 file:py-1 file:mr-2 file:text-xs file:font-semibold hover:file:bg-blue-100 cursor-pointer"
                    />
                    {tvBarcode.image && (
                      <button 
                        type="button" 
                        onClick={() => setTvBarcode(prev => ({ ...prev, image: undefined }))}
                        className="text-xs text-red-500 hover:underline mt-1 block"
                      >
                        Hapus Gambar
                      </button>
                    )}
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold">Nomor Rekening & Bank</Label>
                <Input 
                  placeholder="Misal: BCA 1234567890" 
                  value={tvBarcode.bankAccount || ""}
                  onChange={e => setTvBarcode(prev => ({ ...prev, bankAccount: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold">Atas Nama</Label>
                <Input 
                  placeholder="Misal: Budi Santoso" 
                  value={tvBarcode.accountName || ""}
                  onChange={e => setTvBarcode(prev => ({ ...prev, accountName: e.target.value }))}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Data ini akan otomatis muncul di sudut kanan bawah TV jika diisi.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Right column: Dynamic Schedule Form */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-md border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-1.5 w-full"></div>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Calendar className="h-6 w-6 text-blue-500" />
                Jadwal Guru Piket Mingguan
              </CardTitle>
              <CardDescription>
                Atur jadwal guru piket harian yang akan dipajang secara bergantian di layar TV lobi.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Day Tabs */}
              <div className="flex flex-wrap gap-1.5 p-1 bg-slate-100 rounded-xl border">
                {DAYS.map(day => (
                  <button
                    key={day.value}
                    onClick={() => {
                      setActiveDay(day.value)
                      setNewTime("")
                      setSelectedStaff([])
                      setStaffSearch("")
                    }}
                    className={`flex-1 min-w-[70px] text-center py-2 px-3 text-xs font-semibold rounded-lg transition-all ${
                      activeDay === day.value
                        ? "bg-white text-blue-600 shadow-sm border"
                        : "text-slate-600 hover:bg-white/50 hover:text-slate-900"
                    }`}
                  >
                    {day.label}
                  </button>
                ))}
              </div>

              {/* Day Slots List */}
              <div className="space-y-4">
                <h3 className="font-bold text-slate-800 flex items-center gap-2 border-b pb-2">
                  <span>Daftar Piket Hari:</span>
                  <span className="text-blue-600 underline decoration-2 underline-offset-4">{currentDayLabel}</span>
                </h3>

                {currentDaySlots.length === 0 ? (
                  <div className="text-center py-10 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400">
                    <Clock className="h-10 w-10 mb-2 text-slate-300 animate-pulse" />
                    <p className="text-sm font-medium">Belum ada jadwal piket hari {currentDayLabel}.</p>
                    <p className="text-xs text-slate-400 mt-1">Gunakan form di bawah ini untuk menambahkan tugas pertama.</p>
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {currentDaySlots.map(slot => (
                      <div key={slot.id} className="flex items-start justify-between bg-slate-50 p-4 rounded-xl border border-slate-200 group hover:border-blue-400 transition-colors shadow-sm">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-blue-600 uppercase tracking-wide">
                            <Clock className="h-3 w-3" />
                            {slot.time}
                          </div>
                          <p className="font-semibold text-slate-800 text-sm whitespace-pre-wrap">{slot.names}</p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteSlot(activeDay, slot.id)}
                          className="h-8 w-8 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg shrink-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add Slot Form */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-4">
                <h4 className="font-bold text-xs text-slate-600 uppercase tracking-widest flex items-center gap-1">
                  <Plus className="h-4 w-4 text-emerald-500" />
                  Tambah Slot Baru
                </h4>
                
                <form onSubmit={handleAddSlot} className="grid gap-4 sm:grid-cols-3 items-end">
                  <div className="space-y-2">
                    <Label htmlFor="time" className="text-xs font-semibold text-slate-600">Jam Piket</Label>
                    <Input
                      id="time"
                      placeholder="Contoh: 08:00 - 10:00"
                      value={newTime}
                      onChange={e => setNewTime(e.target.value)}
                      className="bg-white h-10 border-slate-300 focus-visible:ring-blue-500"
                    />
                  </div>
                  
                  <div className="space-y-2 sm:col-span-2 flex gap-3 items-end">
                    <div className="flex-1 space-y-2 relative">
                      <Label className="text-xs font-semibold text-slate-600">Nama Guru / Petugas Piket</Label>
                      
                      {/* Selected Badges */}
                      {selectedStaff.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-2 p-2 bg-slate-100 rounded-lg border border-slate-200">
                          {selectedStaff.map(name => (
                            <span key={name} className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-1 rounded-md">
                              {name}
                              <button
                                type="button"
                                onClick={() => setSelectedStaff(prev => prev.filter(n => n !== name))}
                                className="hover:text-blue-900 font-bold ml-0.5"
                              >
                                &times;
                              </button>
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="relative">
                        <Input
                          placeholder={selectedStaff.length > 0 ? "Pilih guru lainnya..." : "Cari & pilih guru piket..."}
                          value={staffSearch}
                          onChange={e => {
                            setStaffSearch(e.target.value)
                            setShowDropdown(true)
                          }}
                          onFocus={() => setShowDropdown(true)}
                          className="bg-white h-10 border-slate-300 focus-visible:ring-blue-500"
                        />
                        
                        {/* Dropdown list */}
                        {showDropdown && (staffSearch || safeStaffList.length > 0) && (
                          <>
                            {/* Backdrop to close dropdown */}
                            <div className="fixed inset-0 z-10" onClick={() => setShowDropdown(false)}></div>
                            
                            <div className="absolute left-0 right-0 mt-1 max-h-60 overflow-y-auto bg-white border border-slate-200 rounded-lg shadow-lg z-20 divide-y divide-slate-100">
                              {safeStaffList.filter(s => s.name.toLowerCase().includes((staffSearch || "").toLowerCase())).length === 0 ? (
                                <div className="p-3 text-sm text-slate-500 text-center">Tidak ada nama guru yang cocok</div>
                              ) : (
                                safeStaffList
                                  .filter(s => s.name.toLowerCase().includes((staffSearch || "").toLowerCase()))
                                  .map(s => {
                                    const isSelected = selectedStaff.includes(s.name)
                                    return (
                                      <button
                                        key={s.id}
                                        type="button"
                                        onClick={() => {
                                          if (isSelected) {
                                            setSelectedStaff(prev => prev.filter(n => n !== s.name))
                                          } else {
                                            setSelectedStaff(prev => [...prev, s.name])
                                          }
                                          setStaffSearch("")
                                          setShowDropdown(false)
                                        }}
                                        className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 flex items-center justify-between ${
                                          isSelected ? "bg-blue-50/50 text-blue-600 font-medium" : "text-slate-700"
                                        }`}
                                      >
                                        <div>
                                          <p className="font-medium">{s.name}</p>
                                          <p className="text-xs text-slate-400">{s.role || "Staf/Guru"}</p>
                                        </div>
                                        {isSelected && <span className="text-blue-600 font-bold">✓</span>}
                                      </button>
                                    )
                                  })
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    <Button 
                      type="submit"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white shrink-0 h-10 px-4"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Tambah
                    </Button>
                  </div>
                </form>
              </div>

              {/* Submit Save */}
              <div className="flex justify-end pt-4 border-t">
                <Button
                  onClick={handleSaveSettings}
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 h-11 gap-2 shadow-md shadow-blue-500/20"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Simpan Jadwal Piket
                </Button>
              </div>

            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
