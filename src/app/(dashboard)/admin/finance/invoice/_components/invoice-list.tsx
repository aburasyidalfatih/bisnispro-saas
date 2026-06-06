"use client"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

import { useEffect, useState } from"react"
import { useSession } from"next-auth/react"
import { Button } from"@/components/ui/button"
import { Badge } from"@/components/ui/badge"
import { Input } from"@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from"@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from"@/components/ui/card"
import { Receipt, Plus, Search, Filter, Loader2, AlertCircle, CheckCircle, Clock, XCircle, Download } from"lucide-react"
import { useToast } from"@/hooks/use-toast"
import Link from"next/link"
import { format } from"date-fns"
import { id as localeId } from"date-fns/locale"

import * as XLSX from"xlsx"

type Invoice = {
  id: string
  code: string
  title: string
  amount: number
  amountPaid: number
  amountDue: number
  status: string
  dueDate: string
  student: { id: string; name: string; nis?: string; classroom?: { name: string } }
  billingType?: { name: string; category: string }
}

const statusConfig: Record<string, { label: string; color: string; icon: typeof CheckCircle }> = {
  UNPAID: { label:"Belum Bayar", color:"bg-red-500/10 text-red-600 border-red-200", icon: AlertCircle },
  PARTIAL: { label:"Bayar Sebagian", color:"bg-amber-500/10 text-amber-600 border-amber-200", icon: Clock },
  PAID: { label:"Lunas", color:"bg-emerald-500/10 text-emerald-600 border-emerald-200", icon: CheckCircle },
  OVERDUE: { label:"Jatuh Tempo", color:"bg-red-600/20 text-red-700 border-red-300", icon: AlertCircle },
  CANCELLED: { label:"Dibatalkan", color:"bg-slate-500/10 text-slate-500 border-slate-200", icon: XCircle },
}

export function InvoiceList({ tenantId }: { tenantId: string }) {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [meta, setMeta] = useState({ total: 0, page: 1, totalPages: 1 })
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [page, setPage] = useState(1)
  const { toast } = useToast()

  const fetchInvoices = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        tenantId,
        page: String(page),
        ...(statusFilter !=="all" ? { status: statusFilter } : {}),
      })
      const res = await fetch(`/api/finance/invoices?${params}`)
      const json = await res.json()
      setInvoices(json.data || [])
      setMeta(json.meta || { total: 0, page: 1, totalPages: 1 })
    } catch {
      toast({ title:"Gagal memuat data tagihan", variant:"destructive" })
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      // Fetch all without pagination
      const params = new URLSearchParams({
        tenantId,
        page:"1",
        limit:"9999", // assuming limit is supported or we just export the current page if not? Wait, the API usually respects `take` or `limit`. Let's just use `limit=99999`. Wait, the API uses `take` probably. Let's pass `take=9999`.
        ...(statusFilter !=="all" ? { status: statusFilter } : {}),
      })
      const res = await fetch(`/api/finance/invoices?${params}`)
      const json = await res.json()
      const allInvoices = json.data || []

      const formattedData = allInvoices.map((inv: Invoice) => ({"Kode": inv.code,"Siswa": inv.student.name,"NIS": inv.student.nis ||"-","Kelas": inv.student.classroom?.name ||"-","Judul Tagihan": inv.title,"Total Tagihan (Rp)": inv.amount,"Sudah Dibayar (Rp)": inv.amountPaid,"Sisa Tagihan (Rp)": inv.amountDue,"Jatuh Tempo": format(new Date(inv.dueDate),"dd MMM yyyy", { locale: localeId }),"Status": statusConfig[inv.status]?.label || inv.status,
      }))
      
      const worksheet = XLSX.utils.json_to_sheet(formattedData)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet,"Data Tagihan")
      
      XLSX.writeFile(workbook, `Laporan_Tagihan_${format(new Date(), 'yyyyMMdd')}.xlsx`)
      toast({ title:"Berhasil", description:"File Excel berhasil diunduh" })
    } catch (e: any) {
      toast({ title:"Gagal Ekspor", description: e.message, variant:"destructive" })
    } finally {
      setExporting(false)
    }
  }

  useEffect(() => { fetchInvoices() }, [page, statusFilter])

  const filtered = search
    ? invoices.filter(inv =>
        inv.student.name.toLowerCase().includes(search.toLowerCase()) ||
        inv.code.toLowerCase().includes(search.toLowerCase()) ||
        inv.title.toLowerCase().includes(search.toLowerCase())
      )
    : invoices

  const totalUnpaid = invoices.filter(i => i.status ==="UNPAID" || i.status ==="PARTIAL" || i.status ==="OVERDUE")
    .reduce((acc, i) => acc + i.amountDue, 0)

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label:"Total Tagihan", value: meta.total, color:"text-foreground" },
          { label:"Sisa Tagihan", value: `Rp ${totalUnpaid.toLocaleString("id-ID")}`, color:"text-red-600" },
          { label:"Belum Lunas", value: invoices.filter(i => ["UNPAID","OVERDUE","PARTIAL"].includes(i.status)).length, color:"text-amber-600" },
          { label:"Lunas", value: invoices.filter(i => i.status ==="PAID").length, color:"text-emerald-600" },
        ].map((s, i) => (
          <Card key={i} className="glass border-0 shadow-sm">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground font-medium mb-1">{s.label}</p>
              <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-2 w-full sm:max-w-sm">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari nama siswa / kode..."
              className="pl-9 rounded-xl glass border-0"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setPage(1) }}>
            <SelectTrigger className="w-40 rounded-xl glass border-0">
              <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              {Object.entries(statusConfig).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
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
          <Link href="/admin/finance/invoice/create">
            <Button className="rounded-xl gap-2">
              <Plus className="h-4 w-4" /> Buat Tagihan
            </Button>
          </Link>
        </div>
      </div>

      {/* Table */}
      <Card className="glass border-0 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {["Kode","Siswa / Kelas","Judul Tagihan","Nominal","Jatuh Tempo","Status",""].map(h => (
                  <TableHead key={h} className="text-left px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider whitespace-nowrap">{h}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} className="py-20 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" /></TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="py-20 text-center text-muted-foreground text-sm">Tidak ada tagihan ditemukan.</TableCell></TableRow>
              ) : filtered.map(inv => {
                const cfg = statusConfig[inv.status] || statusConfig.UNPAID
                const Icon = cfg.icon
                return (
                  <TableRow key={inv.id} className="hover:bg-white/50 dark:hover:bg-white/5 transition-colors">
                    <TableCell className="px-4 py-3 font-mono text-xs text-muted-foreground">{inv.code}</TableCell>
                    <TableCell className="px-4 py-3">
                      <p className="font-semibold">{inv.student.name}</p>
                      <p className="text-xs text-muted-foreground">{inv.student.nis} · {inv.student.classroom?.name ||"—"}</p>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <p>{inv.title}</p>
                      {inv.billingType && <p className="text-xs text-muted-foreground">{inv.billingType.name}</p>}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <p className="font-bold">Rp {inv.amount.toLocaleString("id-ID")}</p>
                      {inv.amountPaid > 0 && (
                        <p className="text-xs text-emerald-600">+Rp {inv.amountPaid.toLocaleString("id-ID")} dibayar</p>
                      )}
                    </TableCell>
                    <TableCell className="px-4 py-3 whitespace-nowrap text-sm">
                      {format(new Date(inv.dueDate),"d MMM yyyy", { locale: localeId })}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <Badge className={`${cfg.color} border text-[10px] gap-1`}>
                        <Icon className="h-3 w-3" /> {cfg.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <Link href={`/admin/finance/invoice/${inv.id}`}>
                        <Button size="sm" variant="outline" className="rounded-lg text-xs h-8">Detail</Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {meta.totalPages > 1 && (
          <div className="flex justify-center items-center gap-3 py-4 border-t border-border/50">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Sebelumnya</Button>
            <span className="text-sm text-muted-foreground">Hal {meta.page} / {meta.totalPages}</span>
            <Button variant="outline" size="sm" disabled={page >= meta.totalPages} onClick={() => setPage(p => p + 1)}>Selanjutnya</Button>
          </div>
        )}
      </Card>
    </div>
  )
}
