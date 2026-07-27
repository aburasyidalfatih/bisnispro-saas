"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { BadgeCheck, Globe2, Loader2, Save, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/hooks/use-toast"

type ExportProfile = {
  enabled: boolean; primaryLocale: "id" | "en"; targetMarkets: string[]; currency: string; legalEntity: string
  minimumOrder: string; productionCapacity: string; leadTime: string; incoterms: string; paymentTerms: string
  certifications: string[]; exportCountries: string[]; catalogueUrl: string; companyProfileUrl: string; responseSla: string
}

const defaults: ExportProfile = { enabled: false, primaryLocale: "en", targetMarkets: [], currency: "USD", legalEntity: "", minimumOrder: "", productionCapacity: "", leadTime: "", incoterms: "", paymentTerms: "", certifications: [], exportCountries: [], catalogueUrl: "", companyProfileUrl: "", responseSla: "Within 1 business day" }
const listValue = (value: string) => value.split(",").map(item => item.trim()).filter(Boolean)

export default function ExportReadinessPage() {
  const { data: session } = useSession()
  const tenantId = (session?.user as any)?.tenants?.[0]?.id as string | undefined
  const [profile, setProfile] = useState<ExportProfile>(defaults)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => { if (!tenantId) return; fetch(`/api/tenant/theme/current?tenantId=${tenantId}`).then(r => r.json()).then(data => setProfile({ ...defaults, ...(data.settings?.exportProfile || {}) })).catch(() => toast({ title: "Gagal memuat", description: "Pengaturan ekspor tidak dapat dimuat.", variant: "destructive" })).finally(() => setLoading(false)) }, [tenantId])
  const set = <K extends keyof ExportProfile>(key: K, value: ExportProfile[K]) => setProfile(current => ({ ...current, [key]: value }))
  async function save() {
    if (!tenantId) return
    setSaving(true)
    try {
      const response = await fetch("/api/tenant/theme", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tenantId, settings: { exportProfile: profile } }) })
      if (!response.ok) throw new Error()
      toast({ title: "Export readiness tersimpan", description: "Capability dan RFQ internasional tenant telah diperbarui." })
    } catch { toast({ title: "Gagal menyimpan", description: "Coba lagi beberapa saat.", variant: "destructive" }) } finally { setSaving(false) }
  }
  if (loading) return <div className="flex min-h-64 items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>
  return <div className="mx-auto max-w-5xl space-y-6 pb-12">
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm font-bold uppercase tracking-wider text-primary">Global commerce</p><h1 className="text-3xl font-black tracking-tight">Export Readiness</h1><p className="mt-2 text-muted-foreground">Tampilkan bukti kapabilitas B2B internasional dan arahkan buyer ke RFQ.</p></div><Button onClick={save} disabled={saving} className="gap-2 rounded-xl">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}Simpan</Button></div>
    <Card><CardHeader><div className="flex items-center gap-3"><Globe2 className="h-5 w-5 text-primary" /><div><CardTitle>Aktifkan mode ekspor</CardTitle><CardDescription>Menambahkan capability section dan halaman publik /export untuk tenant.</CardDescription></div></div></CardHeader><CardContent className="flex items-center justify-between gap-6"><div><p className="font-semibold">International buyer experience</p><p className="text-sm text-muted-foreground">Gunakan bahasa Inggris sebagai bahasa utama untuk copy capability dan RFQ.</p></div><Switch checked={profile.enabled} onCheckedChange={checked => set("enabled", checked)} aria-label="Aktifkan mode ekspor" /></CardContent></Card>
    <div className="grid gap-6 lg:grid-cols-2">
      <Card><CardHeader><CardTitle>Profil perdagangan</CardTitle><CardDescription>Data yang membantu buyer menilai kesiapan komersial Anda.</CardDescription></CardHeader><CardContent className="space-y-4"><div className="space-y-2"><Label>Bahasa utama experience ekspor</Label><select value={profile.primaryLocale} onChange={event => set("primaryLocale", event.target.value as "id" | "en")} className="h-10 w-full rounded-md border bg-background px-3 text-sm"><option value="en">English</option><option value="id">Bahasa Indonesia</option></select></div><Field label="Legal entity / company name" value={profile.legalEntity} onChange={value => set("legalEntity", value)} placeholder="PT Example Indonesia" /><Field label="Markets served" value={profile.exportCountries.join(", ")} onChange={value => set("exportCountries", listValue(value))} placeholder="Singapore, Australia, United States" /><div className="grid gap-4 sm:grid-cols-2"><Field label="Currency" value={profile.currency} onChange={value => set("currency", value.toUpperCase())} placeholder="USD" /><Field label="Response SLA" value={profile.responseSla} onChange={value => set("responseSla", value)} placeholder="Within 1 business day" /></div><div className="grid gap-4 sm:grid-cols-2"><Field label="Minimum order (MOQ)" value={profile.minimumOrder} onChange={value => set("minimumOrder", value)} placeholder="500 units" /><Field label="Lead time" value={profile.leadTime} onChange={value => set("leadTime", value)} placeholder="14-21 days" /></div><Field label="Production capacity" value={profile.productionCapacity} onChange={value => set("productionCapacity", value)} placeholder="50,000 units/month" /></CardContent></Card>
      <Card><CardHeader><CardTitle>Trust & documentation</CardTitle><CardDescription>Informasi yang buyer harapkan sebelum meminta quotation.</CardDescription></CardHeader><CardContent className="space-y-4"><Field label="Certifications" value={profile.certifications.join(", ")} onChange={value => set("certifications", listValue(value))} placeholder="ISO 9001, HACCP, Halal" /><div className="grid gap-4 sm:grid-cols-2"><Field label="Incoterms" value={profile.incoterms} onChange={value => set("incoterms", value)} placeholder="FOB Jakarta, CIF" /><Field label="Payment terms" value={profile.paymentTerms} onChange={value => set("paymentTerms", value)} placeholder="T/T 30/70" /></div><Field label="Catalogue URL" value={profile.catalogueUrl} onChange={value => set("catalogueUrl", value)} placeholder="https://.../catalogue.pdf" /><Field label="Company profile URL" value={profile.companyProfileUrl} onChange={value => set("companyProfileUrl", value)} placeholder="https://.../company-profile.pdf" /><div className="rounded-xl bg-muted p-4 text-sm text-muted-foreground"><ShieldCheck className="mr-2 inline h-4 w-4 text-primary" />Tampilkan hanya klaim sertifikasi yang dapat dibuktikan dengan dokumen resmi.</div></CardContent></Card>
    </div>
    <Card className="border-primary/20 bg-primary/5"><CardContent className="flex gap-3 p-5 text-sm"><BadgeCheck className="h-5 w-5 shrink-0 text-primary" /><p>Setelah aktif, tenant mendapatkan section capability pada halaman utama dan halaman <strong>/export</strong> yang memuat RFQ berbahasa Inggris.</p></CardContent></Card>
  </div>
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder: string }) { return <div className="space-y-2"><Label>{label}</Label><Input value={value} onChange={event => onChange(event.target.value)} placeholder={placeholder} /></div> }
