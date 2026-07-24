import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Users, Plus, Trash2, Megaphone } from "lucide-react"
import { AboutFormState } from "./types"
import { IconPicker } from "@/components/ui/icon-picker"
import { Switch } from "@/components/ui/switch"

interface GtkSettingsFormProps {
  form: AboutFormState
  setForm: React.Dispatch<React.SetStateAction<AboutFormState>>
}

export function GtkSettingsForm({ form, setForm }: GtkSettingsFormProps) {
  const gtkStats = form.settings?.gtkStats || []
  const gtkCta = form.settings?.gtkCta || {
    title: "",
    description: "",
    buttonText: "",
    buttonLink: ""
  }

  const showGtkStats = form.settings?.showGtkStats !== false // default true
  const showGtkCta = form.settings?.showGtkCta !== false // default true

  const toggleVisibility = (key: string, value: boolean) => {
    setForm(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        [key]: value
      }
    }))
  }

  const updateStats = (newStats: any[]) => {
    setForm(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        gtkStats: newStats
      }
    }))
  }

  const updateCta = (key: string, value: string) => {
    setForm(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        gtkCta: {
          ...(prev.settings?.gtkCta || {}),
          [key]: value
        }
      }
    }))
  }

  const addStat = () => {
    if (gtkStats.length >= 4) return
    updateStats([...gtkStats, { icon: "Users", value: "100+", label: "Statistik Baru" }])
  }

  const removeStat = (index: number) => {
    const newStats = [...gtkStats]
    newStats.splice(index, 1)
    updateStats(newStats)
  }

  const updateStatItem = (index: number, key: string, value: string) => {
    const newStats = [...gtkStats]
    newStats[index] = { ...newStats[index], [key]: value }
    updateStats(newStats)
  }

  return (
    <div className="space-y-6">
      <Card className="glass border-0">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 shrink-0">
              <Users className="h-4 w-4 text-primary" />
            </div>
            <div className="space-y-1">
              <CardTitle className="text-lg">Statistik Halaman Tim</CardTitle>
              <CardDescription>
                Atur 4 statistik yang muncul di banner halaman Tim. Jika dikosongkan, akan menggunakan data bawaan (Total Staf, Kinerja, dsb).
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium">Tampilkan</Label>
            <Switch checked={showGtkStats} onCheckedChange={(v) => toggleVisibility("showGtkStats", v)} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {gtkStats.map((stat: any, index: number) => (
              <div key={index} className="flex flex-col sm:flex-row items-start gap-4 p-4 border rounded-xl bg-white/50 relative group">
                <div className="flex flex-col gap-2 w-full sm:w-1/4">
                  <Label>Ikon</Label>
                  <IconPicker 
                    value={stat.icon} 
                    onChange={(val) => updateStatItem(index, "icon", val)} 
                  />
                </div>
                <div className="flex flex-col gap-2 w-full sm:w-1/4">
                  <Label>Angka / Nilai</Label>
                  <Input 
                    value={stat.value} 
                    onChange={(e) => updateStatItem(index, "value", e.target.value)} 
                    placeholder="Misal: 98%, 1:20" 
                    className="rounded-xl h-10"
                  />
                </div>
                <div className="flex flex-col gap-2 w-full sm:w-2/4">
                  <Label>Label Teks</Label>
                  <div className="flex gap-2">
                    <Input 
                      value={stat.label} 
                      onChange={(e) => updateStatItem(index, "label", e.target.value)} 
                      placeholder="Misal: Rasio Staf:Klien" 
                      className="rounded-xl h-10 flex-1"
                    />
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon" 
                      className="h-10 w-10 text-red-500 hover:text-red-700 hover:bg-red-50" 
                      onClick={() => removeStat(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            
            {gtkStats.length < 4 && (
              <Button 
                type="button" 
                variant="outline" 
                className="w-full border-dashed rounded-xl h-12 text-muted-foreground hover:text-primary hover:border-primary/50"
                onClick={addStat}
              >
                <Plus className="mr-2 h-4 w-4" /> Tambah Statistik ({gtkStats.length}/4)
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="glass border-0">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 shrink-0">
              <Megaphone className="h-4 w-4 text-blue-500" />
            </div>
            <div className="space-y-1">
              <CardTitle className="text-lg">Call-to-Action (CTA)</CardTitle>
              <CardDescription>
                Teks ajakan atau informasi lowongan pekerjaan (Karir) di bagian bawah halaman Tim. Biarkan kosong untuk nilai bawaan.
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium">Tampilkan</Label>
            <Switch checked={showGtkCta} onCheckedChange={(v) => toggleVisibility("showGtkCta", v)} />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label>Judul Utama</Label>
              <Input 
                value={gtkCta.title} 
                onChange={(e) => updateCta("title", e.target.value)} 
                placeholder="Misal: Ingin Menjadi Bagian dari Kami?" 
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label>Deskripsi / Teks Penjelasan</Label>
              <Textarea 
                value={gtkCta.description} 
                onChange={(e) => updateCta("description", e.target.value)} 
                placeholder="Misal: Kami selalu membuka kesempatan bagi para profesional..." 
                className="rounded-xl min-h-[100px]"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Teks Tombol Aksi</Label>
                <Input 
                  value={gtkCta.buttonText} 
                  onChange={(e) => updateCta("buttonText", e.target.value)} 
                  placeholder="Misal: Kirim Lamaran (Karir)" 
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label>Link Tujuan Tombol</Label>
                <Input 
                  value={gtkCta.buttonLink} 
                  onChange={(e) => updateCta("buttonLink", e.target.value)} 
                  placeholder="Misal: /contact atau https://wa.me/..." 
                  className="rounded-xl"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
