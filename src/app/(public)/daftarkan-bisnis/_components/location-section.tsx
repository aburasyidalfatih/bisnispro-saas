import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { MapPin } from "lucide-react"
import { RegionSelector } from "@/components/ui/region-selector"

export function LocationSection({ form, setForm }: any) {
  return (
    <Card className="glass border-0">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-500/10"><MapPin className="h-5 w-5 text-blue-500" /></div>
          <div>
            <CardTitle>Lokasi Bisnis</CardTitle>
            <CardDescription>Wilayah operasional bisnis</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <RegionSelector
          province={form.province}
          regency={form.regency}
          onProvinceChange={(v) => setForm({...form, province: v, regency: ""})}
          onRegencyChange={(v) => setForm({...form, regency: v})}
          required
        />
        <div className="space-y-2">
          <Label>Alamat Lengkap</Label>
          <Textarea 
            required
            value={form.address} 
            onChange={(e) => setForm({...form, address: e.target.value})}
            placeholder="Jl. Pendidikan No. 123..." 
            className="rounded-xl min-h-[80px]"
          />
        </div>
      </CardContent>
    </Card>
  )
}
