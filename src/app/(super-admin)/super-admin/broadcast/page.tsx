"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Megaphone, Send, Loader2, Info } from "lucide-react"

export default function BroadcastPage() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  
  const [form, setForm] = useState({
    target: "all_tenants",
    channel: "whatsapp",
    subject: "",
    message: ""
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.message) {
      toast({ title: "Isi pesan tidak boleh kosong", variant: "destructive" })
      return
    }
    if ((form.channel === "email" || form.channel === "both" || form.channel === "notification" || form.channel === "all") && !form.subject) {
      toast({ title: "Subjek / Judul harus diisi", variant: "destructive" })
      return
    }


    setLoading(true)
    try {
      const res = await fetch("/api/super-admin/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Gagal mengirim broadcast")

      toast({ 
        title: "Broadcast Sedang Diproses", 
        description: data.message || "Pesan sedang dikirim di latar belakang."
      })
      
      setForm({ ...form, subject: "", message: "" }) // Reset pesan
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  if (!session?.user?.isSuperAdmin) return null

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Broadcast Pesan</h2>
          <p className="text-muted-foreground">Kirim pengumuman massal ke Bisnis atau Mitra Afiliasi.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card className="glass border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Megaphone className="h-5 w-5 text-primary" />
                Buat Pesan Baru
              </CardTitle>
              <CardDescription>Pesan akan dikirim secara asinkron untuk mencegah server timeout.</CardDescription>
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
                      <SelectItem value="all_tenants">Semua Bisnis (Perusahaan Aktif)</SelectItem>
                      <SelectItem value="pending_tenants">Bisnis Menunggu Review (PENDING)</SelectItem>
                      <SelectItem value="free_tenants">Bisnis Versi Gratis (Free Plan)</SelectItem>
                      <SelectItem value="pro_tenants">Bisnis Versi Premium (Pro Plan)</SelectItem>
                      <SelectItem value="all_affiliates">Semua Mitra Afiliasi</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label>Jalur Pengiriman (Channel)</Label>
                  <Select value={form.channel} onValueChange={(val) => setForm({ ...form, channel: val })}>
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Pilih jalur pengiriman..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="whatsapp">WhatsApp Saja</SelectItem>
                      <SelectItem value="email">Email Saja</SelectItem>
                      <SelectItem value="notification">Notifikasi Aplikasi (Lonceng)</SelectItem>
                      <SelectItem value="both">WhatsApp & Email</SelectItem>
                      <SelectItem value="all">Semua (WA, Email, Lonceng)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {(form.channel === "email" || form.channel === "both" || form.channel === "notification" || form.channel === "all") && (
                  <div className="space-y-2">
                    <Label>Subjek / Judul Pesan</Label>
                    <Input 
                      placeholder="Masukkan subjek atau judul pesan..." 
                      value={form.subject}
                      onChange={(e) => setForm({ ...form, subject: e.target.value })}
                      className="bg-background"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Isi Pesan</Label>
                  <div className="relative">
                    <Textarea 
                      placeholder="Tulis pesan Anda di sini...&#10;Contoh: Halo {{name}}, kami memiliki pembaruan penting." 
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      className="min-h-[200px] bg-background font-mono text-sm"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-2">
                    <Info className="h-3 w-3" />
                    Variabel tersedia: <code className="bg-accent px-1 rounded">{"{{name}}"}</code> <code className="bg-accent px-1 rounded">{"{{email}}"}</code> <code className="bg-accent px-1 rounded">{"{{phone}}"}</code> <code className="bg-accent px-1 rounded">{"{{schoolName}}"}</code> (khusus tenant)
                  </p>
                </div>



                <Button 
                  type="submit" 
                  className="w-full sm:w-auto gap-2 btn-gradient text-white border-0 flex items-center justify-center h-10 px-4" 
                  disabled={loading}
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  {loading ? "Memproses..." : "Kirim Broadcast Sekarang"}
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
                <strong>WhatsApp Anti-Banned:</strong> Pengiriman pesan massal menggunakan antrean pintar secara otomatis. Delay pengiriman akan menyesuaikan dengan pengaturan WhatsApp di Pengaturan Super Admin.
              <p>
                <strong>Pengiriman Asinkron:</strong> Proses ini berjalan di latar belakang VPS. Anda dapat menutup halaman ini setelah menekan tombol kirim, proses tidak akan terhenti.
              </p>
              <p>
                <strong>Format Pesan:</strong> Pesan akan dikirim dengan format teks murni untuk WhatsApp dan HTML murni untuk Email.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
