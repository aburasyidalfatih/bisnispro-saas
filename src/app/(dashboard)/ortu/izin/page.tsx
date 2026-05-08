"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Clock, CheckCircle, XCircle, Loader2, Plus, Send } from "lucide-react"
import { format } from "date-fns"
import { id as localeId } from "date-fns/locale"

export default function OrtuIzinPage() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const router = useRouter()
  const tenant = session?.user?.tenants?.[0]
  const [myChildren, setMyChildren] = useState<any[]>([])
  const [myPermits, setMyPermits] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    studentId: "",
    type: "IZIN",
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
    reason: "",
  })

  useEffect(() => {
    if (!tenant || !session?.user) return
    Promise.all([
      fetch(`/api/ortu/children?tenantId=${tenant.id}`).then(r => r.json()),
      fetch(`/api/attendance/permits?tenantId=${tenant.id}&userId=${session.user.id}`).then(r => r.json()),
    ]).then(([children, permits]) => {
      setMyChildren(children || [])
      setMyPermits(permits || [])
    }).catch(console.error).finally(() => setLoading(false))
  }, [tenant, session])

  const handleSubmit = async () => {
    if (!tenant) return
    if (!form.studentId || !form.reason) return toast({ title: "Lengkapi semua field", variant: "destructive" })
    setSubmitting(true)
    try {
      const res = await fetch("/api/attendance/permits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId: tenant.id, ...form }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast({ title: "Pengajuan izin berhasil dikirim!" })
      setShowForm(false)
      router.refresh()
    } catch (err: any) {
      toast({ title: "Gagal", description: err.message, variant: "destructive" })
    } finally {
      setSubmitting(false)
    }
  }

  const statusCfg: Record<string, { color: string; label: string; icon: any }> = {
    PENDING: { color: "bg-amber-500/10 text-amber-600 border-amber-200", label: "Menunggu", icon: Clock },
    APPROVED: { color: "bg-emerald-500/10 text-emerald-600 border-emerald-200", label: "Disetujui", icon: CheckCircle },
    REJECTED: { color: "bg-red-500/10 text-red-600 border-red-200", label: "Ditolak", icon: XCircle },
  }

  return (
    <div className="pb-12 space-y-5">
      <div className="bg-primary rounded-b-[2.5rem] pt-8 pb-16 px-6">
        <h1 className="text-white font-bold text-xl mb-1">Izin / Sakit</h1>
        <p className="text-white/70 text-sm">Kirim surat izin digital ke sekolah.</p>
      </div>

      <div className="px-5 -mt-10 space-y-4">
        <Button className="w-full rounded-2xl h-13 shadow-lg shadow-primary/30" onClick={() => setShowForm(!showForm)}>
          <Plus className="mr-2 h-5 w-5" /> Ajukan Izin / Sakit Baru
        </Button>

        {showForm && (
          <Card className="glass border-0">
            <CardContent className="p-5 space-y-4">
              <p className="font-bold">Form Pengajuan</p>

              <div className="space-y-2">
                <Label>Siswa *</Label>
                <Select value={form.studentId} onValueChange={v => setForm(f => ({ ...f, studentId: v }))}>
                  <SelectTrigger className="rounded-xl"><SelectValue placeholder="Pilih anak..." /></SelectTrigger>
                  <SelectContent>
                    {myChildren.map((c: any) => (
                      <SelectItem key={c.id} value={c.id}>{c.name} — {c.classroom?.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Jenis *</Label>
                <div className="flex gap-2">
                  {["IZIN", "SAKIT"].map(t => (
                    <Button
                      key={t}
                      variant={form.type === t ? "default" : "outline"}
                      className="rounded-xl flex-1"
                      onClick={() => setForm(f => ({ ...f, type: t }))}
                    >{t}</Button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Mulai *</Label>
                  <Input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} className="rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label>Sampai *</Label>
                  <Input type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} className="rounded-xl" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Alasan *</Label>
                <Textarea
                  placeholder="Tuliskan alasan dengan jelas..."
                  value={form.reason}
                  onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
                  className="rounded-xl min-h-[80px]"
                />
              </div>

              <div className="flex gap-2">
                <Button className="flex-1 rounded-xl" disabled={submitting} onClick={handleSubmit}>
                  {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                  Kirim Pengajuan
                </Button>
                <Button variant="outline" className="rounded-xl" onClick={() => setShowForm(false)}>Batal</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* History */}
        <div>
          <p className="font-bold mb-3 text-sm">Riwayat Pengajuan</p>
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : myPermits.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-8">Belum ada pengajuan izin.</p>
          ) : myPermits.map(p => {
            const cfg = statusCfg[p.status] || statusCfg.PENDING
            const Icon = cfg.icon
            return (
              <Card key={p.id} className="glass border-0 shadow-sm mb-3">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${cfg.color.split(" ").slice(2).join(" ")}`}>
                    <Icon className={`h-5 w-5 ${cfg.color.split(" ")[1]}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-sm">{p.student?.name}</p>
                      <Badge className={`${cfg.color} border text-[10px]`}>{cfg.label}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {p.type} · {format(new Date(p.startDate), "d MMM", { locale: localeId })}
                      {p.startDate !== p.endDate && ` s/d ${format(new Date(p.endDate), "d MMM yyyy", { locale: localeId })}`}
                    </p>
                    <p className="text-xs text-muted-foreground italic mt-0.5 truncate">"{p.reason}"</p>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
