"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Building2, Search, Pencil, Trash2, LogIn,
  MoreHorizontal, Key, Globe, ShieldCheck, ShieldOff
} from "lucide-react"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle
} from "@/components/ui/dialog"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { ServerPagination } from "@/components/shared/server-pagination"
import { cn } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"

interface TenantRow {
  id: string
  name: string
  slug: string
  domain: string | null
  plan: string
  theme: string
  isActive: boolean
  createdAt: string
  studentQuota: number
  userCount: number
  owner: { name: string; email: string; phone: string | null } | null
}

const planBadge: Record<string, string> = {
  free: "bg-muted text-muted-foreground",
  pro: "bg-primary/10 text-primary",
}

export default function TenantsPage() {
  const [tenants, setTenants] = useState<TenantRow[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const limit = 10

  // Edit Modal State
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingTenant, setEditingApp] = useState<TenantRow | null>(null)
  const [editForm, setEditForm] = useState({
    name: "",
    slug: "",
    domain: "",
    plan: "free",
    studentQuota: 0,
    isActive: true
  })

  // Reset Password State
  const [resetModalOpen, setResetModalOpen] = useState(false)
  const [resetTenant, setResetTenant] = useState<TenantRow | null>(null)
  const [newPassword, setNewPassword] = useState("")
  const [reseting, setReseting] = useState(false)

  const [rootDomain, setRootDomain] = useState(process.env.NEXT_PUBLIC_ROOT_DOMAIN || "schoolpro.my.id")

  useEffect(() => {
    if (typeof window !== "undefined") {
      const envDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN
      if (envDomain) {
        setRootDomain(envDomain)
      } else {
        setRootDomain("schoolpro.my.id")
      }
    }
  }, [])

  const fetchTenants = useCallback(() => {
    setLoading(true)
    fetch(`/api/super-admin/tenants?page=${page}&limit=${limit}&search=${search}`)
      .then(async (r) => {
        const text = await r.text();
        return text ? JSON.parse(text) : { data: [], total: 0 };
      })
      .then((data) => {
        setTenants(data.data || [])
        setTotal(data.total || 0)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [page, search])

  useEffect(() => { fetchTenants() }, [fetchTenants])

  const totalPages = Math.ceil(total / limit)

  const handleEdit = (tenant: TenantRow) => {
    setEditingApp(tenant)
    setEditForm({
      name: tenant.name,
      slug: tenant.slug,
      domain: tenant.domain || "",
      plan: tenant.plan,
      studentQuota: tenant.studentQuota || 0,
      isActive: tenant.isActive
    })
    setEditModalOpen(true)
  }

  const handleUpdate = async () => {
    if (!editingTenant) return
    const res = await fetch("/api/super-admin/tenants", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: editingTenant.id, ...editForm }),
    })
    if (res.ok) {
      toast({ title: "Berhasil", description: "Data tenant berhasil diperbarui." })
      setEditModalOpen(false)
      fetchTenants()
    } else {
      const data = await res.json()
      toast({ title: "Gagal", description: data.error || "Gagal mengupdate tenant", variant: "destructive" })
    }
  }

  const handleResetPassword = async () => {
    if (!resetTenant || !newPassword) return
    setReseting(true)
    const res = await fetch("/api/super-admin/tenants/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tenantId: resetTenant.id, newPassword }),
    })
    setReseting(false)
    if (res.ok) {
      toast({ title: "Berhasil", description: "Password owner tenant telah direset." })
      setResetModalOpen(false)
      setNewPassword("")
    } else {
      toast({ title: "Gagal", description: "Gagal mereset password.", variant: "destructive" })
    }
  }

  const handleDelete = async (id: string, name: string) => {
    const res = await fetch("/api/super-admin/tenants", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    })
    if (res.ok) {
      toast({ title: "Tenant dihapus", description: `${name} berhasil dihapus.` })
      fetchTenants()
    } else {
      toast({ title: "Gagal", description: "Tidak dapat menghapus tenant.", variant: "destructive" })
    }
  }

  const handleLoginAs = async (tenantId: string) => {
    const res = await fetch("/api/super-admin/impersonate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tenantId }),
    })
    if (res.ok) {
      window.location.href = "/admin"
    } else {
      const data = await res.json()
      toast({ title: "Gagal", description: data.error || "Tidak dapat login sebagai tenant.", variant: "destructive" })
    }
  }

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Manajemen Tenant</h1>
          <p className="text-muted-foreground mt-1 text-sm">Kelola sekolah dan lembaga yang terdaftar ({total} tenant)</p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Cari nama tenant atau slug..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="pl-9 rounded-xl"
          />
        </div>
      </div>

      {/* Table */}
      <Card className="glass border-0 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="px-4 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-widest">Tenant / Institusi</th>
                <th className="px-4 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-widest">Kontak Owner</th>
                <th className="px-4 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-widest hidden lg:table-cell">URL / Domain</th>
                <th className="px-4 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-widest text-center">Plan</th>
                <th className="px-4 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-widest text-center">Status</th>
                <th className="px-4 py-4 text-right text-xs font-bold text-muted-foreground uppercase tracking-widest">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {loading ? (
                [...Array(3)].map((_, i) => (
                  <tr key={i} className="border-b">
                    <td className="px-4 py-5" colSpan={6}><div className="skeleton h-10 w-full rounded-xl" /></td>
                  </tr>
                ))
              ) : tenants.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-20 text-center">
                    <Building2 className="h-12 w-12 mx-auto text-muted-foreground/20 mb-4" />
                    <p className="text-muted-foreground italic">Belum ada tenant yang terdaftar.</p>
                  </td>
                </tr>
              ) : (
                tenants.map((t) => (
                  <tr key={t.id} className="hover:bg-muted/20 transition-all group">
                    {/* Tenant */}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary font-bold shadow-sm">
                          {t.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold truncate max-w-[200px]">{t.name}</p>
                          <p className="text-[10px] text-muted-foreground font-mono">ID: {t.id.slice(-8).toUpperCase()}</p>
                        </div>
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="px-4 py-4">
                      <div className="space-y-1">
                        <p className="text-xs font-medium">{t.owner?.name || "-"}</p>
                        <p className="text-[11px] text-muted-foreground">{t.owner?.email || "-"}</p>
                      </div>
                    </td>

                    {/* Domain */}
                    <td className="px-4 py-4 hidden lg:table-cell">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2 group/link">
                          <div className="h-6 w-6 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                            <Globe className="h-3.5 w-3.5" />
                          </div>
                          <a 
                            href={`http://${t.slug}.${rootDomain}`} 
                            target="_blank" 
                            className="text-xs font-semibold text-primary hover:underline"
                          >
                            {t.slug}.{rootDomain}
                          </a>
                        </div>
                        {t.domain && (
                          <div className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                              <ShieldCheck className="h-3.5 w-3.5" />
                            </div>
                            <a 
                              href={`https://${t.domain}`} 
                              target="_blank" 
                              className="text-[11px] font-bold text-emerald-600 hover:underline"
                            >
                              {t.domain}
                            </a>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Plan */}
                    <td className="px-4 py-4 text-center">
                      <span className={cn("text-[10px] font-bold uppercase rounded-lg px-2 py-1 tracking-tighter", planBadge[t.plan] || planBadge.free)}>
                        {t.plan}
                      </span>
                      <p className="text-[9px] text-muted-foreground mt-1">{t.studentQuota} Siswa</p>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-4 text-center">
                      <span className={cn(
                        "inline-flex items-center gap-1.5 text-[10px] font-bold uppercase rounded-full px-2.5 py-1",
                        t.isActive ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600"
                      )}>
                        {t.isActive ? "Aktif" : "Mati"}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl hover:bg-primary/10 hover:text-primary transition-all">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 glass rounded-2xl p-2 shadow-2xl border-0 ring-1 ring-black/5">
                          <DropdownMenuItem className="gap-2 rounded-xl h-10 cursor-pointer" onClick={() => handleEdit(t)}>
                            <Pencil className="h-4 w-4 text-primary" />
                            <span className="font-medium text-sm">Edit Tenant</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2 rounded-xl h-10 cursor-pointer" onClick={() => { setResetTenant(t); setResetModalOpen(true) }}>
                            <Key className="h-4 w-4 text-amber-500" />
                            <span className="font-medium text-sm">Reset Password</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2 rounded-xl h-10 cursor-pointer" onClick={() => handleLoginAs(t.id)}>
                            <LogIn className="h-4 w-4 text-blue-500" />
                            <span className="font-medium text-sm">Login Sebagai</span>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-border/40 my-1" />
                          <ConfirmDialog
                            trigger={
                              <DropdownMenuItem className="gap-2 rounded-xl h-10 cursor-pointer text-rose-600" onSelect={(e) => e.preventDefault()}>
                                <Trash2 className="h-4 w-4" />
                                <span className="font-bold text-sm">Hapus Tenant</span>
                              </DropdownMenuItem>
                            }
                            title={`Hapus total "${t.name}"?`}
                            description="Tindakan ini akan menghapus permanen seluruh database sekolah ini."
                            confirmText="Ya, Hapus Permanen"
                            onConfirm={() => handleDelete(t.id, t.name)}
                          />
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-border/40 bg-muted/10">
            <ServerPagination page={page} totalPages={totalPages} total={total} onPageChange={setPage} />
          </div>
        )}
      </Card>

      {/* Edit Tenant Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="rounded-3xl max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Data Tenant</DialogTitle>
            <DialogDescription>Perbarui informasi institusi dan lisensi.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nama Sekolah</Label>
              <Input value={editForm.name} onChange={(e) => setEditForm({...editForm, name: e.target.value})} className="rounded-xl" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Subdomain (Slug)</Label>
                <Input value={editForm.slug} onChange={(e) => setEditForm({...editForm, slug: e.target.value})} className="rounded-xl font-mono text-xs" />
              </div>
              <div className="space-y-2">
                <Label>Custom Domain</Label>
                <Input value={editForm.domain} onChange={(e) => setEditForm({...editForm, domain: e.target.value})} placeholder="myschool.sch.id" className="rounded-xl font-mono text-xs" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Paket (Plan)</Label>
                <select 
                  value={editForm.plan} 
                  onChange={(e) => setEditForm({...editForm, plan: e.target.value})}
                  className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm"
                >
                  <option value="free">FREE</option>
                  <option value="pro">PRO</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Kuota Siswa</Label>
                <Input type="number" value={editForm.studentQuota} onChange={(e) => setEditForm({...editForm, studentQuota: Number(e.target.value)})} className="rounded-xl" />
              </div>
            </div>
            <div className="flex items-center justify-between p-3 rounded-2xl bg-muted/30 border">
              <div className="space-y-0.5">
                <Label>Status Aktif</Label>
                <p className="text-[10px] text-muted-foreground">Matikan jika tenant menunggak atau suspend.</p>
              </div>
              <button 
                onClick={() => setEditForm({...editForm, isActive: !editForm.isActive})}
                className={cn(
                  "w-12 h-6 rounded-full transition-all relative",
                  editForm.isActive ? "bg-primary" : "bg-muted"
                )}
              >
                <div className={cn("absolute top-1 w-4 h-4 bg-white rounded-full transition-all", editForm.isActive ? "right-1" : "left-1")} />
              </button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditModalOpen(false)} className="rounded-xl">Batal</Button>
            <Button onClick={handleUpdate} className="rounded-xl btn-gradient text-white border-0 px-8">Simpan Perubahan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Modal */}
      <Dialog open={resetModalOpen} onOpenChange={setResetModalOpen}>
        <DialogContent className="rounded-3xl max-w-sm">
          <DialogHeader>
            <DialogTitle>Reset Password Owner</DialogTitle>
            <DialogDescription>Reset password untuk {resetTenant?.owner?.email}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Password Baru</Label>
              <Input 
                type="password" 
                value={newPassword} 
                onChange={(e) => setNewPassword(e.target.value)} 
                placeholder="Minimal 8 karakter"
                className="rounded-xl" 
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setResetModalOpen(false)} className="rounded-xl" disabled={reseting}>Batal</Button>
            <Button 
              onClick={handleResetPassword} 
              className="rounded-xl bg-amber-500 hover:bg-amber-600 text-white border-0"
              disabled={reseting || !newPassword}
            >
              {reseting ? "Memproses..." : "Reset Sekarang"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
