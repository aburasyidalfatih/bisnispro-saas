"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { toast } from "@/hooks/use-toast"
import {
  BookOpen, Plus, Edit2, Trash2, Loader2, Search, CheckCircle, XCircle
} from "lucide-react"
import { cn } from "@/lib/utils"

import { createSubject, updateSubject, deleteSubject } from "@/features/academic/actions/academic.action"

interface Subject {
  id: string; name: string; code: string | null; description: string | null; isActive: boolean
}

export default function SubjectsPage() {
  const { data: session } = useSession()
  const tenant = session?.user?.tenants?.[0]
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [form, setForm] = useState({ name: "", code: "", description: "" })
  const [editing, setEditing] = useState<Subject | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)

  const load = async () => {
    if (!tenant) return
    setLoading(true)
    try {
      const res = await fetch(`/api/subjects?tenantId=${tenant.id}`)
      const data = await res.json()
      if (!res.ok) {
        toast({ title: "Error memuat data", description: data.error, variant: "destructive" })
      }
      setSubjects(data.subjects || [])
    } catch (e: any) {
      toast({ title: "Error jaringan", description: e.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [tenant?.id])

  const resetForm = () => {
    setForm({ name: "", code: "", description: "" })
    setEditing(null)
    setShowForm(false)
  }

  const handleSave = async () => {
    if (!form.name.trim() || !tenant) return
    setSaving(true)
    try {
      let result;
      if (editing) {
        result = await updateSubject(editing.id, { tenantId: tenant.id, ...form })
      } else {
        result = await createSubject({ tenantId: tenant.id, ...form })
      }

      if (result?.error) {
        toast({ title: "Gagal", description: result.error, variant: "destructive" })
        setSaving(false)
        return
      }

      toast({ title: editing ? "Berhasil diperbarui" : "Mata pelajaran ditambahkan" })
      await load()
      resetForm()
    } catch (e: any) {
      toast({ title: "Gagal", description: e.message, variant: "destructive" })
    }
    setSaving(false)
  }

  const handleDelete = async () => {
    if (!deleteId || !tenant) return
    try {
      await deleteSubject(deleteId, tenant.id)
      toast({ title: "Mata pelajaran dihapus" })
      setDeleteId(null)
      await load()
    } catch(e: any) {
      toast({ title: "Gagal menghapus", description: e.message, variant: "destructive" })
    }
  }

  const filtered = subjects.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.code || "").toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mata Pelajaran</h1>
          <p className="text-muted-foreground">Kelola daftar mata pelajaran yang tersedia</p>
        </div>
        <Button className="gap-2 btn-gradient" onClick={() => { resetForm(); setShowForm(true) }}>
          <Plus className="h-4 w-4" /> Tambah Mapel
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <Card className="glass border-0 border-l-4 border-l-primary animate-in slide-in-from-top-2">
          <CardHeader className="pb-4">
            <CardTitle className="text-base">{editing ? "Edit Mata Pelajaran" : "Tambah Mata Pelajaran Baru"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Nama Mata Pelajaran <span className="text-destructive">*</span></Label>
                <Input placeholder="Matematika" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Kode (Opsional)</Label>
                <Input placeholder="MTK" value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Deskripsi (Opsional)</Label>
              <Input placeholder="Deskripsi singkat mata pelajaran..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={saving || !form.name.trim()} className="btn-gradient">
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {editing ? "Simpan Perubahan" : "Tambahkan"}
              </Button>
              <Button variant="outline" onClick={resetForm}>Batal</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input className="pl-10" placeholder="Cari mata pelajaran..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* List */}
      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[1,2,3,4,5,6].map(i => <div key={i} className="skeleton h-20 rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="glass border-0">
          <CardContent className="p-12 text-center">
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">
              {search ? "Tidak ada hasil pencarian" : "Belum ada mata pelajaran. Tambahkan yang pertama!"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(subject => (
            <Card key={subject.id} className="glass border-0 hover-lift group">
              <CardContent className="p-4 flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                    <BookOpen className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate">{subject.name}</p>
                    {subject.code && (
                      <Badge variant="outline" className="text-[10px] mt-1 font-mono">{subject.code}</Badge>
                    )}
                    {subject.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{subject.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg"
                    onClick={() => { setEditing(subject); setForm({ name: subject.name, code: subject.code || "", description: subject.description || "" }); setShowForm(true) }}>
                    <Edit2 className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg text-destructive hover:text-destructive"
                    onClick={() => setDeleteId(subject.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground text-center">{subjects.length} mata pelajaran terdaftar</p>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        title="Hapus Mata Pelajaran?"
        description="Tindakan ini tidak dapat dibatalkan. Jadwal yang menggunakan mapel ini juga akan terhapus."
        onConfirm={handleDelete}
        confirmText="Hapus"
        variant="destructive"
      />
    </div>
  )
}
