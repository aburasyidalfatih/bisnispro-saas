"use client"

import { useEffect, useState } from"react"
import { useSession } from"next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from"@/components/ui/card"
import { Button } from"@/components/ui/button"
import { Input } from"@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from"@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from"@/components/ui/dialog"
import { Textarea } from"@/components/ui/textarea"
import { TrendingUp, TrendingDown, Wallet, Plus, Search, Loader2, Download, FileSpreadsheet } from"lucide-react"
import { useToast } from"@/hooks/use-toast"
import { format } from"date-fns"
import { id as localeId } from"date-fns/locale"

import * as XLSX from"xlsx"

export default function CashflowPage() {
  const { data: session } = useSession()
  const tenantId = session?.user?.tenants?.[0]?.id
  const { toast } = useToast()

  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [data, setData] = useState<any[]>([])
  const [summary, setSummary] = useState({ income: 0, expense: 0, balance: 0 })
  const [filterType, setFilterType] = useState("ALL")
  const [filterMonth, setFilterMonth] = useState(String(new Date().getMonth() + 1))
  const [filterYear, setFilterYear] = useState(String(new Date().getFullYear()))
  
  // Form State
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    type:"INCOME",
    category:"",
    amount:"",
    description:"",
    recordedAt: format(new Date(),"yyyy-MM-dd")
  })

  const fetchData = async () => {
    if (!tenantId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/finance/cashflow?tenantId=${tenantId}&type=${filterType}&month=${filterMonth}&year=${filterYear}`)
      const json = await res.json()
      setData(json.data || [])
      setSummary(json.summary || { income: 0, expense: 0, balance: 0 })
    } catch (e) {
      toast({ title:"Gagal memuat data", variant:"destructive" })
    } finally {
      setLoading(false)
    }
  }

  const handleExport = () => {
    if (data.length === 0) return
    setExporting(true)
    try {
      const formattedData = data.map(item => ({"Tanggal": format(new Date(item.recordedAt), 'dd MMM yyyy', { locale: localeId }),"Tipe": item.type ==="INCOME" ?"Pemasukan" :"Pengeluaran","Kategori": item.category.replace(/_/g, ' '),"Keterangan": item.description,"Nominal (Rp)": item.amount,
      }))
      
      const worksheet = XLSX.utils.json_to_sheet(formattedData)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet,"Arus Kas")
      
      XLSX.writeFile(workbook, `Laporan_Cashflow_${format(new Date(), 'yyyyMMdd')}.xlsx`)
      toast({ title:"Berhasil", description:"Laporan berhasil diunduh" })
    } catch (e: any) {
      toast({ title:"Gagal Ekspor", description: e.message, variant:"destructive" })
    } finally {
      setExporting(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [tenantId, filterType, filterMonth, filterYear])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch("/api/finance/cashflow", {
        method:"POST",
        headers: {"Content-Type":"application/json" },
        body: JSON.stringify({ ...formData, tenantId })
      })
      if (!res.ok) throw new Error("Gagal menyimpan transaksi")
      
      toast({ title:"Berhasil", description:"Transaksi berhasil dicatat" })
      setOpen(false)
      setFormData({ ...formData, category:"", amount:"", description:"" })
      fetchData()
    } catch (e: any) {
      toast({ title:"Gagal", description: e.message, variant:"destructive" })
    } finally {
      setSaving(false)
    }
  }

  const chartOfAccounts = {
    INCOME: ["SPP","UANG_GEDUNG","DONASI","DANA_BOS","KANTIN","LAINNYA"],
    EXPENSE: ["GAJI_GURU","GAJI_STAFF","LISTRIK_AIR","PEMELIHARAAN","ATK","KEGIATAN_SISWA","LAINNYA"]
  }

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Arus Kas (Cashflow)</h1>
          <p className="text-sm text-muted-foreground">Buku Kas Umum untuk memantau pendapatan dan pengeluaran.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-xl shadow-md shadow-primary/20"><Plus className="h-4 w-4 mr-2" /> Tambah Transaksi</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Catat Transaksi Manual</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold">Jenis Transaksi</label>
                <div className="grid grid-cols-2 gap-2">
                  <div 
                    onClick={() => setFormData({...formData, type:"INCOME", category:""})}
                    className={`p-3 border rounded-xl text-center cursor-pointer font-bold transition-all ${formData.type ==="INCOME" ?"border-emerald-500 bg-emerald-50 text-emerald-700" :"hover:bg-muted"}`}
                  >Pemasukan</div>
                  <div 
                    onClick={() => setFormData({...formData, type:"EXPENSE", category:""})}
                    className={`p-3 border rounded-xl text-center cursor-pointer font-bold transition-all ${formData.type ==="EXPENSE" ?"border-rose-500 bg-rose-50 text-rose-700" :"hover:bg-muted"}`}
                  >Pengeluaran</div>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold">Kategori (Akun)</label>
                <Select value={formData.category} onValueChange={v => setFormData({...formData, category: v})} required>
                  <SelectTrigger><SelectValue placeholder="Pilih Kategori" /></SelectTrigger>
                  <SelectContent>
                    {(chartOfAccounts[formData.type as"INCOME"|"EXPENSE"]).map(cat => (
                      <SelectItem key={cat} value={cat}>{cat.replace(/_/g, ' ')}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold">Nominal (Rp)</label>
                <Input type="number" min="0" required value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} placeholder="Contoh: 1500000" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold">Keterangan</label>
                <Textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Keterangan transaksi..." required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold">Tanggal</label>
                <Input type="date" required value={formData.recordedAt} onChange={e => setFormData({...formData, recordedAt: e.target.value})} />
              </div>
              <Button type="submit" disabled={saving} className="w-full h-12 rounded-xl text-md font-bold mt-2">
                {saving ? <Loader2 className="h-5 w-5 animate-spin" /> :"Simpan Transaksi"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="glass border-0 shadow-sm bg-gradient-to-br from-indigo-500/10 to-transparent">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-indigo-500/20 text-indigo-600 flex items-center justify-center">
              <Wallet className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-semibold uppercase">Saldo Kas</p>
              <h3 className="text-2xl font-black text-indigo-700">Rp {summary.balance.toLocaleString('id-ID')}</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="glass border-0 shadow-sm bg-gradient-to-br from-emerald-500/10 to-transparent">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-emerald-500/20 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-semibold uppercase">Total Pemasukan</p>
              <h3 className="text-2xl font-black text-emerald-700">Rp {summary.income.toLocaleString('id-ID')}</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="glass border-0 shadow-sm bg-gradient-to-br from-rose-500/10 to-transparent">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-rose-500/20 text-rose-600 flex items-center justify-center">
              <TrendingDown className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-semibold uppercase">Total Pengeluaran</p>
              <h3 className="text-2xl font-black text-rose-700">Rp {summary.expense.toLocaleString('id-ID')}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="glass border-0 shadow-sm">
        <CardHeader className="border-b bg-muted/20 pb-4">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <CardTitle className="text-lg">Riwayat Transaksi</CardTitle>
            <div className="flex flex-wrap gap-2">
              <Button 
                onClick={handleExport} 
                disabled={exporting || data.length === 0}
                variant="outline" 
                className="hidden sm:flex border-emerald-200 text-emerald-700 hover:bg-emerald-50"
              >
                {exporting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <FileSpreadsheet className="h-4 w-4 mr-2" />} 
                Ekspor Excel
              </Button>
              <Select value={filterMonth} onValueChange={setFilterMonth}>
                <SelectTrigger className="w-[130px] bg-background">
                  <SelectValue placeholder="Bulan" />
                </SelectTrigger>
                <SelectContent>
                  {["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"].map((m, i) => (
                    <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterYear} onValueChange={setFilterYear}>
                <SelectTrigger className="w-[100px] bg-background">
                  <SelectValue placeholder="Tahun" />
                </SelectTrigger>
                <SelectContent>
                  {[0, 1, 2].map(d => {
                    const y = String(new Date().getFullYear() - d)
                    return <SelectItem key={y} value={y}>{y}</SelectItem>
                  })}
                </SelectContent>
              </Select>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[180px] bg-background">
                  <SelectValue placeholder="Filter Tipe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Semua Transaksi</SelectItem>
                  <SelectItem value="INCOME">Pemasukan Saja</SelectItem>
                  <SelectItem value="EXPENSE">Pengeluaran Saja</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/40 border-b">
              <tr>
                <th className="px-4 py-3 font-bold">Tanggal</th>
                <th className="px-4 py-3 font-bold">Tipe & Kategori</th>
                <th className="px-4 py-3 font-bold">Keterangan</th>
                <th className="px-4 py-3 font-bold text-right">Nominal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {loading ? (
                <tr><td colSpan={4} className="py-10 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" /></td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan={4} className="py-10 text-center text-muted-foreground">Belum ada transaksi dicatat.</td></tr>
              ) : data.map(item => {
                const isIncome = item.type ==="INCOME"
                return (
                  <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{format(new Date(item.recordedAt), 'dd MMM yyyy', { locale: localeId })}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold ${isIncome ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                        {isIncome ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        {item.category.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 max-w-xs truncate">{item.description}</td>
                    <td className={`px-4 py-3 font-bold text-right ${isIncome ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {isIncome ? '+' : '-'} Rp {item.amount.toLocaleString('id-ID')}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
