"use client"

import { useState, useEffect } from"react"
import { useSession } from"next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from"@/components/ui/card"
import { Button } from"@/components/ui/button"
import { Input } from"@/components/ui/input"
import { Label } from"@/components/ui/label"
import { Textarea } from"@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from"@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from"@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from"@/components/ui/table"
import { Badge } from"@/components/ui/badge"
import { useToast } from"@/hooks/use-toast"
import { Megaphone, Send, Loader2, Info, History } from"lucide-react"
import { ServerPagination } from"@/components/shared/server-pagination"

export default function BroadcastPage() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("compose")
  
  const [form, setForm] = useState({
    target:"all_gtk",
    channel:"whatsapp",
    subject:"",
    message:"",
  })

  // History state
  const [history, setHistory] = useState<any[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const limit = 10

  const fetchHistory = async (pageNumber: number = 1) => {
    setHistoryLoading(true)
    try {
      const res = await fetch(`/api/tenant/broadcast/history?page=${pageNumber}&limit=${limit}`)
      const data = await res.json()
      if (res.ok) {
        setHistory(data.data || [])
        setTotalPages(data.totalPages || 1)
        setTotal(data.total || 0)
        setPage(pageNumber)
      }
    } catch (error) {
      console.error(error)
    } finally {
      setHistoryLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab ==="history") {
      fetchHistory(page)
    }
  }, [activeTab, page])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.message) {
      toast({ title:"Isi pesan tidak boleh kosong", variant:"destructive" })
      return
    }
    
    setLoading(true)
    try {
      const res = await fetch("/api/tenant/broadcast", {
        method:"POST",
        headers: {"Content-Type":"application/json" },
        body: JSON.stringify(form)
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error ||"Gagal mengirim broadcast")

      toast({ 
        title:"Broadcast Sedang Diproses", 
        description: data.message ||"Pesan sedang dikirim di latar belakang."
      })
      
      setForm({ ...form, subject:"", message:"" }) // Reset pesan
      // Refresh history jika tab aktif
      if (activeTab ==="history") fetchHistory(1)
    } catch (error: any) {
      toast({ title:"Error", description: error.message, variant:"destructive" })
    } finally {
      setLoading(false)
    }
  }

  // Hanya izinkan admin/owner
  const tenantRole = session?.user?.tenants?.[0]?.role
  if (tenantRole !=="owner" && tenantRole !=="admin") return null

  // Batasi akses hanya untuk pengguna berbayar (Lite/Pro)
  const tenantPlan = (session?.user as any)?.tenants?.[0]?.plan ||"free"
  if (tenantPlan ==="free") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
        <div className="p-4 bg-primary/10 rounded-full text-primary">
          <Megaphone className="h-12 w-12" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight">Fitur Berbayar</h2>
        <p className="text-muted-foreground max-w-md">
          Fitur Broadcast WhatsApp tersedia untuk pelanggan paket Lite dan Pro. Silakan tingkatkan paket langganan Anda untuk menikmati fitur ini.
        </p>
        <Button asChild className="mt-4 btn-gradient text-white border-0 flex items-center justify-center h-10 px-4">
          <a href="/admin/billing">Upgrade Paket Sekarang</a>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Broadcast Pesan</h2>
          <p className="text-muted-foreground">Kirim pengumuman massal ke GTK atau Orang Tua Klien.</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-background glass rounded-xl border border-border/50 p-1">
          <TabsTrigger value="compose" className="rounded-lg gap-2 text-sm">
            <Megaphone className="h-4 w-4" /> Buat Pesan
          </TabsTrigger>
          <TabsTrigger value="history" className="rounded-lg gap-2 text-sm">
            <History className="h-4 w-4" /> Histori Pesan
          </TabsTrigger>
        </TabsList>

        <TabsContent value="compose" className="m-0 focus-visible:outline-none focus-visible:ring-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <Card className="glass border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Megaphone className="h-5 w-5 text-primary" />
                    Buat Pesan Baru
                  </CardTitle>
                  <CardDescription>Kirim broadcast via WhatsApp Gateway secara asinkron.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    
                    <div className="space-y-3">
                      <Label>Segmen Penerima</Label>
                      <Select value={form.target} onValueChange={(val) => setForm({ ...form, target: val })}>
                        <SelectTrigger className="bg-background">
                          <SelectValue placeholder="Pilih penerima..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all_gtk">Semua Staf & Staf (GTK)</SelectItem>
                          {tenantPlan ==="pro" && (
                            <>
                              <SelectItem value="all_parents">Semua Orang Tua Klien</SelectItem>
                              <SelectItem value="all">Semua GTK & Orang Tua</SelectItem>
                            </>
                          )}
                        </SelectContent>
                      </Select>
                      {tenantPlan ==="lite" && (
                        <p className="text-[11px] text-amber-600 font-medium">
                          Paket Lite hanya dapat melakukan broadcast ke Staf & Staf. Upgrade ke PRO untuk broadcast ke Orang Tua.
                        </p>
                      )}
                    </div>

                    <div className="space-y-3">
                      <Label>Jalur Pengiriman (Channel)</Label>
                      <Select value={form.channel} onValueChange={(val) => setForm({ ...form, channel: val })}>
                        <SelectTrigger className="bg-background">
                          <SelectValue placeholder="Pilih jalur pengiriman..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="whatsapp">WhatsApp Saja</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">Saat ini broadcast hanya mendukung WhatsApp.</p>
                    </div>

                    <div className="space-y-2">
                      <Label>Isi Pesan</Label>
                      <div className="relative">
                        <Textarea 
                          placeholder="Tulis pesan Anda di sini...&#10;Contoh: Yth. Bpk/Ibu {{name}}, kami informasikan bahwa besok libur." 
                          value={form.message}
                          onChange={(e) => setForm({ ...form, message: e.target.value })}
                          className="min-h-[200px] bg-background font-mono text-sm"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-2">
                        <Info className="h-3 w-3" />
                        Variabel tersedia: <code className="bg-accent px-1 rounded">{"{{name}}"}</code> <code className="bg-accent px-1 rounded">{"{{phone}}"}</code>
                      </p>
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full sm:w-auto gap-2 btn-gradient text-white border-0 flex items-center justify-center h-10 px-4" 
                      disabled={loading}
                    >
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      {loading ?"Memproses..." :"Kirim Broadcast Sekarang"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            <div>
              <Card className="glass border-0 shadow-sm bg-gradient-to-br from-amber-500/10 to-transparent">
                <CardHeader>
                  <CardTitle className="text-lg text-amber-600">Panduan Broadcast</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm text-muted-foreground">
                  <p>
                    <strong>WhatsApp Anti-Banned:</strong> Pastikan Anda telah mengatur Delay Pengiriman minimal <strong>5 detik</strong> di menu Pengaturan WhatsApp agar nomor Anda tidak ditandai sebagai spam oleh WhatsApp.
                  </p>
                  <p>
                    <strong>Pengiriman Asinkron:</strong> Proses ini berjalan di latar belakang (Background Job). Anda dapat menutup halaman ini setelah menekan tombol kirim, proses tidak akan terhenti.
                  </p>
                  <p>
                    <strong>Validasi Nomor:</strong> Pesan hanya akan dikirim ke pengguna yang memiliki nomor WhatsApp valid (dimulai dengan 08 atau 628).
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="history" className="m-0 focus-visible:outline-none focus-visible:ring-0">
          <Card className="glass border-0 shadow-sm overflow-hidden">
            <CardHeader className="border-b bg-muted/20">
              <CardTitle className="text-lg">Riwayat Pesan Terkirim</CardTitle>
              <CardDescription>Daftar histori pengiriman pesan WhatsApp secara detail per tujuan.</CardDescription>
            </CardHeader>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tujuan</TableHead>
                    <TableHead>Pesan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Waktu</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historyLoading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                        Memuat data...
                      </TableCell>
                    </TableRow>
                  ) : history.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                        Belum ada riwayat pesan.
                      </TableCell>
                    </TableRow>
                  ) : (
                    history.map((msg) => (
                      <TableRow key={msg.id}>
                        <TableCell className="font-mono text-sm whitespace-nowrap">{msg.to}</TableCell>
                        <TableCell className="max-w-[300px] max-w-full">
                          <p className="truncate text-sm text-muted-foreground" title={msg.content}>
                            {msg.content}
                          </p>
                        </TableCell>
                        <TableCell>
                          <Badge variant={msg.status ==="SENT" ?"default" : msg.status ==="FAILED" ?"destructive" :"secondary"} className="capitalize">
                            {msg.status.toLowerCase()}
                          </Badge>
                          {msg.error && (
                            <p className="text-[10px] text-destructive mt-1 max-w-[200px] truncate max-w-full" title={msg.error}>
                              {msg.error}
                            </p>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                          {new Date(msg.createdAt).toLocaleString("id-ID", {
                            day:"2-digit", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit"
                          })}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            {totalPages > 1 && (
              <div className="p-4 border-t">
                <ServerPagination page={page} totalPages={totalPages} total={total} onPageChange={setPage} />
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
