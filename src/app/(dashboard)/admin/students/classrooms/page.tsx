"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BookOpen, Plus, Users, Edit2, Trash2, Loader2, ChevronRight, GraduationCap } from "lucide-react"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function ClassroomsPage() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const tenant = session?.user?.tenants?.[0]
  const [classrooms, setClassrooms] = useState<any[]>([])
  const [staffList, setStaffList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: "", level: "", capacity: 30, waliKelasId: "none" })
  const [saving, setSaving] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const fetchClassrooms = async () => {
    if (!tenant) return
    setLoading(true)
    const [resClass, resStaff] = await Promise.all([
      fetch(`/api/classrooms?tenantId=${tenant.id}`),
      fetch(`/api/gtk/staff?tenantId=${tenant.id}`)
    ])
    setClassrooms(await resClass.json())
    const staffData = await resStaff.json()
    setStaffList(staffData.staff || [])
    setLoading(false)
  }

  useEffect(() => { fetchClassrooms() }, [tenant])

  const handleSave = async () => {
    if (!tenant || !form.name) return toast({ title: "Nama kelas wajib diisi", variant: "destructive" })
    setSaving(true)
    try {
      const payload = { 
        tenantId: tenant.id, 
        ...form, 
        capacity: Number(form.capacity),
        waliKelasId: form.waliKelasId === "none" ? null : form.waliKelasId 
      }
      
      let res;
      if (editId) {
        res = await fetch(`/api/classrooms/${editId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      } else {
        res = await fetch("/api/classrooms/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      }

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Gagal menyimpan kelas")
      }

      toast({ title: editId ? "Kelas diperbarui!" : "Kelas ditambahkan!" })
      setShowForm(false)
      setEditId(null)
      setForm({ name: "", level: "", capacity: 30, waliKelasId: "none" })
      fetchClassrooms()
    } catch (err: any) {
      toast({ title: "Gagal", description: err.message, variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (c: any) => {
    setEditId(c.id)
    setForm({ name: c.name, level: c.level || "", capacity: c.capacity, waliKelasId: c.waliKelasId || "none" })
    setShowForm(true)
  }

  const handleDeleteConfirm = async () => {
    if (!deleteId || !tenant) return
    await fetch(`/api/classrooms/${deleteId}?tenantId=${tenant.id}`, { method: "DELETE" })
    toast({ title: "Kelas dihapus" })
    setDeleteId(null)
    fetchClassrooms()
  }

  const totalStudents = classrooms.reduce((a, c) => a + (c._count?.students || 0), 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Kelas & Rombel</h1>
          <p className="text-sm text-muted-foreground">Kelola rombongan belajar dan penempatan siswa.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/students"><Button variant="outline" className="rounded-xl gap-2"><GraduationCap className="h-4 w-4" /> Data Siswa</Button></Link>
          <Button className="rounded-xl gap-2" onClick={() => { setShowForm(!showForm); setEditId(null); setForm({ name: "", level: "", capacity: 30, waliKelasId: "none" }) }}>
            <Plus className="h-4 w-4" /> Tambah Kelas
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Kelas", value: classrooms.length, icon: BookOpen },
          { label: "Total Siswa", value: totalStudents, icon: Users },
          { label: "Rata-rata/Kelas", value: classrooms.length ? Math.round(totalStudents / classrooms.length) : 0, icon: GraduationCap },
        ].map((s, i) => (
          <Card key={i} className="glass border-0 shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <s.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="font-black text-xl">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Form */}
      {showForm && (
        <Card className="glass border-0 border-primary/20">
          <CardContent className="p-5 space-y-4">
            <p className="font-bold text-sm">{editId ? "Edit Kelas" : "Tambah Kelas Baru"}</p>
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2 md:col-span-1 space-y-2">
                <Label>Nama Kelas *</Label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="VII A / 10 IPA 1 / Kelas 4B" className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label>Wali Kelas</Label>
                <Select value={form.waliKelasId} onValueChange={v => setForm(f => ({ ...f, waliKelasId: v }))}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Pilih Wali Kelas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">-- Tanpa Wali Kelas --</SelectItem>
                    {staffList.map((s: any) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Level / Tingkat</Label>
                <Input value={form.level} onChange={e => setForm(f => ({ ...f, level: e.target.value }))} placeholder="VII / X / 4" className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label>Kapasitas</Label>
                <Input type="number" value={form.capacity} onChange={e => setForm(f => ({ ...f, capacity: Number(e.target.value) }))} className="rounded-xl" />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={saving} className="rounded-xl">
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Simpan"}
              </Button>
              <Button variant="outline" className="rounded-xl" onClick={() => { setShowForm(false); setEditId(null) }}>Batal</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Grid Kelas */}
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      ) : classrooms.length === 0 ? (
        <Card className="glass border-0">
          <CardContent className="py-20 text-center text-muted-foreground">
            <BookOpen className="h-14 w-14 mx-auto mb-4 opacity-40" />
            <p>Belum ada kelas. Tambahkan kelas pertama!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {classrooms.map((c: any) => {
            const fillPct = Math.round(((c._count?.students || 0) / (c.capacity || 30)) * 100)
            return (
              <Card key={c.id} className="glass border-0 shadow-sm hover:shadow-md transition-all group">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-lg">{c.name}</h3>
                      {c.level && <p className="text-xs text-muted-foreground">Tingkat {c.level}</p>}
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg" onClick={() => handleEdit(c)}>
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg text-red-500 hover:bg-red-50" onClick={() => setDeleteId(c.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-end justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="font-black text-2xl">{c._count?.students || 0}</span>
                      <span className="text-muted-foreground text-sm">/ {c.capacity} siswa</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{fillPct}%</span>
                  </div>

                  <div className="w-full bg-muted rounded-full h-2 overflow-hidden mb-4">
                    <div
                      className={`h-full rounded-full transition-all ${fillPct >= 90 ? "bg-red-500" : fillPct >= 70 ? "bg-amber-500" : "bg-emerald-500"}`}
                      style={{ width: `${Math.min(fillPct, 100)}%` }}
                    />
                  </div>

                  {c.waliKelas && (
                    <p className="text-xs text-muted-foreground mb-3">Wali: {c.waliKelas.name}</p>
                  )}

                  <Link href={`/admin/students/classrooms/${c.id}`}>
                    <Button variant="outline" className="w-full rounded-xl text-xs h-8 gap-1">
                      Lihat Siswa <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Hapus Kelas?"
        description="Tindakan ini tidak dapat dibatalkan. Siswa dalam kelas ini akan dipindah menjadi 'Tanpa Kelas'."
        onConfirm={handleDeleteConfirm}
        confirmText="Hapus"
        variant="destructive"
      />
    </div>
  )
}
