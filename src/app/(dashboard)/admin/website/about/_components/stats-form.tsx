import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { BarChart3, Plus, Trash2 } from "lucide-react"
import { AboutFormState } from "./types"
import { IconPicker } from "@/components/ui/icon-picker"

interface StatsFormProps {
  form: AboutFormState
  setForm: React.Dispatch<React.SetStateAction<AboutFormState>>
}

export function StatsForm({ form, setForm }: StatsFormProps) {
  const customStats = form.settings?.customStats || []

  const updateStats = (newStats: any[]) => {
    setForm(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        customStats: newStats
      }
    }))
  }

  const addStat = () => {
    if (customStats.length >= 4) return
    updateStats([...customStats, { icon: "Home", value: "100+", label: "Statistik Baru" }])
  }

  const removeStat = (index: number) => {
    const newStats = [...customStats]
    newStats.splice(index, 1)
    updateStats(newStats)
  }

  const updateStatItem = (index: number, key: string, value: string) => {
    const newStats = [...customStats]
    newStats[index] = { ...newStats[index], [key]: value }
    updateStats(newStats)
  }

  return (
    <Card className="glass border-0 lg:col-span-2">
      <CardHeader className="flex flex-row items-center space-y-0 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 shrink-0">
            <BarChart3 className="h-4 w-4 text-primary" />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-lg">Statistik Utama (Stats Bar)</CardTitle>
            <CardDescription>
              Ubah angka statistik yang muncul di halaman utama. Kosongkan (hapus semua) untuk kembali menggunakan angka otomatis.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {customStats.map((stat: any, index: number) => (
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
                  placeholder="Misal: 14+, 98%, 1:20" 
                  className="rounded-xl h-10"
                />
              </div>
              <div className="flex flex-col gap-2 w-full sm:w-2/4">
                <Label>Label Teks</Label>
                <div className="flex gap-2">
                  <Input 
                    value={stat.label} 
                    onChange={(e) => updateStatItem(index, "label", e.target.value)} 
                    placeholder="Misal: Total Guru & Staf" 
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

          {customStats.length < 4 && (
            <Button 
              type="button" 
              variant="outline" 
              className="w-full border-dashed rounded-xl h-12" 
              onClick={addStat}
            >
              <Plus className="h-4 w-4 mr-2" />
              Tambah Statistik Baru
            </Button>
          )}

          {customStats.length > 0 && (
             <div className="text-sm text-muted-foreground bg-primary/5 p-3 rounded-xl border border-primary/10">
               <strong>Catatan:</strong> Karena Anda telah membuat statistik kustom, sistem tidak akan lagi menghitung secara otomatis dari pangkalan data (database).
             </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
