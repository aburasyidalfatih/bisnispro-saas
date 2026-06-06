"use client"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

import { useEffect, useState } from"react"
import { useSession } from"next-auth/react"
import { Button } from"@/components/ui/button"
import { Eye, Users, Search, Trash2, FileSpreadsheet } from"lucide-react"
import { Card, CardContent } from"@/components/ui/card"
import { Badge } from"@/components/ui/badge"
import { Input } from"@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from"@/components/ui/select"
import { format } from"date-fns"
import { id as localeId } from"date-fns/locale"
import Link from"next/link"
import { useConfirm } from"@/components/providers/confirm-provider"

const statusConfig: Record<string, { label: string; class: string }> = {
  MENUNGGU: { label:"Menunggu", class:"bg-amber-500/10 text-amber-600 border-amber-500/20" },
  TERVERIFIKASI: { label:"Terverifikasi", class:"bg-blue-500/10 text-blue-600 border-blue-500/20" },
  DITERIMA: { label:"Diterima", class:"bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
  DITOLAK: { label:"Ditolak", class:"bg-red-500/10 text-red-600 border-red-500/20" },
}

export default function PpdbPendaftarPage() {
  const { data: session } = useSession()
  const [applicants, setApplicants] = useState<any[]>([])
  const [filtered, setFiltered] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [tenantId, setTenantId] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [periodeFilter, setPeriodeFilter] = useState("ALL")
  const [periods, setPeriods] = useState<any[]>([])
  const { confirm } = useConfirm()

  useEffect(() => {
    const tid = session?.user?.tenants?.[0]?.id
    if (tid) setTenantId(tid)
  }, [session])

  useEffect(() => {
    if (!tenantId) return
    fetch(`/api/ppdb/periode?tenantId=${tenantId}`).then(r => r.json()).then(d => setPeriods(Array.isArray(d) ? d : [])).catch(() => {})
  }, [tenantId])

  const fetchApplicants = async () => {
    if (!tenantId) return
    setLoading(true)
    try {
      let url = `/api/ppdb/pendaftar?tenantId=${tenantId}`
      if (statusFilter !=="ALL") url += `&status=${statusFilter}`
      if (periodeFilter !=="ALL") url += `&periodeId=${periodeFilter}`
      const res = await fetch(url)
      const data = await res.json()
      const arr = Array.isArray(data) ? data : []
      setApplicants(arr)
      setFiltered(arr)
    } catch { } finally { setLoading(false) }
  }

  useEffect(() => { fetchApplicants() }, [tenantId, statusFilter, periodeFilter])

  useEffect(() => {
    if (!search) { setFiltered(applicants); return }
    const q = search.toLowerCase()
    setFiltered(applicants.filter(a => a.namaLengkap?.toLowerCase().includes(q) || a.noPendaftaran?.toLowerCase().includes(q)))
  }, [search, applicants])

  const handleDelete = async (id: string) => {
    const isConfirmed = await confirm({
      title:"Hapus Pendaftar?",
      description:"Apakah Anda yakin ingin menghapus pendaftar ini secara permanen? Semua data tagihan dan berkas terkait akan ikut terhapus.",
      confirmText:"Hapus Sekarang",
      cancelText:"Batal",
      variant:"destructive"
    })
    
    if (!isConfirmed) return;
    
    try {
      const res = await fetch(`/api/ppdb/pendaftar/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setApplicants(prev => prev.filter(a => a.id !== id));
        setFiltered(prev => prev.filter(a => a.id !== id));
        alert("Pendaftar berhasil dihapus secara permanen.");
      } else {
        const data = await res.json().catch(() => ({}));
        alert(`Gagal menghapus pendaftar: ${data.error || 'Server error'}`);
      }
    } catch (e) {
      alert("Terjadi kesalahan sistem saat menghapus. Periksa koneksi internet Anda.");
    }
  }

  const handleExportDapodik = () => {
    if (periodeFilter ==="ALL") {
      alert("Silakan pilih gelombang tertentu terlebih dahulu untuk mengekspor data Dapodik.");
      return;
    }
    window.open(`/api/ppdb/export-dapodik?tenantId=${tenantId}&periodeId=${periodeFilter}`,"_blank");
  }

  const counts = {
    all: applicants.length,
    menunggu: applicants.filter(a => a.status ==="MENUNGGU").length,
    diterima: applicants.filter(a => a.status ==="DITERIMA").length,
    ditolak: applicants.filter(a => a.status ==="DITOLAK").length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Meja Pendaftar</h1>
          <p className="text-muted-foreground mt-1 text-sm">Verifikasi dan kelola seluruh calon siswa yang mendaftar.</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="rounded-xl border-emerald-500 text-emerald-600 hover:bg-emerald-50"
            onClick={handleExportDapodik}
          >
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Export Dapodik
          </Button>
          <Button variant="outline" className="rounded-xl" onClick={fetchApplicants}>Refresh</Button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label:"Total", value: counts.all, color:"text-foreground" },
          { label:"Menunggu", value: counts.menunggu, color:"text-amber-500" },
          { label:"Diterima", value: counts.diterima, color:"text-emerald-500" },
          { label:"Ditolak", value: counts.ditolak, color:"text-red-500" },
        ].map(s => (
          <Card key={s.label} className="glass border-0">
            <CardContent className="p-4 text-center">
              <div className={`text-2xl font-extrabold ${s.color}`}>{s.value}</div>
              <div className="text-[11px] text-muted-foreground font-medium mt-0.5">{s.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table Card */}
      <Card className="glass border-0">
        {/* Filters */}
        <div className="p-4 border-b border-border/50 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari nama atau no. pendaftaran..." className="pl-9 rounded-xl border-0 bg-muted/40" />
          </div>
          <Select value={periodeFilter} onValueChange={setPeriodeFilter}>
            <SelectTrigger className="sm:w-44 rounded-xl border-0 bg-muted/40">
              <SelectValue placeholder="Semua Gelombang" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua Gelombang</SelectItem>
              {periods.map(p => <SelectItem key={p.id} value={p.id}>{p.nama}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="sm:w-40 rounded-xl border-0 bg-muted/40">
              <SelectValue placeholder="Semua Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua Status</SelectItem>
              <SelectItem value="MENUNGGU">Menunggu</SelectItem>
              <SelectItem value="TERVERIFIKASI">Terverifikasi</SelectItem>
              <SelectItem value="DITERIMA">Diterima</SelectItem>
              <SelectItem value="DITOLAK">Ditolak</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        {loading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-12 rounded-xl skeleton" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Users className="h-12 w-12 text-muted-foreground/20 mb-3" />
            <p className="font-medium text-muted-foreground">Belum ada data pendaftar</p>
            <p className="text-sm text-muted-foreground/60 mt-1">Pendaftar akan muncul di sini setelah ada yang mendaftar.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-border/50">
                  <TableHead className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">Pendaftar & Gelombang</TableHead>
                  <TableHead className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">Pendaftaran</TableHead>
                  <TableHead className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">Data & Berkas</TableHead>
                  <TableHead className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">Daftar Ulang</TableHead>
                  <TableHead className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">Status Akhir</TableHead>
                  <TableHead className="text-right text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(a => {
                  const tagihanPendaftaran = a.tagihan?.find((t: any) => t.jenis ==="PENDAFTARAN")
                  const tagihanDU = a.tagihan?.find((t: any) => t.jenis ==="DAFTAR_ULANG")
                  const st = statusConfig[a.status] ?? { label: a.status, class:"bg-muted text-muted-foreground" }
                  
                  return (
                    <TableRow key={a.id} className="hover:bg-muted/30 transition-colors group">
                      {/* Kolom Pendaftar */}
                      <TableCell className="px-4 py-4">
                        <div className="font-semibold text-sm">{a.namaLengkap}</div>
                        <div className="flex items-center gap-1.5 mt-1 text-[11px] text-muted-foreground">
                          <code className="bg-muted px-1.5 py-0.5 rounded font-mono text-foreground">{a.noPendaftaran}</code>
                          <span>•</span>
                          <span>{a.periode?.nama ||"—"}</span>
                          <span>•</span>
                          <span>{format(new Date(a.createdAt),"d MMM yyyy", { locale: localeId })}</span>
                        </div>
                      </TableCell>
                      
                      {/* Kolom Pembayaran Pendaftaran */}
                      <TableCell className="px-4 py-4">
                        {tagihanPendaftaran ? (
                          <Badge className={tagihanPendaftaran.status ==="LUNAS" ?"bg-emerald-500/10 text-emerald-600 border-emerald-500/20" :"bg-red-500/10 text-red-600 border-red-500/20"}>
                            {tagihanPendaftaran.status ==="LUNAS" ?"Lunas" :"Belum Bayar"}
                          </Badge>
                        ) : <span className="text-muted-foreground text-xs font-medium italic">Tidak ada</span>}
                      </TableCell>

                      {/* Kolom Berkas */}
                      <TableCell className="px-4 py-4">
                        <div className="flex flex-col gap-1 text-[11px] font-medium">
                           <div className="flex items-center gap-1">
                             <span className="text-muted-foreground">Form:</span>
                             {a.dataFormulir ? <span className="text-emerald-500 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"/> Terisi</span> : <span className="text-amber-500">Belum</span>}
                           </div>
                           <div className="flex items-center gap-1">
                             <span className="text-muted-foreground">Berkas:</span>
                             <span className={a.berkas?.length > 0 ?"text-emerald-500" :"text-amber-500"}>{a.berkas?.length || 0} Diunggah</span>
                           </div>
                        </div>
                      </TableCell>

                      {/* Kolom Daftar Ulang */}
                      <TableCell className="px-4 py-4">
                        {tagihanDU ? (
                          <Badge className={tagihanDU.status ==="LUNAS" ?"bg-emerald-500/10 text-emerald-600 border-emerald-500/20" :"bg-amber-500/10 text-amber-600 border-amber-500/20"}>
                            {tagihanDU.status ==="LUNAS" ?"Lunas" :"Menunggu"}
                          </Badge>
                        ) : <span className="text-muted-foreground text-xs">—</span>}
                      </TableCell>

                      {/* Kolom Status Akhir */}
                      <TableCell className="px-4 py-4">
                        <Badge className={st.class}>{st.label}</Badge>
                      </TableCell>

                      {/* Kolom Aksi */}
                      <TableCell className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link href={`/admin/ppdb/pendaftar/${a.id}`}>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50" title="Lihat Detail">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50" 
                            title="Hapus Pendaftar"
                            onClick={() => handleDelete(a.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <div className="px-6 py-3 border-t border-border/50 text-xs text-muted-foreground">
            Menampilkan {filtered.length} dari {applicants.length} pendaftar
          </div>
        )}
      </Card>
    </div>
  )
}
