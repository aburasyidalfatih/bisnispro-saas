"use client"

import { useState, useEffect } from"react"
import { useSession } from"next-auth/react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from"@/components/ui/card"
import { Button } from"@/components/ui/button"
import { Input } from"@/components/ui/input"
import { Label } from"@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from"@/components/ui/select"
import { useColorTheme } from"@/components/providers/color-theme-provider"
import { themes } from"@/lib/themes"
import { Check, Sun, Moon, Monitor, Palette, Info, Save, RotateCcw, LayoutTemplate, Lock, Loader2, Type, Crown } from"lucide-react"
import { cn } from"@/lib/utils"
import { toast } from"@/hooks/use-toast"

const themeGradients: Record<string, string> = {
  corporate: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 50%, #1e40af 100%)", // Royal Blue
  ocean: "linear-gradient(135deg, #0ea5e9 0%, #0284c7 50%, #0f766e 100%)", // Ocean Cyan-Teal
  emerald: "linear-gradient(135deg, #34d399 0%, #10b981 50%, #047857 100%)", // Vibrant Mint-Forest
  sunset: "linear-gradient(135deg, hsl(25, 95%, 53%) 0%, hsl(0, 84%, 60%) 50%, hsl(340, 82%, 40%) 100%)",
  aurora: "linear-gradient(135deg, hsl(271, 91%, 65%) 0%, hsl(262, 83%, 58%) 50%, hsl(264, 69%, 50%) 100%)",
  cyberpunk: "linear-gradient(135deg, hsl(188, 86%, 53%) 0%, hsl(262, 83%, 58%) 50%, hsl(292, 84%, 61%) 100%)",
  midnight: "linear-gradient(135deg, hsl(222, 47%, 11%) 0%, hsl(242, 47%, 20%) 50%, hsl(242, 47%, 34%) 100%)",
  hologram: "linear-gradient(135deg, hsl(199, 92%, 60%) 0%, hsl(235, 86%, 65%) 33%, hsl(272, 72%, 65%) 66%, hsl(292, 84%, 61%) 100%)",
  graphite: "linear-gradient(135deg, hsl(215, 15%, 60%) 0%, hsl(215, 15%, 40%) 50%, hsl(215, 15%, 15%) 100%)",
  ruby: "linear-gradient(135deg, hsl(346, 87%, 60%) 0%, hsl(343, 82%, 44%) 50%, hsl(338, 70%, 30%) 100%)",
  gold: "linear-gradient(135deg, hsl(53, 98%, 64%) 0%, hsl(43, 96%, 40%) 50%, hsl(35, 92%, 25%) 100%)",
  neon: "linear-gradient(135deg, hsl(75, 82%, 60%) 0%, hsl(84, 81%, 44%) 50%, hsl(142, 71%, 29%) 100%)"
}

export default function AppearancePage() {
  const { colorTheme, previewTheme, previewColorTheme, saveColorTheme, resetPreview, hasUnsavedChanges, activeTenantId } = useColorTheme()
  const { data: session } = useSession()
  
  const [saving, setSaving] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState("default")
  const [dbTemplate, setDbTemplate] = useState("default")
  const [dbPlan, setDbPlan] = useState("free")
  const [loadingConfig, setLoadingConfig] = useState(true)
  const [availableCustomThemes, setAvailableCustomThemes] = useState<any[]>([])
  
  // Dynamic Theme Settings
  const [dynamicSettings, setDynamicSettings] = useState({ primaryColor:"", secondaryColor:"", fontFamily:"", marqueeText:"", industryPreset:"corporate" })
  const [dbDynamicSettings, setDbDynamicSettings] = useState({ primaryColor:"", secondaryColor:"", fontFamily:"", marqueeText:"", industryPreset:"corporate" })

  const [isImpersonating, setIsImpersonating] = useState(false)
  useEffect(() => {
    setIsImpersonating(document.cookie.includes("impersonate-tenant="))
  }, [])
  const canChangeTheme = isImpersonating || session?.user?.tenants?.some((t: any) => 
    t.id === activeTenantId && (t.role ==="owner" || t.role ==="admin")
  ) || false
  const isSuperAdminOnly = session?.user?.isSuperAdmin && !isImpersonating
  const hasTemplateChanged = selectedTemplate !== dbTemplate
  const hasSettingsChanged = dynamicSettings.primaryColor !== dbDynamicSettings.primaryColor || 
                             dynamicSettings.secondaryColor !== dbDynamicSettings.secondaryColor || 
                             dynamicSettings.fontFamily !== dbDynamicSettings.fontFamily ||
                             dynamicSettings.marqueeText !== dbDynamicSettings.marqueeText ||
                             dynamicSettings.industryPreset !== dbDynamicSettings.industryPreset

  // Fetch template + plan langsung dari database (bukan dari JWT session yang bisa stale)
  useEffect(() => {
    const tenantId = activeTenantId || session?.user?.tenants?.[0]?.id
    if (!tenantId) return

    setLoadingConfig(true)
    fetch(`/api/tenant/theme/current?tenantId=${tenantId}`)
      .then(r => r.json())
      .then(data => {
        if (data.template) {
          setSelectedTemplate(data.template)
          setDbTemplate(data.template)
        }
        if (data.plan) {
          setDbPlan(data.plan)
        }
        if (data.settings) {
          const s = {
            primaryColor: data.settings.primaryColor ||"",
            secondaryColor: data.settings.secondaryColor ||"",
            fontFamily: data.settings.fontFamily ||"inter",
            marqueeText: data.settings.marqueeText ||"",
            industryPreset: data.settings.industryPreset || "corporate",
          }
          setDynamicSettings(s)
          setDbDynamicSettings(s)
        }
      })
      .catch(() => {})
      .finally(() => setLoadingConfig(false))

    fetch(`/api/tenant/theme/available`)
      .then(r => r.json())
      .then(data => {
        if (data.customThemes) setAvailableCustomThemes(data.customThemes)
      })
      .catch(() => {})
  }, [activeTenantId, session?.user?.tenants])

  const handleSave = async () => {
    setSaving(true)
    let tenantId = activeTenantId || session?.user?.tenants?.[0]?.id
    if (!tenantId) {
      try {
        const r = await fetch("/api/auth/session")
        tenantId = (await r.json())?.user?.tenants?.[0]?.id
      } catch {}
    }
    if (!tenantId) {
      const slug = document.cookie.match(/impersonate-tenant=([^;]+)/)?.[1]
      if (slug) {
        try { tenantId = (await (await fetch(`/api/tenant/by-slug?slug=${slug}`)).json())?.id } catch {}
      }
    }
    if (!tenantId) {
      setSaving(false)
      toast({ title:"Gagal menyimpan", description:"Bisnis tidak ditemukan.", variant:"destructive" })
      return
    }
    try {
      const res = await fetch("/api/tenant/theme", {
        method:"PUT", headers: {"Content-Type":"application/json" },
        body: JSON.stringify({ tenantId, theme: previewTheme, template: selectedTemplate, settings: dynamicSettings }),
      })
      if (res.ok) {
        const result = await res.json()
        setDbTemplate(result.template || selectedTemplate)
        setDbPlan(dbPlan) 
        setDbDynamicSettings(dynamicSettings)
        saveColorTheme(previewTheme)
        toast({ title:"Pengaturan Tersimpan ✨", description: `Tema website berhasil diperbarui ke preferensi terbaru Anda.` })
        setTimeout(() => window.location.reload(), 500)
      } else {
        const d = await res.json().catch(() => ({}))
        toast({ title:"Gagal menyimpan", description: d.error ||"Terjadi kesalahan.", variant:"destructive" })
      }
    } catch {
      toast({ title:"Gagal menyimpan", description:"Tidak dapat terhubung ke server.", variant:"destructive" })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Header Section */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-black tracking-tight text-foreground">Penampilan (Appearance)</h1>
        <p className="text-muted-foreground text-lg max-w-2xl">Personalisasi identitas visual institusi Anda untuk memberikan pengalaman pengguna divisi dunia.</p>
      </div>



      {/* 2-Column Layout for Colors and Preview */}
      <div className="grid xl:grid-cols-2 gap-6 items-start">
        {/* Pilihan Tema Palet Warna (Color Swatches) */}
        <Card className="border-border/40 shadow-sm flex flex-col h-full">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Palette className="h-5 w-5 text-primary" /> Palet Warna Dasar
            </CardTitle>
            <CardDescription>Pilih skema warna yang paling merepresentasikan energi dan identitas institusi Anda.</CardDescription>
          </CardHeader>
          <CardContent className="pt-4 flex-1">
            <div className="flex flex-wrap gap-x-6 gap-y-6 items-start">
              {themes.map(t => {
                const isSelected = previewTheme === t.id
                const isSaved = colorTheme === t.id
                const gradient = themeGradients[t.id]
                return (
                  <button 
                    key={t.id} 
                    onClick={() => {
                      if (!canChangeTheme) return toast({ title:"Akses Ditolak", description:"Hanya Admin yang dapat mengubah tema.", variant:"destructive" })
                      previewColorTheme(t.id)
                    }}
                    className="group flex flex-col items-center gap-2.5 focus:outline-none"
                  >
                    <div 
                      className={cn("relative flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full transition-all duration-300",
                        isSelected ?"ring-4 ring-primary ring-offset-4 ring-offset-background scale-110 shadow-xl" :"hover:scale-110 hover:shadow-lg ring-1 ring-black/10 dark:ring-white/10 shadow-sm"
                      )}
                      style={{ backgroundImage: gradient }}
                    >
                      {isSelected ? <Check className="h-6 w-6 text-white animate-in zoom-in duration-300 drop-shadow-md" /> : null}
                      {isSaved && !isSelected && (
                        <div className="absolute -bottom-1 -right-1 h-6 w-6 bg-background rounded-full flex items-center justify-center shadow-md border">
                          <div className="h-3.5 w-3.5 rounded-full bg-primary" />
                        </div>
                      )}
                    </div>
                    <div className="text-center">
                      <span className={cn("text-xs font-bold block transition-colors", isSelected ?"text-primary" :"text-muted-foreground group-hover:text-foreground")}>
                        {t.name}
                      </span>
                      <span className="text-[9px] text-muted-foreground uppercase tracking-widest font-semibold block mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                         {t.category}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Preview Tema Interaktif */}
        <Card className="border-border/40 shadow-sm overflow-hidden bg-card/50 backdrop-blur-sm flex flex-col h-full">
          <CardHeader className="pb-4 border-b bg-muted/20">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl btn-gradient text-white shadow-md">
                <Monitor className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg">Live Wireframe Preview</CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  {hasUnsavedChanges
                    ? <span className="text-amber-600 font-medium">Preview aktif — perubahan belum disimpan</span>
                    : <>Tema Dasar: <span className="font-bold text-primary">{themes.find(t => t.id === colorTheme)?.name || colorTheme}</span></>
                  }
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 bg-gradient-to-br from-muted/30 to-muted/10 flex-1 flex items-center justify-center">
            <div className="w-full mx-auto rounded-xl border border-border/50 overflow-hidden bg-background shadow-2xl ring-1 ring-black/5 transition-all duration-500 hover:shadow-primary/10">
              <div className="h-1.5 btn-gradient w-full flex items-center justify-center" />
              <div className="p-4 space-y-4">
                {/* Navbar Wireframe */}
                <div className="flex items-center justify-between border-b pb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-6 w-6 rounded-md btn-gradient shadow-sm flex items-center justify-center" />
                    <div className="h-2.5 w-24 rounded-full bg-foreground/80" />
                  </div>
                  <div className="flex gap-2">
                    <div className="h-2 w-8 rounded-full bg-muted-foreground/30" />
                    <div className="h-2 w-8 rounded-full bg-muted-foreground/30" />
                    <div className="h-2 w-8 rounded-full bg-primary/40 hidden sm:block" />
                  </div>
                </div>
                {/* Hero Section Wireframe */}
                <div className="h-28 rounded-xl bg-primary/10 flex flex-col items-center justify-center gap-2.5 relative overflow-hidden group">
                  <div className="absolute inset-0 opacity-10 btn-gradient transition-opacity duration-700 group-hover:opacity-20 flex items-center justify-center h-10 px-4" />
                  <div className="h-3 w-1/2 rounded-full bg-primary/80 z-10" />
                  <div className="h-2 w-2/3 rounded-full bg-muted-foreground/50 z-10" />
                  <div className="h-6 w-20 rounded-full mt-2 btn-gradient z-10 shadow-sm text-[8px] flex items-center justify-center text-white/90 font-bold tracking-wider">CTA BUTTON</div>
                </div>
                {/* Content Grid Wireframe */}
                <div className="grid grid-cols-3 gap-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="space-y-2 border border-border/50 rounded-lg p-2.5 bg-card shadow-sm hover:border-primary/30 transition-colors">
                      <div className="h-12 rounded-md bg-muted flex items-center justify-center"><Palette className="h-4 w-4 text-muted-foreground/30" /></div>
                      <div className="h-2 w-3/4 rounded-full bg-foreground/40" />
                      <div className="h-1.5 w-full rounded-full bg-muted-foreground/20" />
                      <div className="h-1.5 w-4/5 rounded-full bg-muted-foreground/20" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pilihan Layout Template */}
      <Card className="border-border/40 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <LayoutTemplate className="h-5 w-5 text-blue-500" /> Pilih Template Website
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          {loadingConfig ? (
            <div className="col-span-2 flex items-center justify-center py-12 bg-muted/20 rounded-xl border border-dashed">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground/50" />
            </div>
          ) : (
          [{
            id:"default", name:"Classic Default", 
            desc:"Desain standar elegan yang lengkap dengan slider lebar purna-layar.", 
            isPremium: false 
          },
          ...availableCustomThemes.map(ct => ({
            id: ct.id,
            name: ct.name,
            desc: `Tema eksklusif didesain oleh ${ct.author || 'Tim Kreatif'}.`,
            isPremium: false 
          }))
          ].map(tpl => {
            const isLocked = tpl.isPremium && dbPlan ==="free"
            const isActive = dbTemplate === tpl.id
            const isSelected = selectedTemplate === tpl.id

            return (
            <div key={tpl.id} onClick={() => {
              if (!canChangeTheme) return toast({ title:"Akses Ditolak", variant:"destructive" })
              if (isLocked) return toast({ title:"Fitur Terkunci", description:"Tingkatkan ke paket Premium untuk desain ini.", variant:"destructive" })
              setSelectedTemplate(tpl.id)
            }}
              className={cn("group flex flex-col rounded-2xl border-2 text-left transition-all duration-300 relative overflow-hidden cursor-pointer",
                isSelected
                  ?"border-primary bg-primary/5 ring-1 ring-primary/20 shadow-lg"
                  :"border-border/60 bg-card hover:border-primary/40 hover:shadow-md",
              )}>
              
              {/* Premium Blur Overlay */}
              {isLocked && (
                <div className="absolute inset-0 z-20 backdrop-blur-[3px] bg-background/50 flex flex-col items-center justify-center opacity-100 group-hover:backdrop-blur-md transition-all duration-500">
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-full p-3 mb-3 shadow-xl transform group-hover:scale-110 transition-transform">
                    <Crown className="h-7 w-7 text-amber-500" />
                  </div>
                  <span className="text-sm font-black text-amber-600 bg-background/90 px-4 py-1.5 rounded-full shadow-sm tracking-wide uppercase">Paket Premium</span>
                </div>
              )}

              <div className={cn("p-6 flex flex-col h-full relative z-10", isLocked &&"opacity-60 grayscale-[0.4]")}>
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <span className={cn("text-base font-black tracking-tight", isSelected ?"text-primary" :"text-foreground")}>
                      {tpl.name}
                    </span>
                    {isActive && (
                      <span className="flex items-center bg-green-500/10 text-green-600 dark:text-green-400 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider">
                        <Check className="h-3 w-3 mr-1" /> Aktif
                      </span>
                    )}
                  </div>
                  {isSelected && !isActive && (
                    <span className="bg-amber-500/10 text-amber-600 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider">
                      Pending
                    </span>
                  )}
                </div>
                
                <p className="text-sm text-muted-foreground flex-1 leading-relaxed">{tpl.desc}</p>
                
                {tpl.id !=="default" && !isLocked && (
                  <div className="mt-4 pt-4 border-t border-border/50">
                    <a href={`/theme/${tpl.id}`} target="_blank" rel="noreferrer"
                      className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 w-max"
                      onClick={(e) => e.stopPropagation()}>
                      <Monitor className="h-3 w-3" /> Live Demo
                    </a>
                  </div>
                )}
              </div>
              
              {isSelected && <div className="absolute top-0 right-0 w-16 h-16 bg-primary/10 rounded-bl-[100%] z-0" />}
            </div >
          )})
          )}
        </CardContent>
      </Card>

      {/* Advanced Typografi & Warna Kustom */}
      <Card className="border-border/40 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2"><LayoutTemplate className="h-5 w-5 text-primary" /> Arah Industri Website</CardTitle>
          <CardDescription>Preset ini menjaga komposisi dan CTA tetap profesional, sambil menyesuaikan karakter visual untuk industri Anda.</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={dynamicSettings.industryPreset} onValueChange={(industryPreset) => setDynamicSettings(p => ({ ...p, industryPreset }))}>
            <SelectTrigger className="max-w-xl rounded-xl"><SelectValue placeholder="Pilih industri" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="corporate">Corporate / B2B — kredibel dan strategis</SelectItem>
              <SelectItem value="agency">Agency — kreatif dan berani</SelectItem>
              <SelectItem value="property">Property / Construction — kuat dan terpercaya</SelectItem>
              <SelectItem value="fnb">F&B / Lifestyle — hangat dan atraktif</SelectItem>
              <SelectItem value="healthcare">Healthcare / Beauty — bersih dan menenangkan</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card className="border-border/40 shadow-sm overflow-hidden">
        <CardHeader className="bg-muted/10 border-b">
          <CardTitle className="text-lg flex items-center gap-2">
            <Type className="h-5 w-5 text-indigo-500" /> Kustomisasi Lanjutan (Advanced)
          </CardTitle>
          <CardDescription>Timpa pengaturan bawaan dengan *Brand Kit* kustom perusahaan Anda.</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid gap-8 md:grid-cols-2">
            
            {/* Color Override */}
            <div className="space-y-4 bg-muted/20 p-5 rounded-2xl border border-border/50">
              <h4 className="text-sm font-bold flex items-center gap-2 text-foreground"><Palette className="h-4 w-4 text-muted-foreground" /> Override Warna Primer & Sekunder</h4>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-background rounded-xl border shadow-sm">
                  <div className="space-y-1">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Warna Primer</Label>
                    <p className="text-[10px] text-muted-foreground">Tombol utama & tautan</p>
                  </div>
                  <div className="flex items-center gap-2 bg-muted/30 p-1 rounded-lg">
                    <Input type="color" value={dynamicSettings.primaryColor ||"#4f46e5"} onChange={(e) => setDynamicSettings(p => ({ ...p, primaryColor: e.target.value }))} className="h-8 w-10 cursor-pointer rounded bg-transparent border-0 p-0" />
                    <Input value={dynamicSettings.primaryColor ||""} placeholder="Default" onChange={(e) => setDynamicSettings(p => ({ ...p, primaryColor: e.target.value }))} className="w-24 h-8 text-xs font-mono uppercase bg-transparent border-0 focus-visible:ring-0 shadow-none px-2" />
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-background rounded-xl border shadow-sm">
                  <div className="space-y-1">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Warna Sekunder</Label>
                    <p className="text-[10px] text-muted-foreground">Aksen & sorotan</p>
                  </div>
                  <div className="flex items-center gap-2 bg-muted/30 p-1 rounded-lg">
                    <Input type="color" value={dynamicSettings.secondaryColor ||"#ec4899"} onChange={(e) => setDynamicSettings(p => ({ ...p, secondaryColor: e.target.value }))} className="h-8 w-10 cursor-pointer rounded bg-transparent border-0 p-0" />
                    <Input value={dynamicSettings.secondaryColor ||""} placeholder="Default" onChange={(e) => setDynamicSettings(p => ({ ...p, secondaryColor: e.target.value }))} className="w-24 h-8 text-xs font-mono uppercase bg-transparent border-0 focus-visible:ring-0 shadow-none px-2" />
                  </div>
                </div>
              </div>
            </div>

            {/* Typography Preview */}
            <div className="space-y-4 bg-muted/20 p-5 rounded-2xl border border-border/50 flex flex-col">
              <h4 className="text-sm font-bold flex items-center gap-2 text-foreground"><Type className="h-4 w-4 text-muted-foreground" /> Tipografi (Font Family)</h4>
              
              <Select
                value={dynamicSettings.fontFamily ||"inter"}
                onValueChange={(v) => setDynamicSettings(p => ({ ...p, fontFamily: v }))}
              >
                <SelectTrigger className="w-full h-11 rounded-xl border-border bg-background px-4 text-sm font-medium shadow-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors">
                  <SelectValue placeholder="Pilih Font" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="inter">Modern Minimalist (Inter)</SelectItem>
                  <SelectItem value="plus-jakarta">Professional (Plus Jakarta Sans)</SelectItem>
                  <SelectItem value="playfair">Klasik & Elegan (Playfair Display)</SelectItem>
                  <SelectItem value="outfit">Ceria & Kreatif (Outfit)</SelectItem>
                </SelectContent>
              </Select>
              
              <div className="mt-auto pt-4 flex-1">
                <div className="bg-background rounded-xl border p-4 shadow-sm h-full flex flex-col justify-center">
                  <div className={cn("space-y-2",
                    dynamicSettings.fontFamily ==="playfair" ?"font-serif" :
                    dynamicSettings.fontFamily ==="outfit" ?"font-sans font-bold tracking-tight" :"font-sans"
                  )}>
                    <h5 className="text-xl font-black text-foreground">Perusahaan Masa Depan</h5>
                    <p className="text-xs text-muted-foreground leading-relaxed">Pendidikan adalah senjata paling ampuh yang dapat Anda gunakan untuk mengubah dunia.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Floating Action Bar (Sticky Save) ── */}
      {canChangeTheme && (hasUnsavedChanges || hasTemplateChanged || hasSettingsChanged) && (
        <div className="fixed bottom-6 left-0 right-0 z-50 pointer-events-none flex justify-center px-4">
          <div className="pointer-events-auto bg-card/95 backdrop-blur-xl border border-primary/20 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.3)] rounded-2xl px-5 py-4 max-w-lg w-full flex items-center justify-between animate-in slide-in-from-bottom-5">
            <div className="flex items-center gap-3">
              <span className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-20"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
              </span>
              <p className="text-sm font-bold text-foreground">
                Perubahan tertunda
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="rounded-xl hover:bg-muted" onClick={() => {
                resetPreview()
                setSelectedTemplate(dbTemplate)
                setDynamicSettings(dbDynamicSettings)
              }}>
                Batal
              </Button>
              <Button size="sm" className="rounded-xl btn-gradient text-white border-0 shadow-lg shadow-primary/25 flex items-center justify-center h-10 px-4" onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Terapkan Tema
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
