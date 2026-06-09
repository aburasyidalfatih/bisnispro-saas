"use client"

import { useEffect, useState, useCallback } from"react"
import { useSession } from"next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from"@/components/ui/card"
import { Button } from"@/components/ui/button"
import { Label } from"@/components/ui/label"
import { Textarea } from"@/components/ui/textarea"
import { Input } from"@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from"@/components/ui/tabs"
import { Switch } from"@/components/ui/switch"
import { ServerPagination } from"@/components/shared/server-pagination"
import { Bell, Check, Info, CheckCircle, AlertTriangle, XCircle, FileText, Save, Loader2 } from"lucide-react"
import { cn } from"@/lib/utils"
import { toast } from"@/hooks/use-toast"

interface NotifRow {
  id: string
  title: string
  message: string
  type: string
  isRead: boolean
  createdAt: string
}

const typeIcons: Record<string, { icon: typeof Info; color: string }> = {
  info: { icon: Info, color:"text-blue-500 bg-blue-500/10" },
  success: { icon: CheckCircle, color:"text-emerald-500 bg-emerald-500/10" },
  warning: { icon: AlertTriangle, color:"text-amber-500 bg-amber-500/10" },
  error: { icon: XCircle, color:"text-destructive bg-destructive/10" },
}

export default function NotificationsPage() {
  const { data: session } = useSession()
  const tenantId = session?.user?.tenants?.[0]?.id ||""
  const [activeTab, setActiveTab] = useState("inbox")
  
  // Inbox state
  const [notifs, setNotifs] = useState<NotifRow[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const limit = 20

  // Templates constants
  const DEFAULT_TEMPLATES = [
    {
      id:"invoice_created",
      name:"Tagihan Baru (SPP)",
      desc:"Dikirim saat tagihan baru diterbitkan.",
      variables: ["studentName","invoiceTitle","amount","dueDate","schoolName"],
      defaultTitle:"Tagihan Baru: {{invoiceTitle}}",
      defaultMessage:"Halo, ada tagihan baru untuk ananda {{studentName}} sebesar Rp {{amount}}. Jatuh tempo pada {{dueDate}}. Silakan lakukan pembayaran melalui aplikasi."
    },
    {
      id:"payment_success",
      name:"Pembayaran Berhasil",
      desc:"Dikirim saat pembayaran tagihan berhasil diverifikasi.",
      variables: ["studentName","invoiceTitle","amountPaid","schoolName"],
      defaultTitle:"Pembayaran Berhasil: {{invoiceTitle}}",
      defaultMessage:"Terima kasih, pembayaran sebesar Rp {{amountPaid}} untuk tagihan {{invoiceTitle}} ananda {{studentName}} telah berhasil kami terima."
    },
    {
      id:"wallet_topup",
      name:"Top-up Saldo E-Kantin",
      desc:"Dikirim saat saldo tabungan/wallet bertambah.",
      variables: ["studentName","amount","newBalance","schoolName"],
      defaultTitle:"Top-up Saldo Berhasil",
      defaultMessage:"Top-up saldo E-Kantin ananda {{studentName}} sebesar Rp {{amount}} telah berhasil. Saldo saat ini: Rp {{newBalance}}."
    },
    {
      id:"attendance_alert",
      name:"Notifikasi Kehadiran",
      desc:"Dikirim saat absensi harian siswa dicatat.",
      variables: ["studentName","status","time","schoolName"],
      defaultTitle:"Info Kehadiran: {{studentName}}",
      defaultMessage:"Ananda {{studentName}} tercatat dengan status: {{status}} pada pukul {{time}}."
    },
    {
      id:"ppdb_registered",
      name:"PPDB: Pendaftaran Akun",
      desc:"Dikirim setelah calon siswa membuat akun pendaftaran.",
      variables: ["applicantName","registrationNumber","schoolName","loginUrl"],
      defaultTitle:"Pendaftaran Akun PPDB Berhasil",
      defaultMessage:"Halo {{applicantName}}, akun pendaftaran PPDB Anda di {{schoolName}} telah dibuat dengan Nomor Registrasi: {{registrationNumber}}. Silakan login di {{loginUrl}} untuk melanjutkan."
    },
    {
      id:"ppdb_form_fee",
      name:"PPDB: Tagihan Formulir",
      desc:"Dikirim saat tagihan biaya pendaftaran/formulir dibuat.",
      variables: ["applicantName","amount","dueDate","schoolName"],
      defaultTitle:"Tagihan Biaya Formulir PPDB",
      defaultMessage:"Halo {{applicantName}}, silakan lakukan pembayaran formulir pendaftaran PPDB sebesar Rp {{amount}} sebelum {{dueDate}} agar dapat melanjutkan pengisian data."
    },
    {
      id:"ppdb_document_submitted",
      name:"PPDB: Berkas Terkirim",
      desc:"Dikirim saat calon siswa menyelesaikan pengisian biodata dan submit berkas.",
      variables: ["applicantName","registrationNumber","schoolName"],
      defaultTitle:"Berkas PPDB Berhasil Dikirim",
      defaultMessage:"Terima kasih {{applicantName}} (No. {{registrationNumber}}). Seluruh berkas pendaftaran Anda telah kami terima dan sedang dalam proses verifikasi oleh panitia {{schoolName}}."
    },
    {
      id:"ppdb_announcement",
      name:"PPDB: Pengumuman Kelulusan",
      desc:"Dikirim saat panitia mengumumkan hasil seleksi diterima/ditolak.",
      variables: ["applicantName","registrationNumber","status","schoolName"],
      defaultTitle:"Pengumuman Seleksi PPDB",
      defaultMessage:"Halo {{applicantName}}, hasil seleksi PPDB di {{schoolName}} telah diumumkan. Status Anda: {{status}}. Silakan login ke dashboard untuk melihat detail selengkapnya."
    },
    {
      id:"ppdb_official_student",
      name:"PPDB: Resmi Menjadi Siswa",
      desc:"Dikirim saat siswa telah diverifikasi daftar ulang dan resmi diterima di kelas.",
      variables: ["studentName","nis","schoolName"],
      defaultTitle:"Selamat Bergabung di {{schoolName}}!",
      defaultMessage:"Selamat! Proses daftar ulang selesai. Ananda {{studentName}} dengan NIS {{nis}} telah terdaftar secara resmi sebagai siswa di {{schoolName}}."
    },
    {
      id:"invoice_overdue",
      name:"Keuangan: Pengingat Jatuh Tempo",
      desc:"Dikirim (otomatis) saat tagihan SPP/biaya lain sudah mendekati atau melewati tenggat waktu.",
      variables: ["studentName","invoiceTitle","amountDue","dueDate","schoolName"],
      defaultTitle:"Peringatan Jatuh Tempo: {{invoiceTitle}}",
      defaultMessage:"Pemberitahuan dari {{schoolName}}. Tagihan {{invoiceTitle}} ananda {{studentName}} sebesar Rp {{amountDue}} telah/akan jatuh tempo pada {{dueDate}}. Mohon segera lakukan pembayaran."
    },
    {
      id:"canteen_transaction",
      name:"E-Kantin: Pemotongan Saldo (Jajan)",
      desc:"Dikirim saat siswa melakukan transaksi jajan di kantin menggunakan ID Card/QR.",
      variables: ["studentName","merchantName","amount","newBalance","schoolName"],
      defaultTitle:"Transaksi E-Kantin",
      defaultMessage:"Info Transaksi: Ananda {{studentName}} baru saja melakukan pembelian di {{merchantName}} sebesar Rp {{amount}}. Sisa saldo dompet saat ini: Rp {{newBalance}}."
    },
    {
      id:"discipline_alert",
      name:"Konseling: Catatan Kedisiplinan/Pelanggaran",
      desc:"Dikirim ke wali murid saat ada penambahan poin pelanggaran atau catatan BK.",
      variables: ["studentName","violation","points","schoolName"],
      defaultTitle:"Pemberitahuan Kedisiplinan Siswa",
      defaultMessage:"Bapak/Ibu Wali Murid, menginformasikan bahwa ananda {{studentName}} mendapat catatan terkait: {{violation}} (Poin: {{points}}). Harap hubungi pihak BK {{schoolName}} untuk detail lebih lanjut."
    },
    {
      id:"parent_portal_activation",
      name:"Portal Wali: Aktivasi Akun",
      desc:"Dikirim saat Admin mendaftarkan nomor WA/Email orang tua agar mereka bisa login.",
      variables: ["parentName","studentName","username","password","loginUrl"],
      defaultTitle:"Akses Portal Wali Murid",
      defaultMessage:"Halo {{parentName}}, akun portal akademik untuk memantau ananda {{studentName}} telah aktif. Login di: {{loginUrl}} menggunakan Username: {{username}} dan Password: {{password}}."
    }
  ]

  // Initialize form state dynamically
  const getInitialFormState = (dataSettings: any = {}) => {
    const state: any = {}
    DEFAULT_TEMPLATES.forEach(tpl => {
      state[`${tpl.id}_title`] = dataSettings[`${tpl.id}_title`] || tpl.defaultTitle
      state[`${tpl.id}_message`] = dataSettings[`${tpl.id}_message`] || tpl.defaultMessage
      state[`${tpl.id}_enable_email`] = dataSettings[`${tpl.id}_enable_email`] ?? true
      state[`${tpl.id}_enable_wa`] = dataSettings[`${tpl.id}_enable_wa`] ?? true
      state[`${tpl.id}_enable_app`] = dataSettings[`${tpl.id}_enable_app`] ?? true
    })
    return state
  }

  const [settings, setSettings] = useState<any>({})
  const [savingTemplates, setSavingTemplates] = useState(false)
  const [templatesForm, setTemplatesForm] = useState(getInitialFormState())

  // Fetch Settings
  useEffect(() => {
    if (!tenantId) return
    fetch(`/api/tenant/website?tenantId=${tenantId}`)
      .then(res => res.json())
      .then(data => {
        if (data.settings) {
          setSettings(data.settings)
          setTemplatesForm(getInitialFormState(data.settings))
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
    if (activeTab ==="inbox") fetchNotifs() 
  }, [fetchNotifs, activeTab])

  const markAllRead = async () => {
    setNotifs((prev) => prev.map((n) => ({ ...n, isRead: true })))
    try {
      await fetch("/api/tenant/notifications", {
        method:"PUT",
        headers: {"Content-Type":"application/json" },
        body: JSON.stringify({ all: true }),
      })
      toast({ title:"Semua notifikasi ditandai dibaca" })
    } catch {
      fetchNotifs()
      toast({ title:"Gagal menandai notifikasi", variant:"destructive" })
    }
  }

  const markRead = async (id: string) => {
    setNotifs((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n))
    try {
      await fetch("/api/tenant/notifications", {
        method:"PUT",
        headers: {"Content-Type":"application/json" },
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
        method:"PUT",
        headers: {"Content-Type":"application/json" },
        body: JSON.stringify({
          tenantId,
          settings: newSettings
        })
      })
      
      if (res.ok) {
        setSettings(newSettings)
        toast({ title:"Template notifikasi berhasil disimpan" })
      } else {
        const d = await res.json()
        throw new Error(d.error ||"Gagal menyimpan")
      }
    } catch (error: any) {
      toast({ title:"Error", description: error.message, variant:"destructive" })
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
                      className={cn("flex items-start gap-3 p-4 transition-colors cursor-pointer", !n.isRead ?"bg-primary/5 hover:bg-primary/10" :"hover:bg-muted/20")}
                      onClick={() => !n.isRead && markRead(n.id)}
                    >
                      <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl mt-0.5", typeInfo.color)}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={cn("text-sm", !n.isRead &&"font-semibold")}>{n.title}</p>
                          {!n.isRead && <span className="h-2 w-2 rounded-full bg-primary shrink-0" />}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                        <p className="text-[11px] text-muted-foreground mt-1">
                          {new Date(n.createdAt).toLocaleDateString("id-ID", { day:"numeric", month:"short", hour:"2-digit", minute:"2-digit" })}
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

        <TabsContent value="templates" className="m-0 focus-visible:outline-none focus-visible:ring-0 space-y-6">
          <div className="flex justify-end">
            <Button 
              className="gap-2 btn-gradient text-white border-0 rounded-xl flex items-center justify-center h-10 px-4" 
              onClick={handleSaveTemplates}
              disabled={savingTemplates}
            >
              {savingTemplates ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {savingTemplates ?"Menyimpan..." :"Simpan Semua Template"}
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {DEFAULT_TEMPLATES.map(tpl => (
              <Card key={tpl.id} className="glass border-0 shadow-sm overflow-hidden border-l-4 border-l-primary">
                <CardHeader className="bg-muted/20 pb-4 border-b">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <FileText className="h-5 w-5 text-primary" />
                        {tpl.name}
                      </CardTitle>
                      <CardDescription className="mt-1">{tpl.desc}</CardDescription>
                    </div>
                    <div className="flex gap-4 p-3 bg-background rounded-xl border">
                      <div className="flex items-center gap-2">
                        <Switch id={`${tpl.id}_email`} checked={templatesForm[`${tpl.id}_enable_email`]} onCheckedChange={(c) => setTemplatesForm({...templatesForm, [`${tpl.id}_enable_email`]: c})} />
                        <Label htmlFor={`${tpl.id}_email`} className="text-xs font-bold cursor-pointer">Email</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch id={`${tpl.id}_wa`} checked={templatesForm[`${tpl.id}_enable_wa`]} onCheckedChange={(c) => setTemplatesForm({...templatesForm, [`${tpl.id}_enable_wa`]: c})} />
                        <Label htmlFor={`${tpl.id}_wa`} className="text-xs font-bold cursor-pointer">WhatsApp</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch id={`${tpl.id}_app`} checked={templatesForm[`${tpl.id}_enable_app`]} onCheckedChange={(c) => setTemplatesForm({...templatesForm, [`${tpl.id}_enable_app`]: c})} />
                        <Label htmlFor={`${tpl.id}_app`} className="text-xs font-bold cursor-pointer">App Notif</Label>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-4">
                      <div className="space-y-2">
                        <Label className="font-bold text-slate-700">Judul / Subjek Pesan</Label>
                        <Input 
                          value={templatesForm[`${tpl.id}_title`] ||""}
                          onChange={(e) => setTemplatesForm({...templatesForm, [`${tpl.id}_title`]: e.target.value})}
                          placeholder={tpl.defaultTitle}
                          className="rounded-xl font-mono text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="font-bold text-slate-700">Isi Pesan Notifikasi</Label>
                        <Textarea 
                          value={templatesForm[`${tpl.id}_message`] ||""}
                          onChange={(e) => setTemplatesForm({...templatesForm, [`${tpl.id}_message`]: e.target.value})}
                          placeholder={tpl.defaultMessage}
                          className="min-h-[120px] rounded-xl font-mono text-sm"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <div className="bg-indigo-50 border border-indigo-100 text-indigo-900 rounded-2xl p-4 text-sm space-y-3 h-full">
                        <h4 className="font-semibold flex items-center gap-2">
                          <Info className="h-4 w-4" /> Variabel Dinamis
                        </h4>
                        <p className="text-xs text-indigo-700/80">
                          Gunakan format <code className="bg-white/60 px-1 rounded font-bold font-mono">{"{{nama_variabel}}"}</code>
                        </p>
                        <ul className="text-xs space-y-2 mt-2">
                          {tpl.variables.map(v => (
                            <li key={v}><code className="bg-white/80 px-1.5 py-0.5 rounded font-mono font-bold text-indigo-700">{"{{"}{v}{"}}"}</code></li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

