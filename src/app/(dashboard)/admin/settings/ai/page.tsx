"use client"

import { useEffect, useState } from"react"
import { useSession } from"next-auth/react"
import { useRouter } from"next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from"@/components/ui/card"
import { Button } from"@/components/ui/button"
import { Input } from"@/components/ui/input"
import { Label } from"@/components/ui/label"
import { Switch } from"@/components/ui/switch"
import { toast } from"@/hooks/use-toast"
import { BrainCircuit, Key, Save, Loader2, Sparkles, Coins, History, User, Zap, CheckCircle2, ArrowRight } from"lucide-react"
import { cn } from"@/lib/utils"

// Removed hardcoded AI_PACKAGES

export default function AiSettingsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [tenantId, setTenantId] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    aiTokens: 0,
  })

  const [checkingOutAi, setCheckingOutAi] = useState(false)
  const [selectedAiPkg, setSelectedAiPkg] = useState<string>("")
  const [aiPackages, setAiPackages] = useState<any[]>([])

  const [logs, setLogs] = useState<any[]>([])
  const [logsLoading, setLogsLoading] = useState(true)

  // Resolve tenantId & plan
  useEffect(() => {
    const tenants = session?.user?.tenants || []
    const id = tenants?.[0]?.id
    if (id) { setTenantId(id); return }
    const match = document.cookie.match(/impersonate-tenant=([^;]+)/)
    const slug = match?.[1]
    if (slug) {
      fetch(`/api/tenant/by-slug?slug=${slug}`).then(r => r.json()).then(d => { if (d.id) setTenantId(d.id) })
    }
  }, [session?.user?.tenants])

  const currentTenant = session?.user?.tenants?.find((t: any) => t.id === tenantId) || session?.user?.tenants?.[0]
  const tenantPlan = currentTenant?.plan ||"free"
  const isFreePlan = tenantPlan ==="free"

  useEffect(() => {
    if (!tenantId) return
    fetch(`/api/tenant/ai-settings?tenantId=${tenantId}`)
      .then(res => res.json())
      .then(data => {
        setFormData({
          aiTokens: (data.aiTokens || 0) + (data.aiAddonTokens || 0),
        })
        setLoading(false)
      })
      .catch(() => {
        toast({ title:"Error", description:"Gagal memuat pengaturan AI", variant:"destructive" })
        setLoading(false)
      })
      
    fetch(`/api/tenant/ai-settings/logs?tenantId=${tenantId}`)
      .then(res => res.json())
      .then(data => {
        setLogs(data.data || [])
        setLogsLoading(false)
      })
      .catch(() => setLogsLoading(false))

    fetch(`/api/tenant/ai-packages`)
      .then(res => res.json())
      .then(data => {
        setAiPackages(data || [])
        if (data && data.length > 0) {
          setSelectedAiPkg(data[0].id)
        }
      })
      .catch(() => {})
  }, [tenantId])



  const handleCheckoutAi = async () => {
    setCheckingOutAi(true)
    try {
      const res = await fetch("/api/tenant/billing/topup-ai", {
        method:"POST",
        headers: {"Content-Type":"application/json" },
        body: JSON.stringify({ packageId: selectedAiPkg }),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error ||"Gagal membuat invoice AI")
      
      toast({ title:"Berhasil", description:"Invoice Top Up Token AI berhasil dibuat. Silakan selesaikan pembayaran." })
      router.push("/admin/billing/history")
    } catch (err: any) {
      toast({ title:"Error", description: err.message, variant:"destructive" })
    } finally {
      setCheckingOutAi(false)
    }
  }

  if (loading) {
    return <div className="flex h-40 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Pengaturan Kecerdasan Buatan (AI)</h1>
        <p className="text-muted-foreground mt-1">Kelola penggunaan AI dan API Key untuk fitur otomatisasi sekolah.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="glass border-0 flex flex-col justify-center items-center text-center py-8">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mb-4">
             <Coins className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-xl mb-2">Sisa Kuota Token AI</CardTitle>
          <CardDescription className="mb-6 max-w-[250px] mx-auto">Digunakan untuk fitur otomatisasi, pembuatan soal CBT, dan asisten RPP.</CardDescription>
          <div className="text-5xl font-black text-primary bg-primary/5 px-8 py-5 rounded-3xl border border-primary/10 shadow-inner">
            {formData.aiTokens.toLocaleString("id-ID")}
          </div>
        </Card>

        {/* ── Card Top Up Token AI ── */}
        <Card className="glass border-0 overflow-hidden relative lg:col-span-2">
          <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
            <Zap className="h-40 w-40" />
          </div>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10">
                <Zap className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <CardTitle>Top-Up Token AI</CardTitle>
                <CardDescription>Beli kuota tambahan untuk layanan Kecerdasan Buatan (AI) di SchoolPro.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col h-[calc(100%-80px)]">
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6 flex-1">
              {aiPackages.map((pkg) => (
                <div 
                  key={pkg.id}
                  onClick={() => setSelectedAiPkg(pkg.id)}
                  className={cn("cursor-pointer rounded-2xl border-2 p-5 transition-all relative overflow-hidden group flex flex-col",
                    selectedAiPkg === pkg.id 
                      ?"border-blue-500 bg-blue-500/5 shadow-md shadow-blue-500/10" 
                      :"border-border/40 hover:border-blue-500/50 hover:bg-muted/50"
                  )}
                >
                  {selectedAiPkg === pkg.id && (
                    <div className="absolute top-3 right-3 text-blue-500">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                  )}
                  <p className="text-muted-foreground font-semibold text-sm mb-1">{pkg.name}</p>
                  <div className="flex items-end gap-1 text-foreground mb-4">
                    <span className="text-sm font-semibold">Rp</span>
                    <span className="text-2xl font-bold">{pkg.price.toLocaleString("id-ID")}</span>
                  </div>
                  <div className="mt-auto pt-2">
                    <div className="inline-flex items-center gap-1.5 bg-blue-500/10 text-blue-600 font-semibold px-3 py-1.5 rounded-full text-xs">
                      <Zap className="h-3.5 w-3.5" />
                      {pkg.tokens.toLocaleString("id-ID")} Token
                    </div>
                  </div>
                </div>
              ))}
              {aiPackages.length === 0 && (
                <div className="col-span-full flex items-center justify-center text-muted-foreground italic p-4 border rounded-xl h-32">
                  Belum ada paket AI yang tersedia.
                </div>
              )}
            </div>
            <div className="flex justify-end pt-4 border-t border-border/50">
              <Button 
                className="h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white border-0 gap-2 font-semibold min-w-[200px]"
                disabled={checkingOutAi || !selectedAiPkg}
                onClick={handleCheckoutAi}
              >
                {checkingOutAi ?"Memproses..." :"Beli Token AI"}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>


      <Card className="glass border-0">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
              <History className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Riwayat Penggunaan AI</CardTitle>
              <CardDescription>Catatan aktivitas penggunaan fitur AI oleh guru dan staf.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="text-left font-medium p-3 text-muted-foreground">Waktu</th>
                  <th className="text-left font-medium p-3 text-muted-foreground">Pengguna</th>
                  <th className="text-left font-medium p-3 text-muted-foreground">Fitur</th>
                  <th className="text-right font-medium p-3 text-muted-foreground">Token Digunakan</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {logsLoading ? (
                  <tr><td colSpan={4} className="p-4 text-center text-muted-foreground">Memuat data...</td></tr>
                ) : logs.length === 0 ? (
                  <tr><td colSpan={4} className="p-8 text-center text-muted-foreground italic">Belum ada riwayat penggunaan AI.</td></tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                      <td className="p-3 whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="h-3 w-3 text-primary" />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-medium">{log.user?.name ||"Unknown"}</span>
                            <span className="text-[10px] text-muted-foreground">{log.user?.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                          {log.feature}
                        </span>
                      </td>
                      <td className="p-3 text-right font-mono font-medium text-primary">
                        {log.tokens.toLocaleString('id-ID')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
