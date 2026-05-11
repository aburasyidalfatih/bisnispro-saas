"use client"

import { useEffect, useState, useCallback } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ServerPagination } from "@/components/shared/server-pagination"
import { Bell, Check, Info, CheckCircle, AlertTriangle, XCircle, FileText, Save, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"

interface NotifRow {
  id: string
  title: string
  message: string
  type: string
  isRead: boolean
  createdAt: string
}

const typeIcons: Record<string, { icon: typeof Info; color: string }> = {
  info: { icon: Info, color: "text-blue-500 bg-blue-500/10" },
  success: { icon: CheckCircle, color: "text-emerald-500 bg-emerald-500/10" },
  warning: { icon: AlertTriangle, color: "text-amber-500 bg-amber-500/10" },
  error: { icon: XCircle, color: "text-destructive bg-destructive/10" },
}

export default function NotificationsPage() {
  const { data: session } = useSession()
  const tenantId = session?.user?.tenants?.[0]?.tenantId || ""
  const [activeTab, setActiveTab] = useState("inbox")
  
  // Inbox state
  const [notifs, setNotifs] = useState<NotifRow[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const limit = 20

  // Templates state
  const [settings, setSettings] = useState<any>({})
  const [savingTemplates, setSavingTemplates] = useState(false)
  const [templatesForm, setTemplatesForm] = useState({
    invoice_created_title: "Tagihan Baru: {{invoiceTitle}}",
    invoice_created_message: "Halo, ada tagihan baru untuk ananda {{studentName}} sebesar Rp {{amount}}. Jatuh tempo pada {{dueDate}}. Silakan lakukan pembayaran melalui aplikasi."
  })

  // Fetch Settings
  useEffect(() => {
    if (!tenantId) return
    fetch(`/api/tenant/website?tenantId=${tenantId}`)
      .then(res => res.json())
      .then(data => {
        if (data.settings) {
          setSettings(data.settings)
          setTemplatesForm({
            invoice_created_title: data.settings.invoice_created_title || "Tagihan Baru: {{invoiceTitle}}",
            invoice_created_message: data.settings.invoice_created_message || "Halo, ada tagihan baru untuk ananda {{studentName}} sebesar Rp {{amount}}. Jatuh tempo pada {{dueDate}}. Silakan lakukan pembayaran melalui aplikasi."
          })
        }
      })
      .catch(console.error)
  }, [tenantId])

  const fetchNotifs = useCallback(() => {
    setLoading(true)
    fetch(`/api/tenant/notifications?page=${page}&limit=${limit}`)
      .then((r) => r.json())
      .then((data) => {
        setNotifs(data.data || [])
        setTotal(data.total || 0)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [page])

  useEffect(() => { 
    if (activeTab === "inbox") fetchNotifs() 
  }, [fetchNotifs, activeTab])

  const markAllRead = async () => {
    setNotifs((prev) => prev.map((n) => ({ ...n, isRead: true })))
    try {
      await fetch("/api/tenant/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      })
      toast({ title: "Semua notifikasi ditandai dibaca" })
    } catch {
      fetchNotifs()
      toast({ title: "Gagal menandai notifikasi", variant: "destructive" })
    }
  }

  const markRead = async (id: string) => {
    setNotifs((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n))
    try {
      await fetch("/api/tenant/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      })
    } catch {
      fetchNotifs()
    }
  }

  const handleSaveTemplates = async () => {
    if (!tenantId) return
    setSavingTemplates(true)
    const newSettings = { ...settings, ...templatesForm }
    
    try {
      const res = await fetch("/api/tenant/website", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId,
          settings: newSettings
        })
      })
      
      if (res.ok) {
        setSettings(newSettings)
        toast({ title: "Template notifikasi berhasil disimpan" })
      } else {
        const d = await res.json()
        throw new Error(d.error || "Gagal menyimpan")
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    } finally {
      setSavingTemplates(false)
    }
  }

  const totalPages = Math.ceil(total / limit)
  const unreadCount = notifs.filter((n) => !n.isRead).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Notifikasi Sistem</h1>
          <p className="text-muted-foreground">
            Kelola kotak masuk dan template pesan notifikasi.
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-background glass rounded-xl border border-border/50 p-1">
          <TabsTrigger value="inbox" className="rounded-lg gap-2 text-sm">
            <Bell className="h-4 w-4" /> Kotak Masuk {unreadCount > 0 && `(${unreadCount})`}
          </TabsTrigger>
          <TabsTrigger value="templates" className="rounded-lg gap-2 text-sm">
            <FileText className="h-4 w-4" /> Template Pesan
          </TabsTrigger>
        </TabsList>

        <TabsContent value="inbox" className="m-0 focus-visible:outline-none focus-visible:ring-0 space-y-4">
          {unreadCount > 0 && (
            <div className="flex justify-end">
              <Button variant="outline" size="sm" className="gap-2 rounded-xl" onClick={markAllRead}>
                <Check className="h-4 w-4" /> Tandai Semua Dibaca
              </Button>
            </div>
          )}

          <Card className="glass border-0 overflow-hidden">
            {loading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3].map((i) => <div key={i} className="skeleton h-16 w-full rounded-xl" />)}
              </div>
            ) : notifs.length === 0 ? (
              <div className="p-12 text-center">
                <Bell className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
                <p className="text-muted-foreground">Belum ada notifikasi</p>
              </div>
            ) : (
              <div className="divide-y">
                {notifs.map((n) => {
                  const typeInfo = typeIcons[n.type] || typeIcons.info
                  const Icon = typeInfo.icon
                  return (
                    <div
                      key={n.id}
                      className={cn("flex items-start gap-3 p-4 transition-colors cursor-pointer", !n.isRead ? "bg-primary/5 hover:bg-primary/10" : "hover:bg-muted/20")}
                      onClick={() => !n.isRead && markRead(n.id)}
                    >
                      <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl mt-0.5", typeInfo.color)}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={cn("text-sm", !n.isRead && "font-semibold")}>{n.title}</p>
                          {!n.isRead && <span className="h-2 w-2 rounded-full bg-primary shrink-0" />}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                        <p className="text-[11px] text-muted-foreground mt-1">
                          {new Date(n.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
            {totalPages > 1 && (
              <div className="px-4 py-3 border-t">
                <ServerPagination page={page} totalPages={totalPages} total={total} onPageChange={setPage} />
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="m-0 focus-visible:outline-none focus-visible:ring-0">
          <Card className="glass border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Template Pesan Tagihan (SPP)
              </CardTitle>
              <CardDescription>
                Sesuaikan isi pesan notifikasi yang akan dikirim melalui Email, WhatsApp, dan Dashboard Orang Tua. 
                Gunakan variabel <code className="bg-muted px-1 rounded">{"{{...}}"}</code> agar data otomatis terisi.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-4">
                  <div className="space-y-2">
                    <Label className="font-bold text-amber-600">Judul / Subjek Pesan</Label>
                    <Input 
                      value={templatesForm.invoice_created_title}
                      onChange={(e) => setTemplatesForm({...templatesForm, invoice_created_title: e.target.value})}
                      placeholder="Tagihan Baru: {{invoiceTitle}}"
                      className="rounded-xl font-mono text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold text-blue-600">Isi Pesan Notifikasi</Label>
                    <Textarea 
                      value={templatesForm.invoice_created_message}
                      onChange={(e) => setTemplatesForm({...templatesForm, invoice_created_message: e.target.value})}
                      placeholder="Halo, ada tagihan baru untuk ananda {{studentName}}..."
                      className="min-h-[150px] rounded-xl font-mono text-sm"
                    />
                  </div>
                  
                  <Button 
                    className="w-full sm:w-auto gap-2 btn-gradient text-white border-0 rounded-xl mt-4" 
                    onClick={handleSaveTemplates}
                    disabled={savingTemplates}
                  >
                    {savingTemplates ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    {savingTemplates ? "Menyimpan..." : "Simpan Template"}
                  </Button>
                </div>
                
                <div>
                  <div className="bg-amber-500/10 border border-amber-500/20 text-amber-800 rounded-2xl p-4 text-sm space-y-3">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Info className="h-4 w-4" /> Variabel Dinamis
                    </h4>
                    <p className="text-xs text-amber-700/80">
                      Anda dapat memasukkan variabel berikut ke dalam template. Variabel akan otomatis diganti dengan data siswa.
                    </p>
                    <ul className="text-xs space-y-2">
                      <li><code className="bg-white/50 px-1 rounded font-mono font-bold">{"{{studentName}}"}</code> : Nama Siswa</li>
                      <li><code className="bg-white/50 px-1 rounded font-mono font-bold">{"{{invoiceTitle}}"}</code> : Judul Tagihan</li>
                      <li><code className="bg-white/50 px-1 rounded font-mono font-bold">{"{{amount}}"}</code> : Nominal Tagihan (Rp)</li>
                      <li><code className="bg-white/50 px-1 rounded font-mono font-bold">{"{{dueDate}}"}</code> : Tanggal Jatuh Tempo</li>
                      <li><code className="bg-white/50 px-1 rounded font-mono font-bold">{"{{schoolName}}"}</code> : Nama Sekolah</li>
                    </ul>
                  </div>
                </div>
              </div>

            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

