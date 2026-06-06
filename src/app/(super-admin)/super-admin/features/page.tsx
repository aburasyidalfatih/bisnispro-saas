"use client"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "@/hooks/use-toast"
import {
  Shield, Globe, Users, UserPlus, GraduationCap, CalendarCheck,
  Wallet, Store, Heart, FileText, Megaphone, MessageSquare,
  CreditCard, BrainCircuit, Mail, ClipboardList, User,
  BarChart3, ToggleLeft, ToggleRight, CheckCircle2, Loader2,
  Zap, Crown, Sparkles,
  type LucideIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface FeatureItem {
  key: string
  label: string
  description: string
  icon: LucideIcon
  category: string
}

const FEATURE_LIST: FeatureItem[] = [
  // Konten & Website
  { key: "website_content", label: "Konten Website", description: "Beranda, slider, artikel, galeri, profil sekolah, popup, dll.", icon: Globe, category: "Konten & Website" },
  { key: "dashboard_analytics", label: "Dashboard & Analytics", description: "Akses ke dashboard utama dan grafik analitik.", icon: BarChart3, category: "Konten & Website" },
  
  // Data & Manajemen
  { key: "data_master", label: "Data Master", description: "Data admin, guru, siswa, orang tua, kelas, dan mata pelajaran.", icon: Users, category: "Data & Manajemen" },
  { key: "ppdb", label: "PPDB Online", description: "Penerimaan peserta didik baru secara online.", icon: UserPlus, category: "Data & Manajemen" },
  { key: "akademik", label: "Akademik", description: "Jadwal pelajaran, e-rapor, dan catatan perilaku (BK).", icon: GraduationCap, category: "Akademik & Kehadiran" },
  { key: "kehadiran", label: "Kehadiran", description: "Absensi siswa, guru, dan pengajuan izin.", icon: CalendarCheck, category: "Akademik & Kehadiran" },
  
  // Keuangan
  { key: "keuangan", label: "Keuangan & Kas", description: "Tagihan SPP, tabungan, cashflow, dan jenis tagihan.", icon: Wallet, category: "Keuangan" },
  { key: "e_kantin", label: "E-Kantin", description: "Sistem kantin digital, merchant, dan pembayaran.", icon: Store, category: "Keuangan" },
  { key: "donasi", label: "Donasi & Infaq", description: "Kampanye penggalangan dana dan donasi online.", icon: Heart, category: "Keuangan" },
  { key: "payment_gateway", label: "Payment Gateway", description: "Integrasi pembayaran otomatis (Tripay, dll).", icon: CreditCard, category: "Keuangan" },
  
  // Komunikasi
  { key: "whatsapp_gateway", label: "WhatsApp Gateway", description: "Kirim notifikasi otomatis via WhatsApp.", icon: MessageSquare, category: "Komunikasi" },
  { key: "broadcast_wa", label: "Broadcast WA", description: "Kirim pesan massal ke orang tua dan guru.", icon: Megaphone, category: "Komunikasi" },
  { key: "email_smtp", label: "Email SMTP", description: "Konfigurasi pengiriman email dari server sendiri.", icon: Mail, category: "Komunikasi" },
  
  // Fitur Lanjutan
  { key: "laporan", label: "Laporan", description: "Dashboard laporan dan ekspor data.", icon: FileText, category: "Fitur Lanjutan" },
  { key: "custom_domain", label: "Custom Domain", description: "Gunakan domain sendiri (.sch.id, dll).", icon: Globe, category: "Fitur Lanjutan" },
  { key: "ai_settings", label: "Kecerdasan Buatan (AI)", description: "Asisten AI untuk konten dan analisis.", icon: BrainCircuit, category: "Fitur Lanjutan" },
  { key: "audit_log", label: "Audit Log", description: "Riwayat aktivitas dan perubahan data.", icon: ClipboardList, category: "Fitur Lanjutan" },
  { key: "portal_orangtua", label: "Portal Orang Tua", description: "Akses mandiri bagi orang tua/wali murid.", icon: User, category: "Fitur Lanjutan" },
]

const PLAN_META = [
  { key: "free", label: "Free", icon: Zap, color: "from-slate-500 to-slate-600", bg: "bg-slate-500/10", text: "text-slate-600", border: "border-slate-200", ring: "ring-slate-300" },
  { key: "lite", label: "Lite", icon: Sparkles, color: "from-blue-500 to-indigo-600", bg: "bg-blue-500/10", text: "text-blue-600", border: "border-blue-200", ring: "ring-blue-300" },
  { key: "pro", label: "Pro", icon: Crown, color: "from-amber-500 to-orange-600", bg: "bg-amber-500/10", text: "text-amber-600", border: "border-amber-200", ring: "ring-amber-300" },
]

const CATEGORIES = [...new Set(FEATURE_LIST.map(f => f.category))]

export default function FeaturesControlPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [features, setFeatures] = useState<Record<string, Record<string, boolean>>>({})

  useEffect(() => {
    fetch("/api/super-admin/features")
      .then(res => res.json())
      .then(data => {
        setFeatures(data)
        setLoading(false)
      })
      .catch(() => {
        toast({ title: "Gagal memuat data fitur", variant: "destructive" })
        setLoading(false)
      })
  }, [])

  const toggleFeature = async (plan: string, featureKey: string) => {
    const newFeatures = {
      ...features,
      [plan]: {
        ...features[plan],
        [featureKey]: !features[plan]?.[featureKey],
      },
    }
    setFeatures(newFeatures)

    // Auto save
    setSaving(true)
    try {
      const res = await fetch("/api/super-admin/features", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newFeatures),
      })
      if (!res.ok) throw new Error()
    } catch {
      toast({ title: "Gagal menyimpan", variant: "destructive" })
      // Revert
      setFeatures(features)
    } finally {
      setSaving(false)
    }
  }

  const toggleAllForPlan = async (plan: string, value: boolean) => {
    const newPlanFeatures: Record<string, boolean> = {}
    FEATURE_LIST.forEach(f => { newPlanFeatures[f.key] = value })
    
    const newFeatures = { ...features, [plan]: newPlanFeatures }
    setFeatures(newFeatures)

    setSaving(true)
    try {
      const res = await fetch("/api/super-admin/features", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newFeatures),
      })
      if (!res.ok) throw new Error()
      toast({ title: value ? "Semua fitur diaktifkan" : "Semua fitur dimatikan", description: `Paket ${plan.toUpperCase()}` })
    } catch {
      toast({ title: "Gagal menyimpan", variant: "destructive" })
      setFeatures(features)
    } finally {
      setSaving(false)
    }
  }

  const countEnabled = (plan: string) => {
    if (!features[plan]) return 0
    return Object.values(features[plan]).filter(Boolean).length
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Memuat konfigurasi fitur...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            Kendali Fitur Platform
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Kontrol fitur mana yang tersedia untuk setiap paket langganan. Perubahan akan langsung diterapkan.
          </p>
        </div>
        {saving && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground animate-pulse">
            <Loader2 className="h-4 w-4 animate-spin" />
            Menyimpan...
          </div>
        )}
      </div>

      {/* Plan Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {PLAN_META.map(plan => {
          const Icon = plan.icon
          const enabled = countEnabled(plan.key)
          const total = FEATURE_LIST.length
          return (
            <Card key={plan.key} className={cn("glass border-0 overflow-hidden relative")}>
              <div className={cn("absolute inset-x-0 top-0 h-1 bg-gradient-to-r", plan.color)} />
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={cn("flex h-9 w-9 items-center justify-center rounded-xl", plan.bg)}>
                      <Icon className={cn("h-4 w-4", plan.text)} />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm">Paket {plan.label}</h3>
                      <p className="text-[10px] text-muted-foreground">{enabled}/{total} fitur aktif</p>
                    </div>
                  </div>
                  <div className={cn("text-2xl font-black", plan.text)}>
                    {Math.round((enabled / total) * 100)}%
                  </div>
                </div>
                {/* Progress bar */}
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div 
                    className={cn("h-full rounded-full bg-gradient-to-r transition-all duration-500", plan.color)}
                    style={{ width: `${(enabled / total) * 100}%` }}
                  />
                </div>
                <div className="flex gap-2 mt-3">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 text-xs h-8 rounded-lg"
                    onClick={() => toggleAllForPlan(plan.key, true)}
                  >
                    <CheckCircle2 className="h-3 w-3 mr-1" /> Aktifkan Semua
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 text-xs h-8 rounded-lg text-muted-foreground"
                    onClick={() => toggleAllForPlan(plan.key, false)}
                  >
                    Matikan Semua
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Feature Grid */}
      {CATEGORIES.map(category => (
        <Card key={category} className="glass border-0">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{category}</CardTitle>
            <CardDescription className="text-xs">Kelola akses fitur {category.toLowerCase()} per paket.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b">
                    <TableHead className="text-left text-xs font-medium text-muted-foreground pb-3 pr-4 w-[40%]">Fitur</TableHead>
                    {PLAN_META.map(plan => {
                      const Icon = plan.icon
                      return (
                        <TableHead key={plan.key} className="text-center text-xs font-medium pb-3 px-2 w-[20%]">
                          <div className="flex items-center justify-center gap-1">
                            <Icon className={cn("h-3.5 w-3.5", plan.text)} />
                            <span className={plan.text}>{plan.label}</span>
                          </div>
                        </TableHead>
                      )
                    })}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {FEATURE_LIST.filter(f => f.category === category).map(feature => {
                    const Icon = feature.icon
                    return (
                      <TableRow key={feature.key} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                        <TableCell className="py-3 pr-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted">
                              <Icon className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div>
                              <p className="text-sm font-medium">{feature.label}</p>
                              <p className="text-[11px] text-muted-foreground line-clamp-1">{feature.description}</p>
                            </div>
                          </div>
                        </TableCell>
                        {PLAN_META.map(plan => {
                          const isEnabled = features[plan.key]?.[feature.key] ?? false
                          return (
                            <TableCell key={plan.key} className="py-3 px-2 text-center">
                              <Button
                                onClick={() => toggleFeature(plan.key, feature.key)}
                                className={cn(
                                  "inline-flex items-center justify-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-200",
                                  isEnabled
                                    ? "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 ring-1 ring-emerald-500/20"
                                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                                )}
                              >
                                {isEnabled ? (
                                  <><ToggleRight className="h-4 w-4" /> ON</>
                                ) : (
                                  <><ToggleLeft className="h-4 w-4" /> OFF</>
                                )}
                              </Button>
                            </TableCell>
                          )
                        })}
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
