import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { School, Hash, Loader2, Check, X } from "lucide-react"
import { cn } from "@/lib/utils"
import Image from "next/image"

export function BisnisProfileSection({
  form, setForm, 
  logoPreview, setLogoPreview, setLogoFile,
  isAvailable, isChecking, toast
}: any) {
  return (
    <Card className="glass border-0 shadow-xl shadow-primary/5 overflow-hidden">
      <div className="h-2 bg-gradient-to-r from-primary to-blue-500" />
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10"><School className="h-5 w-5 text-primary" /></div>
          <div>
            <CardTitle>Profil Bisnis</CardTitle>
            <CardDescription>Identitas resmi bisnis Anda</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <Label>Logo Bisnis (Opsional)</Label>
          <div className="flex items-center gap-4">
            {logoPreview ? (
              <Image src={logoPreview} alt="Logo" width={64} height={64} className="h-16 w-16 object-contain rounded-lg border bg-white" unoptimized />
            ) : (
              <div className="h-16 w-16 rounded-lg border-2 border-dashed flex items-center justify-center bg-muted/50">
                <School className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1">
              <Input 
                type="file" 
                accept="image/png, image/jpeg, image/webp"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    if (file.size > 2 * 1024 * 1024) {
                      toast({ title: "File Terlalu Besar", description: "Maksimal ukuran logo adalah 2MB", variant: "destructive" })
                      return
                    }
                    setLogoFile(file)
                    setLogoPreview(URL.createObjectURL(file))
                  }
                }}
                className="rounded-xl h-11"
              />
              <p className="text-[10px] text-muted-foreground mt-1">Maks 2MB. Format: JPG, PNG, WEBP.</p>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Nama Bisnis / Perusahaan</Label>
            <Input 
              required 
              value={form.businessName} 
              onChange={(e) => setForm({...form, businessName: e.target.value})}
              placeholder="Contoh: PT Teknologi Nusantara" 
              className="rounded-xl h-11"
            />
          </div>

        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Tipe Bisnis</Label>
            <div className="grid grid-cols-3 gap-2">
              {["UMKM", "Startup", "Corporate", "Agency", "Professional", "Freelancer"].map((s) => (
                <button
                  key={s} type="button"
                  onClick={() => setForm({...form, businessType: s})}
                  className={cn(
                    "h-11 rounded-xl border-2 text-xs font-medium transition-all",
                    form.businessType === s 
                      ? "border-primary bg-primary/5 text-primary" 
                      : "border-muted bg-transparent text-muted-foreground hover:bg-muted/50"
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Subdomain Website</Label>
            <div className="relative flex items-center">
              <Input 
                required 
                value={form.businessSlug} 
                onChange={(e) => setForm({...form, businessSlug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')})}
                placeholder="namabisnis" 
                className={cn(
                  "rounded-xl h-11 pr-32",
                  isAvailable === true && "border-emerald-500 focus-visible:ring-emerald-500",
                  isAvailable === false && "border-rose-500 focus-visible:ring-rose-500"
                )}
              />
              <div className="absolute right-3 flex items-center gap-2">
                {isChecking && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                {!isChecking && isAvailable === true && <Check className="h-4 w-4 text-emerald-500" />}
                {!isChecking && isAvailable === false && <X className="h-4 w-4 text-rose-500" />}
                <span className="text-xs font-medium text-muted-foreground">.bisnispro.id</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
