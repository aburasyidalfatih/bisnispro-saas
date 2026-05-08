"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Mail, Save, Clock, ChevronRight, Check } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"

interface Campaign {
  id: string
  dayOffset: number
  title: string
  subject: string
  content: string
  isActive: boolean
  stats?: {
    sent: number
    opened: number
    clicked: number
  }
}

export default function EducationalEmailsPage() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<number | null>(null)

  useEffect(() => {
    fetch("/api/super-admin/educational-emails")
      .then(res => res.json())
      .then(data => {
        setCampaigns(data)
        if (data.length > 0) setActiveTab(data[0].dayOffset)
      })
      .catch(err => toast({ title: "Error", description: err.message, variant: "destructive" }))
      .finally(() => setLoading(false))
  }, [toast])

  const handleUpdate = (dayOffset: number, field: keyof Campaign, value: any) => {
    setCampaigns(prev => prev.map(c => c.dayOffset === dayOffset ? { ...c, [field]: value } : c))
  }

  const handleSave = async (campaign: Campaign) => {
    setSavingId(campaign.id)
    try {
      const res = await fetch("/api/super-admin/educational-emails", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(campaign)
      })
      if (!res.ok) throw new Error("Gagal menyimpan email")
      toast({ title: "Berhasil disimpan", description: `${campaign.title} berhasil diperbarui.` })
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    } finally {
      setSavingId(null)
    }
  }

  if (!session?.user?.isSuperAdmin) return null

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
  }

  const activeCampaign = campaigns.find(c => c.dayOffset === activeTab)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Email Edukasi (Drip Campaign)</h2>
          <p className="text-muted-foreground">Otomatis kirim email edukasi ke Tenant setelah pendaftaran disetujui.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Nav */}
        <div className="lg:col-span-1 space-y-2">
          <Card className="glass border-0">
            <CardHeader className="pb-3 px-4 pt-4">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Clock className="h-4 w-4" /> Urutan Pengiriman
              </CardTitle>
            </CardHeader>
            <CardContent className="px-2 pb-4">
              <div className="space-y-1">
                {campaigns.map(c => (
                  <button
                    key={c.id}
                    onClick={() => setActiveTab(c.dayOffset)}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left text-sm transition-colors",
                      activeTab === c.dayOffset ? "bg-primary text-white" : "hover:bg-muted/60 text-muted-foreground"
                    )}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <div className={cn("h-2 w-2 rounded-full shrink-0", c.isActive ? (activeTab === c.dayOffset ? "bg-white" : "bg-green-500") : "bg-muted-foreground/30")} />
                      <span className="truncate">{c.title}</span>
                    </div>
                    {activeTab === c.dayOffset && <ChevronRight className="h-4 w-4 shrink-0" />}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
          
          <Card className="glass border-0 bg-primary/5">
            <CardContent className="p-4 text-xs text-muted-foreground">
              <p>Email akan otomatis terkirim pada jam 08:00 pagi setiap harinya (H+X) setelah tanggal <strong>approvedAt</strong> Tenant diatur.</p>
            </CardContent>
          </Card>
        </div>

        {/* Editor */}
        <div className="lg:col-span-3">
          {activeCampaign && (
            <Card className="glass border-0 shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Mail className="h-5 w-5 text-primary" />
                      {activeCampaign.title}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      Email ini dikirim {activeCampaign.dayOffset} hari setelah pendaftaran disetujui.
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-full">
                    <Switch 
                      checked={activeCampaign.isActive} 
                      onCheckedChange={(val) => handleUpdate(activeCampaign.dayOffset, "isActive", val)} 
                    />
                    <Label className="text-xs font-semibold cursor-pointer">{activeCampaign.isActive ? 'Aktif' : 'Nonaktif'}</Label>
                  </div>
                </div>

                {activeCampaign.stats && (
                  <div className="grid grid-cols-3 gap-4 pt-2">
                    <div className="bg-primary/5 rounded-xl p-3 border border-primary/10">
                      <div className="text-xs text-muted-foreground mb-1">Terkirim</div>
                      <div className="text-xl font-bold">{activeCampaign.stats.sent}</div>
                    </div>
                    <div className="bg-green-500/5 rounded-xl p-3 border border-green-500/10">
                      <div className="text-xs text-muted-foreground mb-1">Dibaca (Open Rate)</div>
                      <div className="text-xl font-bold text-green-600">
                        {activeCampaign.stats.sent > 0 ? Math.round((activeCampaign.stats.opened / activeCampaign.stats.sent) * 100) : 0}%
                        <span className="text-xs font-normal text-muted-foreground ml-1">({activeCampaign.stats.opened})</span>
                      </div>
                    </div>
                    <div className="bg-blue-500/5 rounded-xl p-3 border border-blue-500/10">
                      <div className="text-xs text-muted-foreground mb-1">Diklik (CTR)</div>
                      <div className="text-xl font-bold text-blue-600">
                        {activeCampaign.stats.opened > 0 ? Math.round((activeCampaign.stats.clicked / activeCampaign.stats.opened) * 100) : 0}%
                        <span className="text-xs font-normal text-muted-foreground ml-1">({activeCampaign.stats.clicked})</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Subjek Email</Label>
                  <Input 
                    value={activeCampaign.subject}
                    onChange={(e) => handleUpdate(activeCampaign.dayOffset, "subject", e.target.value)}
                    className="bg-background"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Isi Email (Text / HTML)</Label>
                  <Textarea 
                    value={activeCampaign.content}
                    onChange={(e) => handleUpdate(activeCampaign.dayOffset, "content", e.target.value)}
                    className="min-h-[300px] bg-background font-mono text-sm leading-relaxed"
                  />
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-2">
                    Variabel tersedia: <code className="bg-accent px-1 rounded">{"{{name}}"}</code> (Nama Admin), <code className="bg-accent px-1 rounded">{"{{schoolName}}"}</code> (Nama Sekolah)
                  </p>
                </div>

                <div className="flex justify-end pt-2 border-t border-border/50">
                  <Button 
                    onClick={() => handleSave(activeCampaign)}
                    disabled={savingId === activeCampaign.id}
                    className="gap-2 btn-gradient text-white border-0"
                  >
                    {savingId === activeCampaign.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Simpan Perubahan
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
