"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Heart, HeartHandshake, Plus, Loader2, Target, Users,
  TrendingUp, CalendarClock, Edit2, Trash2, ChevronRight
} from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { id as localeId } from "date-fns/locale"

export default function DonationCampaignsPage() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const tenant = session?.user?.tenants?.[0]
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchCampaigns = async () => {
    if (!tenant) return
    const res = await fetch(`/api/donation/campaigns?tenantId=${tenant.id}`)
    setCampaigns(await res.json())
    setLoading(false)
  }

  useEffect(() => { fetchCampaigns() }, [tenant])

  const handleToggle = async (id: string, isActive: boolean) => {
    if (!tenant) return
    await fetch(`/api/donation/campaigns/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tenantId: tenant.id, isActive: !isActive }),
    })
    fetchCampaigns()
    toast({ title: `Kampanye ${!isActive ? "diaktifkan" : "dinonaktifkan"}` })
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus kampanye ini?")) return
    await fetch(`/api/donation/campaigns/${id}`, { method: "DELETE" })
    fetchCampaigns()
    toast({ title: "Kampanye dihapus" })
  }

  const totalCollected = campaigns.reduce((a, c) => a + (c.collectedAmount || 0), 0)
  const totalTarget = campaigns.reduce((a, c) => a + (c.targetAmount || 0), 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Kampanye Donasi</h1>
          <p className="text-sm text-muted-foreground">Kelola crowdfunding untuk kebutuhan sekolah.</p>
        </div>
        <Link href="/admin/donation/campaigns/create">
          <Button className="rounded-xl gap-2"><Plus className="h-4 w-4" /> Kampanye Baru</Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Kampanye", value: campaigns.length, icon: HeartHandshake, color: "text-rose-600 bg-rose-500/10" },
          { label: "Aktif", value: campaigns.filter(c => c.isActive).length, icon: TrendingUp, color: "text-emerald-600 bg-emerald-500/10" },
          { label: "Dana Terkumpul", value: `Rp ${totalCollected.toLocaleString("id-ID")}`, icon: Target, color: "text-primary bg-primary/10" },
          { label: "Total Target", value: `Rp ${totalTarget.toLocaleString("id-ID")}`, icon: Target, color: "text-indigo-600 bg-indigo-500/10" },
        ].map((s, i) => (
          <Card key={i} className="glass border-0 shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${s.color}`}>
                <s.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="font-black text-sm">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Campaign Cards */}
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      ) : campaigns.length === 0 ? (
        <Card className="glass border-0">
          <CardContent className="py-20 text-center">
            <HeartHandshake className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-40" />
            <p className="text-muted-foreground">Belum ada kampanye donasi. Mulai kampanye pertama!</p>
            <Link href="/admin/donation/campaigns/create" className="inline-block mt-4">
              <Button className="rounded-xl"><Plus className="mr-2 h-4 w-4" /> Buat Kampanye</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-5">
          {campaigns.map(campaign => {
            const pct = Math.min((campaign.collectedAmount / campaign.targetAmount) * 100, 100)
            return (
              <Card key={campaign.id} className="glass border-0 shadow-sm overflow-hidden">
                {campaign.imageUrl && (
                  <img src={campaign.imageUrl} alt={campaign.title} className="w-full h-36 object-cover" />
                )}
                <CardContent className="p-5">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-bold text-base leading-snug flex-1 pr-2">{campaign.title}</h3>
                    <Badge className={campaign.isActive
                      ? "bg-emerald-500/10 text-emerald-600 border-emerald-200 border shrink-0"
                      : "bg-slate-500/10 text-slate-500 border border-slate-200 shrink-0"}>
                      {campaign.isActive ? "Aktif" : "Nonaktif"}
                    </Badge>
                  </div>

                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>Terkumpul: <strong className="text-foreground">Rp {campaign.collectedAmount.toLocaleString("id-ID")}</strong></span>
                      <span>{Math.round(pct)}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-rose-500 to-pink-400 rounded-full transition-all duration-700"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Target: Rp {campaign.targetAmount.toLocaleString("id-ID")}</p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span><Users className="inline h-3 w-3 mr-1" />{campaign._count?.donations || 0} donatur</span>
                      {campaign.endDate && (
                        <span><CalendarClock className="inline h-3 w-3 mr-1" />{format(new Date(campaign.endDate), "d MMM yyyy", { locale: localeId })}</span>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
                        onClick={() => handleToggle(campaign.id, campaign.isActive)}>
                        {campaign.isActive ? <TrendingUp className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                      </Button>
                      <Link href={`/admin/donation/campaigns/${campaign.id}`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-muted-foreground hover:text-primary">
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => handleDelete(campaign.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
