"use client"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

import { useEffect, useState } from"react"
import { useSession } from"next-auth/react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from"@/components/ui/card"
import { Button } from"@/components/ui/button"
import { Input } from"@/components/ui/input"
import { Label } from"@/components/ui/label"
import { Store, Plus, Search, Loader2, Trash2 } from"lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from"@/components/ui/dialog"
import { useToast } from"@/hooks/use-toast"
import { ConfirmDialog } from"@/components/shared/confirm-dialog"

export default function MerchantsPage() {
  const { data: session } = useSession()
  const tenantId = session?.user?.tenants?.[0]?.id
  const { toast } = useToast()

  const [merchants, setMerchants] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  const [showAddModal, setShowAddModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({ name:"", description:"", userId:"" })

  const fetchMerchants = async () => {
    if (!tenantId) return
    try {
      const res = await fetch(`/api/canteen/merchants?tenantId=${tenantId}`)
      const data = await res.json()
      setMerchants(Array.isArray(data) ? data : [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const fetchUsers = async () => {
    if (!tenantId) return
    try {
      const res = await fetch(`/api/tenant/users?tenantId=${tenantId}`)
      const data = await res.json()
      if (Array.isArray(data)) {
        setUsers(data)
      }
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    if (tenantId) {
      fetchMerchants()
      fetchUsers()
    }
  }, [tenantId])

  const handleAdd = async () => {
    if (!formData.name || !formData.userId) {
      toast({ title:"Validasi", description:"Nama Kantin dan Penanggung Jawab harus diisi", variant:"destructive" })
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch("/api/canteen/merchants", {
        method:"POST",
        headers: {"Content-Type":"application/json" },
        body: JSON.stringify({ tenantId, ...formData })
      })

      const result = await res.json()

      if (res.ok) {
        toast({ title:"Berhasil", description:"Merchant kantin berhasil ditambahkan" })
        setShowAddModal(false)
        setFormData({ name:"", description:"", userId:"" })
        fetchMerchants()
      } else {
        toast({ title:"Gagal", description: result.error ||"Gagal menambahkan merchant", variant:"destructive" })
      }
    } catch (e: any) {
      toast({ title:"Error", description: e.message, variant:"destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/canteen/merchants?id=${id}&tenantId=${tenantId}`, {
        method:"DELETE"
      })
      if (res.ok) {
        toast({ title:"Berhasil", description:"Merchant kantin berhasil dihapus" })
        fetchMerchants()
      } else {
        const result = await res.json()
        toast({ title:"Gagal", description: result.error ||"Gagal menghapus", variant:"destructive" })
      }
    } catch (e: any) {
      toast({ title:"Error", description: e.message, variant:"destructive" })
    }
  }

  const filteredMerchants = merchants.filter(m => 
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    m.user?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Manajemen Pedagang Kantin</h1>
          <p className="text-muted-foreground mt-1 text-sm">Kelola daftar warung/kantin yang beroperasi di sekolah.</p>
        </div>
        <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
          <DialogTrigger asChild>
            <Button className="btn-gradient text-white border-0 rounded-xl gap-2 h-9 flex items-center justify-center">
              <Plus className="h-4 w-4" /> Tambah Merchant
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tambah Merchant Kantin Baru</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Penanggung Jawab (Akun Pengguna)</Label>
                <select 
                  value={formData.userId} 
                  onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="">-- Pilih Pengguna --</option>
                  {users.map(u => (
                    <option key={u.user.id} value={u.user.id}>{u.user.name} ({u.role})</option>
                  ))}
                </select>
                <p className="text-[11px] text-muted-foreground">Pilih akun pengguna yang akan login ke Panel Kantin.</p>
              </div>
              <div className="space-y-2">
                <Label>Nama Kantin / Warung</Label>
                <Input 
                  placeholder="Contoh: Kantin Bu Siti" 
                  value={formData.name} 
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                />
              </div>
              <div className="space-y-2">
                <Label>Deskripsi (Opsional)</Label>
                <Input 
                  placeholder="Menjual makanan berat dan minuman..." 
                  value={formData.description} 
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })} 
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddModal(false)}>Batal</Button>
              <Button className="btn-gradient text-white border-0 flex items-center justify-center h-10 px-4" onClick={handleAdd} disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Simpan Merchant
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="glass border-0">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
              <Store className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Daftar Merchant</CardTitle>
              <CardDescription>Semua pedagang yang terdaftar</CardDescription>
            </div>
          </div>
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Cari kantin atau nama..."
              className="pl-9 bg-background rounded-xl h-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-left font-medium p-4 text-muted-foreground">Informasi Kantin</TableHead>
                  <TableHead className="text-left font-medium p-4 text-muted-foreground">Penanggung Jawab</TableHead>
                  <TableHead className="text-right font-medium p-4 text-muted-foreground">Produk</TableHead>
                  <TableHead className="text-right font-medium p-4 text-muted-foreground">Saldo Pendapatan</TableHead>
                  <TableHead className="text-right font-medium p-4 text-muted-foreground">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={5} className="p-8 text-center text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" /> Memuat data...</TableCell></TableRow>
                ) : filteredMerchants.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="p-8 text-center text-muted-foreground">
                      <Store className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                      Tidak ada merchant yang ditemukan.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMerchants.map((m) => (
                    <TableRow key={m.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="p-4">
                        <p className="font-bold text-primary">{m.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{m.description ||"Tidak ada deskripsi"}</p>
                      </TableCell>
                      <TableCell className="p-4">
                        <p className="font-semibold">{m.user?.name ||"Tidak diketahui"}</p>
                        <p className="text-xs text-muted-foreground">{m.user?.email}</p>
                      </TableCell>
                      <TableCell className="p-4 text-right">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-500/10 text-indigo-600 border border-indigo-500/20">
                          {m._count?.products || 0} Item
                        </span>
                      </TableCell>
                      <TableCell className="p-4 text-right font-mono font-medium text-emerald-600">
                        Rp {m.balance.toLocaleString("id-ID")}
                      </TableCell>
                      <TableCell className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <ConfirmDialog
                            trigger={
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            }
                            title={`Hapus ${m.name}?`}
                            description="Tindakan ini tidak dapat dibatalkan. Semua data produk dan transaksi terkait mungkin akan terhapus."
                            confirmText="Ya, hapus"
                            onConfirm={() => handleDelete(m.id)}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
