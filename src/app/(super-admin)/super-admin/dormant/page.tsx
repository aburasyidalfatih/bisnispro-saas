"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Moon, MessageCircle, ExternalLink, RefreshCw, Mail, Trash2, Send, Save, Settings } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

interface DormantTenant {
  id: string
  name: string
  slug: string
  email: string | null
  phone: string | null
  whatsapp: string | null
  createdAt: string
  isActive: boolean
}

export default function DormantSchoolsPage() {
  const { toast } = useToast()
  const [tenants, setTenants] = useState<DormantTenant[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTenants, setSelectedTenants] = useState<string[]>([])
  const [isProcessing, setIsProcessing] = useState(false)

  // Template States
  const [waTemplate, setWaTemplate] = useState("")
  const [emailSubject, setEmailSubject] = useState("")
  const [emailHtml, setEmailHtml] = useState("")
  const [loadingTemplates, setLoadingTemplates] = useState(false)
  const [savingTemplates, setSavingTemplates] = useState(false)

  const fetchTenants = () => {
    setLoading(true)
    fetch("/api/super-admin/dormant")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setTenants(data)
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false))
  }

  const fetchTemplates = () => {
    setLoadingTemplates(true)
    fetch("/api/super-admin/dormant/templates")
      .then((res) => res.json())
      .then((data) => {
        if (data.DORMANT_WA_TEMPLATE) setWaTemplate(data.DORMANT_WA_TEMPLATE)
        if (data.DORMANT_EMAIL_SUBJECT) setEmailSubject(data.DORMANT_EMAIL_SUBJECT)
        if (data.DORMANT_EMAIL_HTML) setEmailHtml(data.DORMANT_EMAIL_HTML)
      })
      .catch((err) => console.error(err))
      .finally(() => setLoadingTemplates(false))
  }

  useEffect(() => {
    fetchTenants()
    fetchTemplates()
  }, [])

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedTenants(tenants.map(t => t.id))
    } else {
      setSelectedTenants([])
    }
  }

  const handleSelectOne = (checked: boolean, id: string) => {
    if (checked) {
      setSelectedTenants(prev => [...prev, id])
    } else {
      setSelectedTenants(prev => prev.filter(tId => tId !== id))
    }
  }

  const handleBulkNotify = async (type: "wa" | "email") => {
    if (selectedTenants.length === 0) return
    setIsProcessing(true)
    try {
      const res = await fetch("/api/super-admin/dormant/bulk-notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, tenantIds: selectedTenants })
      })
      if (!res.ok) throw new Error("Gagal mengirim notifikasi")
      toast({ title: `Berhasil memproses notifikasi massal (${type.toUpperCase()})!` })
      setSelectedTenants([])
    } catch (e: any) {
      toast({ title: e.message || "Gagal memproses", variant: "destructive" })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleNotifySingle = async (type: "wa" | "email", tenantId: string) => {
    setIsProcessing(true)
    try {
      const res = await fetch("/api/super-admin/dormant/bulk-notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, tenantIds: [tenantId] })
      })
      if (!res.ok) throw new Error("Gagal mengirim notifikasi")
      toast({ title: `Berhasil memproses notifikasi (${type.toUpperCase()})!` })
    } catch (e: any) {
      toast({ title: e.message || "Gagal memproses", variant: "destructive" })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleBulkDelete = async () => {
    if (selectedTenants.length === 0) return
    if (!confirm("Apakah Anda yakin ingin MENGHAPUS secara permanen semua sekolah yang dipilih? Data tidak dapat dipulihkan!")) return
    
    setIsProcessing(true)
    try {
      const res = await fetch("/api/super-admin/dormant/bulk-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantIds: selectedTenants })
      })
      if (!res.ok) throw new Error("Gagal menghapus tenant")
      toast({ title: "Berhasil menghapus tenant terpilih!" })
      setSelectedTenants([])
      fetchTenants()
    } catch (e: any) {
      toast({ title: e.message || "Gagal menghapus", variant: "destructive" })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sekolah Dormant (Belum Login)</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Daftar {tenants.length} sekolah yang sudah disetujui namun belum pernah login ke dasbor mereka.
          </p>
        </div>
        <Button onClick={fetchTenants} variant="outline" size="sm" className="gap-2">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="list" className="space-y-4">
        <TabsList>
          <TabsTrigger value="list" className="gap-2"><Moon className="h-4 w-4" /> Daftar Sekolah</TabsTrigger>
          <TabsTrigger value="templates" className="gap-2"><Settings className="h-4 w-4" /> Pengaturan Template</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          <Card className="glass border-0">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Moon className="h-5 w-5 text-orange-500" />
                Daftar Sekolah Dormant ({tenants.length})
              </CardTitle>
              <CardDescription>
                Lakukan follow-up agar sekolah segera memanfaatkan fitur SchoolPro.
              </CardDescription>
            </div>
            
            {/* BULK ACTION BAR */}
            {selectedTenants.length > 0 && (
              <div className="flex items-center gap-2 bg-muted/50 p-2 rounded-lg border animate-in fade-in zoom-in-95">
                <span className="text-sm font-medium mr-2 px-2 text-muted-foreground">
                  {selectedTenants.length} terpilih
                </span>
                <Button 
                  size="sm" 
                  variant="outline"
                  className="gap-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                  onClick={() => handleBulkNotify("email")}
                  disabled={isProcessing}
                >
                  <Mail className="h-4 w-4" />
                  Kirim Email Massal
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  className="gap-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                  onClick={() => handleBulkNotify("wa")}
                  disabled={isProcessing}
                >
                  <MessageCircle className="h-4 w-4" />
                  Kirim WA Massal
                </Button>
                <Button 
                  size="sm" 
                  variant="destructive"
                  className="gap-2"
                  onClick={handleBulkDelete}
                  disabled={isProcessing}
                >
                  <Trash2 className="h-4 w-4" />
                  Hapus Massal
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border bg-background/50 overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-12 text-center">
                    <Checkbox 
                      checked={tenants.length > 0 && selectedTenants.length === tenants.length}
                      onCheckedChange={handleSelectAll}
                      aria-label="Pilih Semua"
                    />
                  </TableHead>
                  <TableHead>Nama Sekolah</TableHead>
                  <TableHead>Subdomain</TableHead>
                  <TableHead>Kontak</TableHead>
                  <TableHead>Tanggal Disetujui</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      <RefreshCw className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ) : tenants.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      Tidak ada sekolah dormant saat ini. Hebat!
                    </TableCell>
                  </TableRow>
                ) : (
                  tenants.map((t) => (
                    <TableRow key={t.id} className={selectedTenants.includes(t.id) ? "bg-muted/30" : ""}>
                      <TableCell className="text-center">
                        <Checkbox 
                          checked={selectedTenants.includes(t.id)}
                          onCheckedChange={(checked) => handleSelectOne(checked as boolean, t.id)}
                          aria-label={`Pilih ${t.name}`}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        {t.name}
                        {!t.isActive && (
                          <Badge variant="destructive" className="ml-2 text-[10px]">Nonaktif</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <a 
                          href={`https://${t.slug}.schoolpro.id`} 
                          target="_blank" 
                          rel="noreferrer"
                          className="flex items-center gap-1 text-blue-500 hover:underline"
                        >
                          {t.slug} <ExternalLink className="h-3 w-3" />
                        </a>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{t.email}</div>
                        <div className="text-xs text-muted-foreground">{t.whatsapp || t.phone || '-'}</div>
                      </TableCell>
                      <TableCell>
                        {new Date(t.createdAt).toLocaleDateString('id-ID', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button 
                            size="sm" 
                            className="bg-blue-500 hover:bg-blue-600 text-white gap-2"
                            onClick={() => handleNotifySingle("email", t.id)}
                            disabled={isProcessing}
                          >
                            <Mail className="h-4 w-4" />
                            Email
                          </Button>
                          <Button 
                            size="sm" 
                            className="bg-emerald-500 hover:bg-emerald-600 text-white gap-2"
                            onClick={() => handleNotifySingle("wa", t.id)}
                            disabled={isProcessing}
                          >
                            <MessageCircle className="h-4 w-4" />
                            WA
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      </TabsContent>

      <TabsContent value="templates" className="space-y-4">
        <Card className="glass border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" />
              Template Pesan Notifikasi
            </CardTitle>
            <CardDescription>
              Ubah kata-kata pesan otomatis yang akan dikirim ke WhatsApp dan Email sekolah. Variabel yang didukung: <code className="bg-muted px-1 rounded">{{tenant_name}}</code>, <code className="bg-muted px-1 rounded">{{tenant_slug}}</code>, <code className="bg-muted px-1 rounded">{{tenant_email}}</code>, <code className="bg-muted px-1 rounded">{{tenant_phone}}</code>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {loadingTemplates ? (
              <div className="flex justify-center p-8"><RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" /></div>
            ) : (
              <>
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg border-b pb-2">WhatsApp</h3>
                  <div className="space-y-2">
                    <Label>Teks Pesan WA</Label>
                    <Textarea 
                      rows={6}
                      value={waTemplate} 
                      onChange={(e) => setWaTemplate(e.target.value)}
                      placeholder="Halo {{tenant_name}}..."
                      className="resize-y"
                    />
                  </div>
                </div>

                <div className="space-y-4 pt-4">
                  <h3 className="font-semibold text-lg border-b pb-2">Email</h3>
                  <div className="space-y-2">
                    <Label>Subjek Email</Label>
                    <Input 
                      value={emailSubject} 
                      onChange={(e) => setEmailSubject(e.target.value)}
                      placeholder="Bantuan Setup Website Sekolah..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Konten Email (HTML)</Label>
                    <Textarea 
                      rows={8}
                      value={emailHtml} 
                      onChange={(e) => setEmailHtml(e.target.value)}
                      placeholder="<p>Halo {{tenant_name}}...</p>"
                      className="font-mono text-sm resize-y"
                    />
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <Button 
                    onClick={async () => {
                      setSavingTemplates(true)
                      try {
                        const res = await fetch("/api/super-admin/dormant/templates", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            DORMANT_WA_TEMPLATE: waTemplate,
                            DORMANT_EMAIL_SUBJECT: emailSubject,
                            DORMANT_EMAIL_HTML: emailHtml
                          })
                        })
                        if (!res.ok) throw new Error("Gagal menyimpan")
                        toast({ title: "Template berhasil disimpan!" })
                      } catch (e: any) {
                        toast({ title: e.message || "Gagal menyimpan", variant: "destructive" })
                      } finally {
                        setSavingTemplates(false)
                      }
                    }} 
                    disabled={savingTemplates}
                    className="gap-2"
                  >
                    {savingTemplates ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Simpan Pengaturan
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </TabsContent>
      </Tabs>
    </div>
  )
}
