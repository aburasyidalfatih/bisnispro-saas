import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Megaphone } from "lucide-react"
import { AboutFormState } from "./types"

interface MarqueeFormProps {
  form: AboutFormState
  setForm: React.Dispatch<React.SetStateAction<AboutFormState>>
}

export function MarqueeForm({ form, setForm }: MarqueeFormProps) {
  return (
    <Card className="glass border-0 lg:col-span-2">
      <CardHeader className="flex flex-row items-center space-y-0 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 shrink-0">
            <Megaphone className="h-4 w-4 text-primary" />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-lg">Teks Berjalan (Marquee)</CardTitle>
            <CardDescription>
              Teks berjalan yang muncul di bagian paling atas website publik perusahaan.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="space-y-2 max-w-2xl">
            <Label>Teks Pengumuman</Label>
            <Textarea
              placeholder="Kosongkan jika tidak ingin menampilkan teks berjalan..."
              value={form.settings?.marqueeText || ""}
              onChange={(e) => setForm(prev => ({ ...prev, settings: { ...prev.settings, marqueeText: e.target.value } }))}
              className="flex min-h-[80px] w-full rounded-xl border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            />
            <p className="text-[11px] text-muted-foreground">
              Jika diisi, teks akan berjalan dari kanan ke kiri di halaman pengunjung. Jika dikosongkan, area teks berjalan akan disembunyikan secara otomatis.
            </p>
          </div>
          
          <div className="space-y-2 max-w-[250px]">
            <Label>Kecepatan Berjalan</Label>
            <Select 
              value={form.settings?.marqueeSpeed || "25s"} 
              onValueChange={(val) => setForm(prev => ({ ...prev, settings: { ...prev.settings, marqueeSpeed: val } }))}
            >
              <SelectTrigger className="rounded-xl h-10 bg-background">
                <SelectValue placeholder="Pilih kecepatan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="40s">Sangat Lambat (40s)</SelectItem>
                <SelectItem value="30s">Lambat (30s)</SelectItem>
                <SelectItem value="25s">Normal (25s)</SelectItem>
                <SelectItem value="15s">Cepat (15s)</SelectItem>
                <SelectItem value="10s">Sangat Cepat (10s)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
