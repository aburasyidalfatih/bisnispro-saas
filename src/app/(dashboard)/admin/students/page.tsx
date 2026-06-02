"use client"

import { useEffect, useState } from"react"
import { useSession } from"next-auth/react"
import { useToast } from"@/hooks/use-toast"
import { Card, CardContent } from"@/components/ui/card"
import { Button } from"@/components/ui/button"
import { Input } from"@/components/ui/input"
import { Badge } from"@/components/ui/badge"
import { Label } from"@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from"@/components/ui/select"
import {
  GraduationCap, Search, Filter, Plus, Loader2,
  Wallet, BookOpen, MoreHorizontal, UserCheck, ChevronRight, Printer, Download, Trash2
} from"lucide-react"
import Link from"next/link"
import { cn } from"@/lib/utils"
import { format } from"date-fns"
import { id as localeId } from"date-fns/locale"
import { ConfirmDialog } from"@/components/shared/confirm-dialog"

import * as XLSX from"xlsx"

export default function StudentsPage() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const tenant = session?.user?.tenants?.[0]
  const [students, setStudents] = useState<any[]>([])
  const [classrooms, setClassrooms] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [search, setSearch] = useState("")
  const [classFilter, setClassFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("active")
  const [page, setPage] = useState(1)
  const [meta, setMeta] = useState({ total: 0, totalPages: 1 })
  const [showAdd, setShowAdd] = useState(false)
  const [addLoading, setAddLoading] = useState(false)

  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!tenant) return
    setAddLoading(true)
    const fd = new FormData(e.currentTarget)
    try {
      const res = await fetch("/api/students", {
        method:"POST",
        headers: {"Content-Type":"application/json" },
        body: JSON.stringify({
          tenantId: tenant.id,
          name: fd.get("name"),
          email: fd.get("email"),
          password: fd.get("password"),
          nis: fd.get("nis"),
          gender: fd.get("gender") ||"L",
          classroomId: fd.get("classroomId") !=="none" ? fd.get("classroomId") : undefined
        }),
      })
      const data = await res.json()
      if (res.ok) {
        toast({ title:"Berhasil", description:"Siswa berhasil ditambahkan." })
        setShowAdd(false)
        fetchStudents()
      } else {
        toast({ title:"Gagal", description: data.error ||"Terjadi kesalahan", variant:"destructive" })
      }
    } catch {
      toast({ title:"Gagal", description:"Tidak dapat menghubungi server", variant:"destructive" })
    } finally {
      setAddLoading(false)
    }
  }

  const fetchStudents = async () => {
    if (!tenant) return
    setLoading(true)
    try {
      const params = new URLSearchParams({
        tenantId: tenant.id,
        take:"20",
        page: String(page),
        ...(search ? { search } : {}),
        ...(classFilter !=="all" ? { classroomId: classFilter } : {}),
      })
      const res = await fetch(`/api/students?${params}`)
      const data = await res.json()
      setStudents(data.data || [])
      setMeta(data.meta || { total: data.total || 0, totalPages: 1 })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!tenant) return
    fetch(`/api/classrooms?tenantId=${tenant.id}`)
      .then(r => r.json()).then(setClassrooms).catch(console.error)
  }, [tenant])

  useEffect(() => { fetchStudents() }, [tenant, page, classFilter])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchStudents()
  }

  const handleDelete = async (studentId: string, studentName: string) => {
    if (!tenant) return
    
    try {
      const res = await fetch(`/api/students/${studentId}?tenantId=${tenant.id}`, {
        method:"DELETE",
      })
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error ||"Gagal menghapus siswa")
      }
      toast({ title:"Berhasil", description: `Data siswa ${studentName} telah dihapus permanen.` })
      fetchStudents()
    } catch (err: any) {
      toast({ title:"Gagal Menghapus", description: err.message, variant:"destructive" })
    }
  }

  const handleExport = async () => {
    if (!tenant) return
    setExporting(true)
    try {
      // Fetch ALL students for export without pagination
      const params = new URLSearchParams({
        tenantId: tenant.id,
        take:"99999", // get all
        ...(search ? { search } : {}),
        ...(classFilter !=="all" ? { classroomId: classFilter } : {}),
      })
      const res = await fetch(`/api/students?${params}`)
      const json = await res.json()
      const allData = json.data || []
      
      const formattedData = allData.map((s: any) => ({"NIS": s.nis ||"","NISN": s.nisn ||"","Nama Lengkap": s.name,"Gender": s.gender ==="L" ?"Laki-laki" : s.gender ==="P" ?"Perempuan" :"-","Kelas": s.classroom?.name ||"-","Status": s.isActive ?"Aktif" :"Nonaktif","Saldo Tabungan (Rp)": s.walletAccount?.balance || 0,
      }))
      
      const worksheet = XLSX.utils.json_to_sheet(formattedData)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet,"Data Siswa")
      
      XLSX.writeFile(workbook, `Data_Siswa_${tenant.name.replace(/\s+/g, '_')}_${format(new Date(), 'yyyyMMdd')}.xlsx`)
      toast({ title:"Berhasil", description:"File Excel berhasil diunduh" })
    } catch (e: any) {
      toast({ title:"Gagal Ekspor", description: e.message, variant:"destructive" })
    } finally {
      setExporting(false)
    }
  }

  const totalStudents = students.length
  const withWallet = students.filter(s => s.walletAccount).length
  const totalBalance = students.reduce((a: number, s: any) => a + (s.walletAccount?.balance || 0), 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Data Siswa</h1>
          <p className="text-sm text-muted-foreground">Kelola seluruh data siswa aktif dan riwayatnya.</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={handleExport} 
            disabled={exporting}
            variant="outline" 
            className="rounded-xl gap-2 hidden sm:flex border-emerald-200 text-emerald-700 hover:bg-emerald-50"
          >
            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} 
            Ekspor Excel
          </Button>
          <Link href="/admin/students/print-cards">
            <Button variant="outline" className="rounded-xl gap-2 hidden sm:flex border-indigo-200 text-indigo-700 hover:bg-indigo-50"><Printer className="h-4 w-4" /> Cetak ID Card (QR)</Button>
          </Link>
          <Link href="/admin/students/classrooms">
            <Button variant="outline" className="rounded-xl gap-2 hidden sm:flex"><BookOpen className="h-4 w-4" /> Kelas</Button>
          </Link>
          <Link href="/admin/students/import">
            <Button variant="outline" className="rounded-xl gap-2 hidden sm:flex">Import</Button>
          </Link>
          <Button onClick={() => setShowAdd(!showAdd)} className="rounded-xl gap-2 hidden sm:flex btn-gradient text-white border-0"><Plus className="h-4 w-4" /> Tambah Siswa</Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label:"Total Siswa", value: meta.total || totalStudents, icon: GraduationCap, color:"text-primary bg-primary/10" },
          { label:"Punya Wallet", value: withWallet, icon: Wallet, color:"text-indigo-600 bg-indigo-500/10" },
          { label:"Total Saldo", value: `Rp ${totalBalance.toLocaleString("id-ID")}`, icon: Wallet, color:"text-emerald-600 bg-emerald-500/10" },
          { label:"Jumlah Kelas", value: classrooms.length, icon: BookOpen, color:"text-amber-600 bg-amber-500/10" },
        ].map((s, i) => (
          <Card key={i} className="glass border-0 shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${s.color}`}>
                <s.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="font-black text-lg">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Add Form */}
      {showAdd && (
        <Card className="glass border-0 p-6 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Formulir Singkat Siswa</h3>
            <Link href="/admin/students/new">
              <Button variant="link" className="text-primary p-0 h-auto text-sm">Buka Form Lengkap &rarr;</Button>
            </Link>
          </div>
          <form onSubmit={handleAdd} className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label>Nama Lengkap</Label>
              <Input name="name" placeholder="Nama lengkap siswa" required className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label>NIS</Label>
              <Input name="nis" placeholder="Nomor Induk Siswa" className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label>Jenis Kelamin</Label>
              <Select name="gender" defaultValue="L">
                <SelectTrigger className="rounded-xl"><SelectValue placeholder="Pilih..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="L">Laki-laki</SelectItem>
                  <SelectItem value="P">Perempuan</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Kelas</Label>
              <Select name="classroomId" defaultValue="none">
                <SelectTrigger className="rounded-xl"><SelectValue placeholder="Belum ada kelas" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">-- Belum ada kelas --</SelectItem>
                  {classrooms.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Email (Opsional)</Label>
              <Input name="email" type="email" placeholder="Untuk login aplikasi" className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label>Password (Opsional)</Label>
              <Input name="password" type="password" placeholder="Biarkan kosong untuk random password" className="rounded-xl" />
            </div>
            <div className="flex items-end gap-2 lg:col-span-3">
              <Button type="submit" className="btn-gradient text-white border-0 rounded-xl px-8" disabled={addLoading}>
                {addLoading ?"Menyimpan..." :"Simpan Cepat"}
              </Button>
              <Button type="button" variant="outline" className="rounded-xl" onClick={() => setShowAdd(false)}>
                Batal
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Filters */}
      <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari nama, NIS, NISN..."
            className="pl-9 rounded-xl glass border-0"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <Select value={classFilter} onValueChange={v => { setClassFilter(v); setPage(1) }}>
          <SelectTrigger className="w-44 rounded-xl glass border-0">
            <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder="Semua Kelas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Kelas</SelectItem>
            {classrooms.map((c: any) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button type="submit" className="rounded-xl shrink-0">Cari</Button>
      </form>

      {/* Table */}
      <Card className="glass border-0 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
          ) : students.length === 0 ? (
            <div className="py-20 text-center text-muted-foreground">
              <GraduationCap className="h-12 w-12 mx-auto mb-4 opacity-40" />
              <p>Tidak ada siswa ditemukan.</p>
              <p className="text-sm mt-1">Sinkronisasi dari PPDB atau import via Excel.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-muted/40">
                <tr>
                  {["Siswa","NIS / NISN","Kelas","Orang Tua","Wallet","Status",""].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {students.map(student => (
                  <tr key={student.id} className="hover:bg-white/50 dark:hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 font-bold text-primary text-sm">
                          {student.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold">{student.name}</p>
                          <p className="text-xs text-muted-foreground">{student.gender ==="L" ?"Laki-laki" : student.gender ==="P" ?"Perempuan" :"—"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-mono text-xs">{student.nis ||"—"}</p>
                      <p className="font-mono text-xs text-muted-foreground">{student.nisn ||"—"}</p>
                    </td>
                    <td className="px-4 py-3">
                      {student.classroom
                        ? <Badge className="bg-blue-500/10 text-blue-600 border-blue-200 border text-[10px]">{student.classroom.name}</Badge>
                        : <span className="text-muted-foreground text-xs">—</span>
                      }
                    </td>
                    <td className="px-4 py-3">
                      {student.parents?.length > 0
                        ? <span className="flex items-center gap-1 text-xs"><UserCheck className="h-3.5 w-3.5 text-emerald-600" />{student.parents.length} ortu</span>
                        : <span className="text-muted-foreground text-xs">—</span>
                      }
                    </td>
                    <td className="px-4 py-3">
                      {student.walletAccount
                        ? <span className="font-semibold text-emerald-600 text-xs">Rp {student.walletAccount.balance.toLocaleString("id-ID")}</span>
                        : <span className="text-muted-foreground text-xs">Belum ada</span>
                      }
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={student.isActive ?"bg-emerald-500/10 text-emerald-600 border-emerald-200 border text-[10px]" :"bg-slate-500/10 text-slate-500 border text-[10px]"}>
                        {student.isActive ?"Aktif" :"Nonaktif"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 justify-end">
                        <Link href={`/admin/students/${student.id}`}>
                          <Button size="sm" variant="outline" className="rounded-lg text-xs h-8 gap-1">
                            Detail <ChevronRight className="h-3 w-3" />
                          </Button>
                        </Link>
                        <ConfirmDialog
                          trigger={
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg shrink-0">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          }
                          title={`Hapus ${student.name}?`}
                          description={`Anda yakin ingin menghapus data siswa"${student.name}"? Data hanya dapat dihapus jika siswa belum memiliki riwayat absensi, ujian, atau tagihan. Tindakan ini tidak dapat dibatalkan.`}
                          confirmText="Ya, Hapus"
                          onConfirm={() => handleDelete(student.id, student.name)}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {meta.totalPages > 1 && (
          <div className="flex justify-center items-center gap-3 py-4 border-t border-border/50">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Sebelumnya</Button>
            <span className="text-sm text-muted-foreground">Hal {page} / {meta.totalPages}</span>
            <Button variant="outline" size="sm" disabled={page >= meta.totalPages} onClick={() => setPage(p => p + 1)}>Selanjutnya</Button>
          </div>
        )}
      </Card>
    </div>
  )
}
