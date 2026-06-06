"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Heart, Wallet, Loader2, Target, Users, ArrowRight } from "lucide-react"
import { format } from "date-fns"
import { id as localeId } from "date-fns/locale"
import { normalizeImageUrl } from "@/lib/utils"

export default function OrtuDonasiPage() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const tenant = session?.user?.tenants?.[0]
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [donating, setDonating] = useState<string | null>(null)
  const [amounts, setAmounts] = useState<Record<string, number>>({})

  useEffect(() => {
    if (!tenant) return
    fetch(`/api/donation/campaigns?tenantId=${tenant.id}`)
      .then(r => r.json())
      .then(data => setCampaigns((Array.isArray(data) ? data : []).filter((c: any) => c.isActive)))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [tenant])

  const handleDonate = async (campaign: any) => {
    const amount = amounts[campaign.id]
    if (!amount || amount < 1000) return toast({ title: "Nominal minimal Rp 1.000", variant: "destructive" })
    if (!tenant) return

    setDonating(campaign.id)
    try {
      const res = await fetch("/api/donation/donate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId: campaign.id,
          tenantId: tenant.id,
          donorName: session?.user?.name || "Donatur",
          donorEmail: session?.user?.email,
          amount,
          method: "WALLET",
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast({ title: "Terima kasih! Donasi berhasil dikirim 🎉" })
      setAmounts(prev => ({ ...prev, [campaign.id]: 0 }))
      // Refresh kampanye
      setCampaigns(prev => prev.map(c => c.id === campaign.id
        ? { ...c, collectedAmount: c.collectedAmount + amount }
        : c
      ))
    } catch (err: any) {
      toast({ title: "Gagal", description: err.message, variant: "destructive" })
    } finally {
      setDonating(null)
    }
  }

  return (
    <div className="pb-12 space-y-5">
      <div className="bg-gradient-to-br from-rose-500 to-pink-600 rounded-b-[2.5rem] pt-8 pb-16 px-6">
        <h1 className="text-white font-bold text-xl mb-1">Donasi & Infaq</h1>
        <p className="text-white/70 text-sm">Berkontribusi untuk kemajuan sekolah.</p>
      </div>

      <div className="px-5 -mt-10 space-y-4">
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
        ) : campaigns.length === 0 ? (
          <Card className="glass border-0">
            <CardContent className="py-16 text-center">
              <Heart className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-40" />
              <p className="text-muted-foreground">Belum ada kampanye donasi aktif.</p>
            </CardContent>
          </Card>
        ) : campaigns.map(c => {
          const pct = Math.min((c.collectedAmount / c.targetAmount) * 100, 100)
          return (
            <Card key={c.id} className="glass border-0 shadow-sm overflow-hidden">
              {c.imageUrl && <img src={normalizeImageUrl(c.imageUrl)} alt={c.title} className="w-full h-36 object-cover" loading="lazy" decoding="async" />}
              <CardContent className="p-4">
                <h3 className="font-bold mb-2">{c.title}</h3>
                {c.description && <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{c.description}</p>}

                <div className="mb-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">Terkumpul</span>
                    <span className="font-bold">{Math.round(pct)}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-rose-500 to-pink-400 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="flex justify-between text-xs mt-1 text-muted-foreground">
                    <span>Rp {c.collectedAmount.toLocaleString("id-ID")}</span>
                    <span>Target: Rp {c.targetAmount.toLocaleString("id-ID")}</span>
                  </div>
                </div>

                {/* Quick nominal */}
                <div className="flex gap-2 mb-3 flex-wrap">
                  {[10000, 25000, 50000, 100000].map(n => (
                    <Button
                      key={n}
                      onClick={() => setAmounts(prev => ({ ...prev, [c.id]: n }))}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-all ${amounts[c.id] === n ? "bg-rose-500 text-white border-rose-500" : "bg-muted/50 text-muted-foreground border-border hover:border-rose-300"}`}
                    >
                      Rp {n.toLocaleString("id-ID")}
                    </Button>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Nominal lainnya..."
                    value={amounts[c.id] || ""}
                    onChange={e => setAmounts(prev => ({ ...prev, [c.id]: Number(e.target.value) }))}
                    className="rounded-xl flex-1"
                  />
                  <Button
                    className="rounded-xl shrink-0 bg-destructive text-destructive-foreground hover:bg-destructive/90 hover:bg-rose-600"
                    disabled={donating === c.id || !amounts[c.id]}
                    onClick={() => handleDonate(c)}
                  >
                    {donating === c.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Wallet className="mr-1.5 h-4 w-4" /> Donasi</>}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
