import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Globe, Save, MessageSquare, XCircle, Shield, Eye, EyeOff, Server, Users } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"
import Image from "next/image"
import type { SettingsForm } from "../constants"

interface GeneralTabProps {
  form: SettingsForm;
  setForm: React.Dispatch<React.SetStateAction<SettingsForm>>;
  handleSaveBatch: (fields: string[], overrides?: Record<string, string>) => Promise<void>;
  saving: boolean;
  initialWaSupportList?: {id: string, name: string, number: string}[];
}

export function GeneralTab({ form, setForm, handleSaveBatch, saving, initialWaSupportList = [] }: GeneralTabProps) {
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [waSupportList, setWaSupportList] = useState<{id: string, name: string, number: string}[]>(initialWaSupportList)

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    setUploadingLogo(true)
    const formData = new FormData()
    formData.append("file", file)
    formData.append("subDir", "platform")
    
    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData
      })
      const data = await res.json()
      if (res.ok) {
        setForm(prev => ({ ...prev, app_logo: data.url }))
        handleSaveBatch(['app_logo'], { app_logo: data.url })
      } else {
        toast({ title: "Upload gagal", description: data.error, variant: "destructive" })
      }
    } catch (err) {
      toast({ title: "Error", description: "Terjadi kesalahan sistem", variant: "destructive" })
    } finally {
      setUploadingLogo(false)
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2 outline-none">
      <div className="space-y-6">
        <Card className="glass border-0">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10"><Globe className="h-4 w-4 text-primary" /></div>
              <CardTitle className="text-lg">Identitas Platform</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Logo Platform (SaaS)</Label>
              <div className="flex items-center gap-4">
                {form.app_logo ? (
                  <div className="relative h-16 w-16 shrink-0 rounded-lg border bg-white p-1 overflow-hidden">
                    <Image src={form.app_logo} alt="Logo" fill className="object-contain" />
                  </div>
                ) : (
                  <div className="h-16 w-16 rounded-lg border-2 border-dashed flex items-center justify-center bg-muted/50">
                    <Globe className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1">
                  <Input 
                    type="file" 
                    accept="image/png, image/jpeg, image/webp"
                    onChange={handleLogoUpload}
                    disabled={uploadingLogo}
                    className="rounded-xl h-11"
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {uploadingLogo ? "Mengunggah..." : "Maks 2MB. Format: JPG, PNG, WEBP."}
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Nama Platform</Label>
              <Input value={form.platform_name} onChange={e => setForm({...form, platform_name: e.target.value})} placeholder="SchoolPro" className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label>Tagline Platform</Label>
              <Input value={form.platform_tagline} onChange={e => setForm({...form, platform_tagline: e.target.value})} placeholder="Solusi Manajemen Digital" className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label>Email Kontak</Label>
              <Input value={form.contact_email} onChange={e => setForm({...form, contact_email: e.target.value})} placeholder="support@schoolpro.id" className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label>Alamat Platform</Label>
              <Input value={form.platform_address} onChange={e => setForm({...form, platform_address: e.target.value})} placeholder="Jl. Contoh No. 123, Jakarta, Indonesia" className="rounded-xl" />
              <p className="text-[10px] text-muted-foreground mt-1">Alamat ini akan ditampilkan di halaman Invoice.</p>
            </div>
            <div className="space-y-2">
              <Label>Meta Pixel ID (Facebook Pixel)</Label>
              <Input value={form.META_PIXEL_ID} onChange={e => setForm({...form, META_PIXEL_ID: e.target.value})} placeholder="Misal: 123456789012345" className="rounded-xl" />
              <p className="text-[10px] text-muted-foreground mt-1">Kosongkan jika tidak ingin menggunakan Meta Pixel tracking.</p>
            </div>

            <Button 
              className="w-full gap-2 btn-gradient text-white border-0 rounded-xl"
              onClick={() => handleSaveBatch(['platform_name', 'platform_tagline', 'platform_address', 'contact_email', 'META_PIXEL_ID'])}
              disabled={saving || uploadingLogo}
            >
              {saving ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <Save className="h-4 w-4" />}
              Simpan Identitas Platform
            </Button>
          </CardContent>
        </Card>

        <Card className="glass border-0">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10"><MessageSquare className="h-4 w-4 text-emerald-500" /></div>
              <CardTitle className="text-lg">WhatsApp Support (Landing Page)</CardTitle>
            </div>
            <CardDescription>Nomor WhatsApp ini akan tampil sebagai popup chat di landing page utama.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {waSupportList.map((wa, i) => (
              <div key={wa.id} className="flex gap-2 items-center">
                <Input value={wa.name} onChange={(e) => {
                  const newWa = [...waSupportList]; newWa[i].name = e.target.value; setWaSupportList(newWa);
                }} placeholder="Nama (Cth: CS Sales)" className="rounded-xl flex-1" />
                <Input value={wa.number} onChange={(e) => {
                  const newWa = [...waSupportList]; newWa[i].number = e.target.value; setWaSupportList(newWa);
                }} placeholder="628123..." className="rounded-xl flex-1" />
                <Button variant="destructive" size="icon" className="rounded-xl shrink-0" onClick={() => {
                  setWaSupportList(waSupportList.filter(item => item.id !== wa.id));
                }}><XCircle className="h-4 w-4" /></Button>
              </div>
            ))}
            <Button variant="outline" className="w-full rounded-xl" onClick={() => {
              setWaSupportList([...waSupportList, { id: Math.random().toString(), name: "", number: "" }]);
            }}>
              + Tambah Nomor WA
            </Button>
            <Button 
              className="w-full gap-2 btn-gradient text-white border-0 rounded-xl"
              onClick={() => handleSaveBatch(['SUPPORT_WA_NUMBERS'], { SUPPORT_WA_NUMBERS: JSON.stringify(waSupportList) })}
              disabled={saving}
            >
              {saving ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <Save className="h-4 w-4" />}
              Simpan WhatsApp Support
            </Button>
          </CardContent>
        </Card>

        <Card className="glass border-0">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500/10"><Users className="h-4 w-4 text-orange-500" /></div>
              <CardTitle className="text-lg">Pengaturan Kemitraan (Afiliasi)</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Nominal Cashback Default (Rp)</Label>
              <Input 
                type="number"
                value={form.AFFILIATE_DEFAULT_CASHBACK || ""} 
                onChange={e => setForm({...form, AFFILIATE_DEFAULT_CASHBACK: e.target.value})} 
                placeholder="400000" 
                className="rounded-xl" 
              />
              <p className="text-[10px] text-muted-foreground mt-1">Besaran komisi default yang otomatis diberikan ketika mitra baru mendaftar.</p>
            </div>
            <Button 
              className="w-full gap-2 btn-gradient text-white border-0 rounded-xl"
              onClick={() => handleSaveBatch(['AFFILIATE_DEFAULT_CASHBACK'])}
              disabled={saving}
            >
              {saving ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <Save className="h-4 w-4" />}
              Simpan Nominal Cashback
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card className="glass border-0">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10"><Shield className="h-4 w-4 text-primary" /></div>
              <CardTitle className="text-lg">Keamanan & Fitur</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <button
              onClick={() => {
                const newVal = form.allow_impersonate_user === "true" ? "false" : "true"
                setForm({...form, allow_impersonate_user: newVal})
                handleSaveBatch(['allow_impersonate_user'], { allow_impersonate_user: newVal })
              }}
              className={cn(
                "flex w-full items-center justify-between rounded-xl border-2 p-4 transition-all duration-200 text-left",
                form.allow_impersonate_user === "true" ? "border-primary bg-primary/5" : "border-transparent bg-muted/50 hover:bg-muted"
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", form.allow_impersonate_user === "true" ? "bg-primary/10" : "bg-muted")}>
                  {form.allow_impersonate_user === "true" ? <Eye className="h-5 w-5 text-primary" /> : <EyeOff className="h-5 w-5 text-muted-foreground" />}
                </div>
                <div>
                  <p className="font-medium text-sm">Login Sebagai User</p>
                  <p className="text-xs text-muted-foreground">Izinkan Super Admin login ke tenant dashboard</p>
                </div>
              </div>
              <div className={cn("h-2.5 w-2.5 rounded-full", form.allow_impersonate_user === "true" ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-muted-foreground/30")} />
            </button>

            <button
              onClick={() => {
                const newVal = form.enable_custom_domain === "true" ? "false" : "true"
                setForm({...form, enable_custom_domain: newVal})
                handleSaveBatch(['enable_custom_domain'], { enable_custom_domain: newVal })
              }}
              className={cn(
                "flex w-full items-center justify-between rounded-xl border-2 p-4 transition-all duration-200 text-left",
                form.enable_custom_domain === "true" ? "border-primary bg-primary/5" : "border-transparent bg-muted/50 hover:bg-muted"
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", form.enable_custom_domain === "true" ? "bg-primary/10" : "bg-muted")}>
                  <Globe className={cn("h-5 w-5", form.enable_custom_domain === "true" ? "text-primary" : "text-muted-foreground")} />
                </div>
                <div>
                  <p className="font-medium text-sm">Fitur Custom Domain</p>
                  <p className="text-xs text-muted-foreground">Izinkan tenant mengatur domain khusus (Custom Domain)</p>
                </div>
              </div>
              <div className={cn("h-2.5 w-2.5 rounded-full", form.enable_custom_domain === "true" ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-muted-foreground/30")} />
            </button>

            <button
              onClick={() => {
                const newVal = form.block_search_indexing === "true" ? "false" : "true"
                setForm({...form, block_search_indexing: newVal})
                handleSaveBatch(['block_search_indexing'], { block_search_indexing: newVal })
              }}
              className={cn(
                "flex w-full items-center justify-between rounded-xl border-2 p-4 transition-all duration-200 text-left",
                form.block_search_indexing === "true" ? "border-amber-500 bg-amber-500/5" : "border-transparent bg-muted/50 hover:bg-muted"
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", form.block_search_indexing === "true" ? "bg-amber-500/10" : "bg-muted")}>
                  <Globe className={cn("h-5 w-5", form.block_search_indexing === "true" ? "text-amber-500" : "text-muted-foreground")} />
                </div>
                <div>
                  <p className="font-medium text-sm text-amber-600">Block Search Indexing (Dev Mode)</p>
                  <p className="text-xs text-muted-foreground">Cegah Google mengindeks seluruh platform ini (X-Robots-Tag: noindex)</p>
                </div>
              </div>
              <div className={cn("h-2.5 w-2.5 rounded-full", form.block_search_indexing === "true" ? "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" : "bg-muted-foreground/30")} />
            </button>
          </CardContent>
        </Card>

        <Card className="glass border-0">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10"><Server className="h-4 w-4 text-primary" /></div>
              <CardTitle className="text-lg">Informasi Sistem</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              { label: "Status Redis", value: "Tersambung (Optimized)", color: "text-emerald-600" },
              { label: "Mode Output", value: "Next.js Standalone", color: "text-primary" },
              { label: "Versi Core", value: "15.1.7 (Stable)", color: "" },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between text-xs px-1">
                <span className="text-muted-foreground">{item.label}</span>
                <span className={cn("font-medium", item.color)}>{item.value}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
