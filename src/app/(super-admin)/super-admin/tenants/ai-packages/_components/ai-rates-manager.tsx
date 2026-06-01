"use client"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/hooks/use-toast"
import { Save, Loader2 } from "lucide-react"

export function AiRatesManager() {
  const [rates, setRates] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const fetchRates = async () => {
    try {
      const res = await fetch("/api/super-admin/ai-rates")
      const data = await res.json()
      setRates(data)
    } catch {
      toast({ title: "Error", description: "Gagal memuat tarif token AI", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRates()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch("/api/super-admin/ai-rates", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(rates)
      })
      if (!res.ok) throw new Error("Gagal menyimpan")
      toast({ title: "Berhasil", description: "Tarif token AI berhasil diperbarui" })
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (key: string, value: string) => {
    const num = parseInt(value, 10)
    setRates(prev => ({ ...prev, [key]: isNaN(num) ? 0 : num }))
  }

  const rateLabels: Record<string, string> = {
    "vision-mission": "Visi & Misi",
    "about": "Profil / Sejarah",
    "principal-speech": "Sambutan Kepala Sekolah",
    "program": "Program / Jurusan",
    "facility": "Fasilitas",
    "teacher-bio": "Biodata Guru",
    "extracurricular": "Ekstrakurikuler",
    "event": "Agenda (Event)",
    "achievement": "Prestasi",
    "alumni": "Testimoni Alumni",
    "post": "Pembuatan Artikel Berita (Post)",
  }

  if (loading) {
    return <div className="h-40 flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
  }

  return (
    <Card className="glass border-0">
      <CardHeader>
        <CardTitle>Tarif Fix Konten AI</CardTitle>
        <CardDescription>Atur berapa banyak token AI yang dipotong untuk masing-masing jenis generate content.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
          {Object.entries(rateLabels).map(([key, label]) => (
            <div key={key} className="space-y-1.5 p-3 rounded-xl border bg-background/50 hover:bg-background transition-colors">
              <Label className="text-sm font-medium">{label}</Label>
              <div className="flex items-center gap-2">
                <Input 
                  type="number" 
                  min="0"
                  value={rates[key] || 0} 
                  onChange={(e) => handleChange(key, e.target.value)} 
                  className="max-w-[150px] font-mono font-bold text-primary rounded-lg"
                />
                <span className="text-sm text-muted-foreground font-semibold">Token</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter className="flex justify-end pt-4 border-t border-border/50">
        <Button onClick={handleSave} disabled={saving} className="btn-gradient text-white border-0 gap-2 min-w-[150px] rounded-xl h-10">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Simpan Tarif
        </Button>
      </CardFooter>
    </Card>
  )
}
