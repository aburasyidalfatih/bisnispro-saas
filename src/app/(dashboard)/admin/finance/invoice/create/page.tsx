"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { Loader2, ArrowLeft, Plus, Trash2, GraduationCap } from "lucide-react"
import Link from "next/link"

type Student = { id: string; name: string; nis?: string; classroom?: { name: string } }
type BillingType = { id: string; name: string; category: string; amount: number }

export default function CreateInvoicePage() {
  const { data: session } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const tenant = session?.user?.tenants?.[0]

  const [students, setStudents] = useState<Student[]>([])
  const [billingTypes, setBillingTypes] = useState<BillingType[]>([])
  const [loading, setLoading] = useState(false)
  const [studentSearch, setStudentSearch] = useState("")

  const [form, setForm] = useState({
    studentId: "",
    billingTypeId: "",
    title: "",
    amount: 0,
    dueDate: "",
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    isAutoDebet: false,
    notes: "",
  })

  const [installments, setInstallments] = useState<{ dueDate: string; amount: number }[]>([])
  const [useInstallment, setUseInstallment] = useState(false)

  useEffect(() => {
    if (!tenant) return
    fetch(`/api/finance/billing-types?tenantId=${tenant.id}`)
      .then(r => r.json()).then(setBillingTypes).catch(console.error)

    fetch(`/api/students?tenantId=${tenant.id}&take=100`)
      .then(r => r.json()).then(d => setStudents(d.data || d)).catch(console.error)
  }, [tenant])

  const handleBillingTypeChange = (id: string) => {
    const bt = billingTypes.find(b => b.id === id)
    if (bt) setForm(f => ({ ...f, billingTypeId: id, title: bt.name, amount: bt.amount }))
  }

  const addInstallment = () => {
    setInstallments(prev => [...prev, { dueDate: "", amount: 0 }])
  }

  const handleSubmit = async () => {
    if (!tenant) return
    if (!form.studentId) return toast({ title: "Pilih siswa terlebih dahulu", variant: "destructive" })
    if (!form.title || !form.amount || !form.dueDate) return toast({ title: "Lengkapi semua field", variant: "destructive" })

    setLoading(true)
    try {
      const body = {
        tenantId: tenant.id,
        ...form,
        amount: Number(form.amount),
        month: Number(form.month),
        year: Number(form.year),
        installments: useInstallment ? installments.map(i => ({ ...i, amount: Number(i.amount) })) : undefined,
      }
      const res = await fetch("/api/finance/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error?.message || "Gagal membuat tagihan")
      toast({ title: "Tagihan berhasil dibuat!" })
      router.push("/admin/finance/invoice")
    } catch (err: any) {
      toast({ title: "Gagal", description: err.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const filteredStudents = studentSearch
    ? students.filter(s => s.name.toLowerCase().includes(studentSearch.toLowerCase()) || s.nis?.includes(studentSearch))
    : students

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      <div className="flex items-center gap-3">
        <Link href="/admin/finance/invoice">
          <Button variant="ghost" size="icon" className="rounded-xl"><ArrowLeft className="h-5 w-5" /></Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Buat Tagihan Baru</h1>
          <p className="text-sm text-muted-foreground">Buat tagihan manual untuk satu siswa.</p>
        </div>
      </div>

      <Card className="glass border-0">
        <CardHeader><CardTitle className="text-base">Data Tagihan</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {/* Siswa */}
          <div className="space-y-2">
            <Label>Siswa *</Label>
            <Input placeholder="Cari nama / NIS..." value={studentSearch} onChange={e => setStudentSearch(e.target.value)} className="rounded-xl" />
            {studentSearch && (
              <div className="border rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                {filteredStudents.slice(0, 8).map(s => (
                  <div
                    key={s.id}
                    className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-primary/5 transition-colors ${form.studentId === s.id ? "bg-primary/10" : ""}`}
                    onClick={() => { setForm(f => ({ ...f, studentId: s.id })); setStudentSearch(s.name) }}
                  >
                    <GraduationCap className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-sm font-semibold">{s.name}</p>
                      <p className="text-xs text-muted-foreground">{s.nis || "—"} · {s.classroom?.name || "Tanpa Kelas"}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Jenis Tagihan */}
          <div className="space-y-2">
            <Label>Jenis Tagihan (Opsional)</Label>
            <Select onValueChange={handleBillingTypeChange}>
              <SelectTrigger className="rounded-xl"><SelectValue placeholder="Pilih template atau isi manual" /></SelectTrigger>
              <SelectContent>
                {billingTypes.map(bt => (
                  <SelectItem key={bt.id} value={bt.id}>{bt.name} — Rp {bt.amount.toLocaleString("id-ID")}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Judul */}
          <div className="space-y-2">
            <Label>Judul Tagihan *</Label>
            <Input placeholder="SPP Januari 2025" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="rounded-xl" />
          </div>

          {/* Nominal */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nominal (Rp) *</Label>
              <Input type="number" placeholder="500000" value={form.amount || ""} onChange={e => setForm(f => ({ ...f, amount: parseInt(e.target.value) || 0 }))} className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label>Jatuh Tempo *</Label>
              <Input type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} className="rounded-xl" />
            </div>
          </div>

          {/* Bulan & Tahun (untuk SPP) */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Bulan (SPP)</Label>
              <Select value={String(form.month)} onValueChange={v => setForm(f => ({ ...f, month: Number(v) }))}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"].map((m, i) => (
                    <SelectItem key={i + 1} value={String(i + 1)}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tahun</Label>
              <Input type="number" value={form.year} onChange={e => setForm(f => ({ ...f, year: parseInt(e.target.value) }))} className="rounded-xl" />
            </div>
          </div>

          {/* Auto Debet */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/20">
            <div>
              <p className="font-semibold text-sm">Auto-Debet Wallet</p>
              <p className="text-xs text-muted-foreground">Saldo wallet siswa dipotong otomatis saat jatuh tempo</p>
            </div>
            <Switch checked={form.isAutoDebet} onCheckedChange={v => setForm(f => ({ ...f, isAutoDebet: v }))} />
          </div>

          {/* Cicilan */}
          <div className="flex items-center justify-between p-4 rounded-xl border border-border">
            <div>
              <p className="font-semibold text-sm">Aktifkan Cicilan</p>
              <p className="text-xs text-muted-foreground">Bagi tagihan menjadi beberapa termin</p>
            </div>
            <Switch checked={useInstallment} onCheckedChange={setUseInstallment} />
          </div>

          {useInstallment && (
            <div className="space-y-3 p-4 rounded-xl border border-border bg-muted/30">
              <p className="text-sm font-bold">Jadwal Cicilan</p>
              {installments.map((ins, i) => (
                <div key={i} className="flex gap-3 items-center">
                  <Input type="date" value={ins.dueDate} onChange={e => setInstallments(prev => prev.map((p, j) => j === i ? { ...p, dueDate: e.target.value } : p))} className="rounded-xl" />
                  <Input type="number" placeholder="Nominal" value={ins.amount || ""} onChange={e => setInstallments(prev => prev.map((p, j) => j === i ? { ...p, amount: parseInt(e.target.value) || 0 } : p))} className="rounded-xl" />
                  <Button variant="ghost" size="icon" onClick={() => setInstallments(prev => prev.filter((_, j) => j !== i))}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                </div>
              ))}
              <Button variant="outline" size="sm" className="rounded-xl" onClick={addInstallment}><Plus className="h-4 w-4 mr-2" /> Tambah Cicilan</Button>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label>Catatan (Opsional)</Label>
            <Input placeholder="Catatan untuk orang tua..." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="rounded-xl" />
          </div>
        </CardContent>
      </Card>

      <Button className="w-full rounded-xl h-12 font-bold" disabled={loading} onClick={handleSubmit}>
        {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Simpan Tagihan"}
      </Button>
    </div>
  )
}
