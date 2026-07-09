"use client"

import { use, useEffect, useState } from"react"
import { useSession } from"next-auth/react"
import { useToast } from"@/hooks/use-toast"
import { Card, CardContent, CardHeader, CardTitle } from"@/components/ui/card"
import { Button } from"@/components/ui/button"
import { Input } from"@/components/ui/input"
import { Label } from"@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from"@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from"@/components/ui/tabs"
import { Badge } from"@/components/ui/badge"
import { useToast as useT } from"@/hooks/use-toast"
import {
  ArrowLeft, Save, Loader2, GraduationCap, Wallet,
  Receipt, UserCheck, Phone, Calendar, MapPin
} from"lucide-react"
import Link from"next/link"
import { format } from"date-fns"
import { id as localeId } from"date-fns/locale"

export default function StudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data: session } = useSession()
  const { toast } = useToast()
  const tenant = session?.user?.tenants?.[0]
  const [student, setStudent] = useState<any>(null)
  const [classrooms, setClassrooms] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<any>({})

  useEffect(() => {
    if (!tenant) return
    Promise.all([
      fetch(`/api/students/${id}?tenantId=${tenant.id}`).then(r => r.json()),
      fetch(`/api/classrooms?tenantId=${tenant.id}`).then(r => r.json()),
    ]).then(([studentData, classData]) => {
      setStudent(studentData)
      setForm({
        name: studentData.name ||"",
        nis: studentData.nis ||"",
        nisn: studentData.nisn ||"",
        gender: studentData.gender ||"",
        birthPlace: studentData.birthPlace ||"",
        birthDate: studentData.birthDate ? new Date(studentData.birthDate).toISOString().split("T")[0] :"",
        address: studentData.address ||"",
        phone: studentData.phone ||"",
        email: studentData.email ||"",
        fatherName: studentData.fatherName ||"",
        motherName: studentData.motherName ||"",
        guardianName: studentData.guardianName ||"",
        classroomId: studentData.classroomId ||"",
      })
      setClassrooms(Array.isArray(classData) ? classData : [])
    }).catch(console.error).finally(() => setLoading(false))
  }, [id, tenant])

  const handleSave = async () => {
    if (!tenant) return
    setSaving(true)
    try {
      const res = await fetch(`/api/students/${id}`, {
        method:"PATCH",
        headers: {"Content-Type":"application/json" },
        body: JSON.stringify({ tenantId: tenant.id, ...form }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      toast({ title:"Data siswa berhasil disimpan!" })
    } catch (err: any) {
      toast({ title:"Gagal", description: err.message, variant:"destructive" })
    } finally {
      setSaving(false)
    }
  }

  const statusCfg: Record<string, { label: string; color: string }> = {
    UNPAID: { label:"Belum Bayar", color:"bg-red-500/10 text-red-600 border-red-200" },
    PAID: { label:"Lunas", color:"bg-emerald-500/10 text-emerald-600 border-emerald-200" },
    PARTIAL: { label:"Sebagian", color:"bg-amber-500/10 text-amber-600 border-amber-200" },
  }

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
  if (!student) return <div className="py-20 text-center text-muted-foreground">Siswa tidak ditemukan.</div>

  const field = (key: string) => ({
    value: form[key] ||"",
    onChange: (e: any) => setForm((f: any) => ({ ...f, [key]: e.target.value })),
    className:"rounded-xl",
  })

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/admin/students">
          <Button variant="ghost" size="icon" className="rounded-xl"><ArrowLeft className="h-5 w-5" /></Button>
        </Link>
        <div className="flex items-center gap-4 flex-1">
          <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center font-black text-primary text-xl">
            {student.name.charAt(0)}
          </div>
          <div>
            <h1 className="text-xl font-bold">{student.name}</h1>
            <div className="flex gap-2">
              {student.classroom && <Badge className="bg-blue-500/10 text-blue-600 border-blue-200 border text-xs">{student.classroom.name}</Badge>}
              <Badge className={student.isActive ?"bg-emerald-500/10 text-emerald-600 border-emerald-200 border text-xs" :"bg-slate-500/10 text-slate-500 border text-xs"}>
                {student.isActive ?"Aktif" :"Nonaktif"}
              </Badge>
            </div>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving} className="rounded-xl gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Simpan
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label:"Saldo Wallet", value: student.walletAccount ? `Rp ${student.walletAccount.balance.toLocaleString("id-ID")}` :"Belum Ada", icon: Wallet, color:"text-indigo-600" },
          { label:"Total Tagihan", value: student._count?.invoices || 0, icon: Receipt, color:"text-red-600" },
          { label:"Orang Tua", value: `${student.parents?.length || 0} akun`, icon: UserCheck, color:"text-emerald-600" },
          { label:"Absensi", value: student._count?.AttendanceRecord || 0, icon: Calendar, color:"text-amber-600" },
        ].map((s, i) => (
          <Card key={i} className="glass border-0 shadow-sm">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
              <p className={`font-black ${s.color}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="data">
        <TabsList className="glass border-0">
          <TabsTrigger value="data">Data Diri</TabsTrigger>
          <TabsTrigger value="invoices">Tagihan ({student._count?.invoices || 0})</TabsTrigger>
          <TabsTrigger value="parents">Orang Tua ({student.parents?.length || 0})</TabsTrigger>
        </TabsList>

        {/* Data Diri */}
        <TabsContent value="data">
          <Card className="glass border-0">
            <CardHeader><CardTitle className="text-sm">Informasi Siswa</CardTitle></CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-5">
              <F label="Nama Lengkap *"><Input {...field("name")} /></F>
              <F label="Kelas">
                <Select value={form.classroomId ||"none"} onValueChange={v => setForm((f: any) => ({ ...f, classroomId: v ==="none" ? null : v }))}>
                  <SelectTrigger className="rounded-xl"><SelectValue placeholder="Pilih kelas..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Tanpa Kelas</SelectItem>
                    {classrooms.map((c: any) => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}
                  </SelectContent>
                </Select>
              </F>
              <F label="NIS"><Input {...field("nis")} placeholder="Nomor Induk Siswa" /></F>
              <F label="NISN"><Input {...field("nisn")} placeholder="Nomor Induk Siswa Nasional" /></F>
              <F label="Jenis Kelamin">
                <Select value={form.gender ||""} onValueChange={v => setForm((f: any) => ({ ...f, gender: v }))}>
                  <SelectTrigger className="rounded-xl"><SelectValue placeholder="Pilih..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="L">Laki-laki</SelectItem>
                    <SelectItem value="P">Perempuan</SelectItem>
                  </SelectContent>
                </Select>
              </F>
              <F label="Tanggal Lahir"><Input type="date" {...field("birthDate")} /></F>
              <F label="Tempat Lahir"><Input {...field("birthPlace")} /></F>
              <F label="No. Telepon"><Input {...field("phone")} placeholder="08xxx" /></F>
              <F label="Email"><Input type="email" {...field("email")} /></F>
              <F label="Nama Ayah"><Input {...field("fatherName")} /></F>
              <F label="Nama Ibu"><Input {...field("motherName")} /></F>
              <F label="Nama Wali"><Input {...field("guardianName")} /></F>
              <div className="col-span-2">
                <F label="Alamat"><Input {...field("address")} /></F>
              </div>
            </CardContent>
          </Card>
          <Button className="w-full rounded-xl mt-4" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Simpan Perubahan
          </Button>
        </TabsContent>

        {/* Tagihan */}
        <TabsContent value="invoices">
          <div className="space-y-3">
            {student.invoices?.length === 0 ? (
              <Card className="glass border-0"><CardContent className="py-12 text-center text-muted-foreground">Belum ada tagihan.</CardContent></Card>
            ) : student.invoices?.map((inv: any) => {
              const cfg = statusCfg[inv.status] || statusCfg.UNPAID
              return (
                <Card key={inv.id} className="glass border-0 shadow-sm">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-sm">{inv.title}</p>
                      <p className="text-xs text-muted-foreground font-mono">{inv.code} · {format(new Date(inv.dueDate),"d MMM yyyy", { locale: localeId })}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="font-black text-sm">Rp {inv.amount.toLocaleString("id-ID")}</p>
                      <Badge className={`${cfg.color} border text-[10px]`}>{cfg.label}</Badge>
                      <Link href={`/admin/finance/invoice/${inv.id}`}>
                        <Button size="sm" variant="outline" className="rounded-lg h-7 text-xs">Lihat</Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
            <Link href={`/admin/finance/invoice/create?studentId=${id}`}>
              <Button variant="outline" className="w-full rounded-xl border-dashed">+ Tambah Tagihan untuk Siswa Ini</Button>
            </Link>
          </div>
        </TabsContent>

        {/* Orang Tua */}
        <TabsContent value="parents">
          <div className="space-y-3">
            {student.parents?.length === 0 ? (
              <Card className="glass border-0"><CardContent className="py-12 text-center text-muted-foreground">Belum ada orang tua terdaftar.</CardContent></Card>
            ) : student.parents?.map((p: any) => (
              <Card key={p.id} className="glass border-0 shadow-sm">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="h-11 w-11 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                    <UserCheck className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">{p.user?.name ||"—"}</p>
                    <p className="text-xs text-muted-foreground">{p.user?.email} · {p.relation ||"Orang Tua"}</p>
                  </div>
                  {p.user?.phone && (
                    <a href={`tel:${p.user.phone}`}>
                      <Button size="sm" variant="outline" className="rounded-xl gap-1.5 h-8 text-xs">
                        <Phone className="h-3.5 w-3.5" /> {p.user.phone}
                      </Button>
                    </a>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{label}</Label>
      {children}
    </div>
  )
}
