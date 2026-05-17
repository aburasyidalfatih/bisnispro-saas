"use client"

import { useState, useEffect } from "react"
import { useTheme } from "next-themes"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useColorTheme } from "@/components/providers/color-theme-provider"
import { themes } from "@/lib/themes"
import { Check, Sun, Moon, Monitor, Palette, Info, Save, RotateCcw, LayoutTemplate, Lock, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"

const themeGradients: Record<string, string> = {
  corporate: "from-blue-700 to-blue-900",
  ocean:     "from-cyan-500 to-teal-600",
  emerald:   "from-emerald-500 to-green-600",
  sunset:    "from-orange-500 to-rose-500",
  aurora:    "from-violet-500 to-purple-600",
  cyberpunk: "from-cyan-400 to-fuchsia-500",
  midnight:  "from-blue-600 to-indigo-800",
  hologram:  "from-cyan-400 to-pink-500",
}

export default function AppearancePage() {
  const { theme: darkMode, setTheme: setDarkMode } = useTheme()
  const { colorTheme, previewTheme, previewColorTheme, saveColorTheme, resetPreview, hasUnsavedChanges, activeTenantId } = useColorTheme()
  const { data: session } = useSession()
  
  const [saving, setSaving] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState("default")
  const [dbTemplate, setDbTemplate] = useState("default")
  const [dbPlan, setDbPlan] = useState("free")
  const [loadingConfig, setLoadingConfig] = useState(true)
  
  const isImpersonating = typeof document !== "undefined" && document.cookie.includes("impersonate-tenant=")
  const canChangeTheme = isImpersonating || session?.user?.tenants?.some((t: any) => 
    t.id === activeTenantId && (t.role === "owner" || t.role === "admin")
  ) || false
  const isSuperAdminOnly = session?.user?.isSuperAdmin && !isImpersonating
  const hasTemplateChanged = selectedTemplate !== dbTemplate

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
      })
      .catch(() => {})
      .finally(() => setLoadingConfig(false))
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
      toast({ title: "Gagal menyimpan", description: "Tenant tidak ditemukan.", variant: "destructive" })
      return
    }
    try {
      const res = await fetch("/api/tenant/theme", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId, theme: previewTheme, template: selectedTemplate }),
      })
      if (res.ok) {
        const result = await res.json()
        // Update state lokal langsung tanpa reload
        setDbTemplate(result.template || selectedTemplate)
        setDbPlan(dbPlan) // plan tidak berubah
        toast({ title: "Tema disimpan ✅", description: `Template: ${selectedTemplate === "modern" ? "Modern Corporate" : "Classic Default"} | Warna: ${themes.find(t => t.id === previewTheme)?.name || previewTheme}` })
        // Reload untuk refresh session dan semua provider
        window.location.reload()
      } else {
        const d = await res.json().catch(() => ({}))
        toast({ title: "Gagal menyimpan", description: d.error || "Terjadi kesalahan.", variant: "destructive" })
      }
    } catch {
      toast({ title: "Gagal menyimpan", description: "Tidak dapat terhubung ke server.", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Tampilan & Tema</h1>
        <p className="text-muted-foreground mt-1">Sesuaikan tampilan aplikasi sesuai selera Anda.</p>
      </div>

      {/* Info banner */}
      <Card className="glass border-0">
        <CardContent className="flex items-start gap-3 p-4">
          <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <p className="text-sm text-muted-foreground">
            {isSuperAdminOnly
              ? "Login sebagai Super Admin. Gunakan fitur \"Login Sebagai\" untuk mengubah tema tenant."
              : canChangeTheme
              ? "Pilih tema lalu klik Simpan untuk menerapkan ke semua pengguna di lembaga ini."
              : "Hanya Owner dan Admin yang dapat mengubah tema lembaga."}
          </p>
        </CardContent>
      </Card>

      {/* Preview Tema — satu baris */}
      <div className="grid gap-4">

        {/* Preview Tema */}
        <Card className="glass border-0">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <Palette className="h-4 w-4 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">Preview Tema</CardTitle>
                <CardDescription className="text-xs">
                  {hasUnsavedChanges
                    ? <span className="text-amber-600 font-medium">Preview aktif — belum disimpan</span>
                    : <>Aktif: <span className="font-semibold text-primary">{themes.find(t => t.id === colorTheme)?.name || colorTheme}</span></>
                  }
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-xl border overflow-hidden">
              <div className="h-2 btn-gradient" />
              <div className="p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg btn-gradient" />
                  <div className="flex-1 space-y-1">
                    <div className="h-2 w-2/3 rounded bg-foreground/10" />
                    <div className="h-1.5 w-1/2 rounded bg-muted-foreground/10" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  <div className="h-10 rounded-lg bg-primary/10" />
                  <div className="h-10 rounded-lg bg-accent" />
                  <div className="h-10 rounded-lg bg-muted" />
                </div>
                <div className="flex gap-1.5">
                  <div className="h-6 flex-1 rounded-lg btn-gradient" />
                  <div className="h-6 flex-1 rounded-lg border bg-background" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pilihan Layout Template */}
      <Card className="glass border-0">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
              <LayoutTemplate className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-base">Pilih Layout Template</CardTitle>
              <CardDescription className="text-xs">Ubah struktur dan desain utama website sekolah Anda.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {loadingConfig ? (
            <div className="col-span-2 flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
          [{
            id: "default", name: "Classic Default", 
            desc: "Desain standar yang lengkap dengan slider lebar.", 
            isPremium: false 
          }].map(tpl => {
            const isLocked = tpl.isPremium && dbPlan === "free"
            const isActive = dbTemplate === tpl.id
            const isSelected = selectedTemplate === tpl.id

            return (
            <button key={tpl.id} onClick={() => {
              if (!canChangeTheme) {
                toast({ title: "Tidak punya izin", description: "Hanya Owner/Admin yang dapat mengubah template.", variant: "destructive" })
                return
              }
              if (isLocked) {
                toast({ title: "Fitur Premium", description: "Silakan upgrade ke paket Pro/Enterprise untuk menggunakan template ini.", variant: "destructive" })
                return
              }
              setSelectedTemplate(tpl.id)
            }}
              className={cn(
                "flex items-start gap-3 rounded-xl border-2 p-4 text-left transition-all duration-150 relative overflow-hidden",
                isSelected
                  ? "border-blue-500 bg-blue-50/50 dark:bg-blue-500/10"
                  : "border-transparent bg-muted/30 hover:bg-muted/60 hover:border-border",
                isLocked && "opacity-75 bg-muted/50 grayscale-[0.5]"
              )}>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={cn("text-sm font-bold", isSelected ? "text-blue-700 dark:text-blue-400" : "text-foreground")}>
                    {tpl.name}
                  </span>
                  {isLocked && (
                    <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                      <Lock className="h-3 w-3" /> Premium
                    </span>
                  )}
                  {isActive && (
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700 dark:bg-green-900/30 dark:text-green-400">Aktif</span>
                  )}
                  {isSelected && !isActive && (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">Belum Disimpan</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{tpl.desc}</p>
                {isLocked && (
                  <p className="text-xs font-semibold text-amber-600 mt-2">⭐ Upgrade ke Pro untuk membuka desain ini.</p>
                )}
              </div>
              {isSelected && (
                <div className="absolute top-4 right-4 text-blue-600"><Check className="h-5 w-5" /></div>
              )}
            </button>
          )})
          )}
        </CardContent>
      </Card>

      {/* Pilihan Tema — satu card memanjang */}
      <Card className="glass border-0">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Palette className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">Pilih Tema Warna</CardTitle>
              <CardDescription className="text-xs">Klik tema untuk preview, lalu simpan untuk menerapkan</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {themes.map(t => {
            const isSelected = previewTheme === t.id
            const isSaved = colorTheme === t.id
            const gradient = themeGradients[t.id]
            return (
              <button key={t.id} onClick={() => {
                if (!canChangeTheme) {
                  toast({ title: "Tidak punya izin", description: "Hanya Owner/Admin yang dapat mengubah tema.", variant: "destructive" })
                  return
                }
                previewColorTheme(t.id)
              }}
                className={cn(
                  "flex items-center gap-3 rounded-xl border-2 px-3 py-2.5 text-left transition-all duration-150",
                  isSelected
                    ? "border-primary bg-primary/5"
                    : "border-transparent bg-muted/30 hover:bg-muted/60 hover:border-border"
                )}>
                {/* Swatch */}
                <div className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-base",
                  gradient
                )}>
                  {isSelected ? <Check className="h-4 w-4 text-white" /> : t.preview}
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={cn("text-sm font-semibold", isSelected ? "text-primary" : "text-foreground")}>
                      {t.name}
                    </span>
                    {isSaved && (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">Aktif</span>
                    )}
                    {isSelected && !isSaved && (
                      <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-600">Preview</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{t.description}</p>
                </div>
                {/* Category badge */}
                <span className="text-[10px] text-muted-foreground shrink-0 hidden sm:block">
                  {t.category === "formal" ? "🏢" : t.category === "modern" ? "✨" : t.category === "creative" ? "🎨" : "⚡"}
                </span>
              </button>
            )
          })}
        </CardContent>
      </Card>

      {/* ── Sticky Save Bar (selalu terlihat saat ada perubahan) ── */}
      {canChangeTheme && (hasUnsavedChanges || hasTemplateChanged) && (
        <div className="sticky bottom-0 z-50 -mx-4 sm:-mx-6 lg:-mx-8">
          <div className="bg-card/95 backdrop-blur-lg border-t border-border shadow-[0_-4px_20px_rgba(0,0,0,0.1)] px-4 sm:px-6 py-3">
            <div className="flex items-center justify-between max-w-3xl mx-auto">
              <p className="text-sm text-muted-foreground hidden sm:block">
                <span className="inline-block h-2 w-2 rounded-full bg-amber-500 mr-2 animate-pulse" />
                Ada perubahan yang belum disimpan
              </p>
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <Button variant="outline" size="sm" className="rounded-xl gap-2" onClick={() => {
                  resetPreview()
                  setSelectedTemplate(dbTemplate)
                }}>
                  <RotateCcw className="h-3.5 w-3.5" /> Batal
                </Button>
                <Button size="sm" className="rounded-xl gap-2 btn-gradient text-white border-0" onClick={handleSave} disabled={saving}>
                  {saving ? <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <Save className="h-3.5 w-3.5" />}
                  Simpan Perubahan
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
