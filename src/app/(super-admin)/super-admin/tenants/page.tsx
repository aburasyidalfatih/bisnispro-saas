"use client"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

import { useEffect, useState, useCallback } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Building2, Search, Pencil, Trash2, LogIn,
  MoreHorizontal, Key, Globe, ShieldCheck, ArrowUpDown
} from "lucide-react"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { ServerPagination } from "@/components/shared/server-pagination"
import { cn, getRootDomain } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"
import { EditTenantModal } from "./_components/edit-tenant-modal"
import { ResetPasswordModal } from "./_components/reset-password-modal"

interface TenantRow {
  id: string
  name: string
  slug: string
  domain: string | null
  plan: string
  theme: string
  isActive: boolean
  createdAt: string
  retentionStatus?: string
  studentQuota: number
  aiTokens: number
  userCount: number
  owner: { name: string; email: string; phone: string | null } | null
  storageUsed?: number
  isContactSynced?: boolean
}

const planBadge: Record<string, string> = {
  free: "bg-muted text-muted-foreground",
  lite: "bg-blue-500/10 text-blue-600",
  pro: "bg-primary/10 text-primary",
}

export default function TenantsPage() {
  const [tenants, setTenants] = useState<TenantRow[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [sortColumn, setSortColumn] = useState("createdAt")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const limit = 10

  // Edit Modal State
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingTenant, setEditingApp] = useState<TenantRow | null>(null)

  // Reset Password State
  const [resetModalOpen, setResetModalOpen] = useState(false)
  const [resetTenant, setResetTenant] = useState<TenantRow | null>(null)

  const [rootDomain, setRootDomain] = useState("")

  useEffect(() => {
    if (typeof window !== "undefined") {
      setRootDomain(getRootDomain())
    }
  }, [])

  const fetchTenants = useCallback(() => {
    setLoading(true)
    fetch(`/api/super-admin/tenants?page=${page}&limit=${limit}&search=${search}&sort=${sortColumn}&order=${sortOrder}&status=${filterStatus}`)
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
  }, [page, search, sortColumn, sortOrder, filterStatus])

  useEffect(() => { fetchTenants() }, [fetchTenants])

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortColumn(column)
      setSortOrder("desc")
    }
    setPage(1)
  }

  const formatBytes = (bytes: number) => {
    if (!bytes || bytes === 0) return "0 MB"
    const mb = bytes / (1024 * 1024)
    if (mb >= 1024) return (mb / 1024).toFixed(2) + " GB"
    return mb.toFixed(1) + " MB"
  }

  const totalPages = Math.ceil(total / limit)

  const handleEdit = (tenant: TenantRow) => {
    setEditingApp(tenant)
    setEditModalOpen(true)
  }

  const handleDelete = async (id: string, name: string) => {
    const res = await fetch("/api/super-admin/tenants", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    })
    if (res.ok) {
      toast({ title: "Lembaga dihapus", description: `${name} berhasil dihapus.` })
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

  const handleSyncContacts = async () => {
    try {
      toast({ title: "Sinkronisasi Dimulai", description: "Sedang memproses di latar belakang..." })
      const res = await fetch("/api/super-admin/tenants/sync-contacts", { method: "POST" })
      const data = await res.json()
      if (res.ok) {
        toast({ title: "Sinkronisasi Selesai", description: data.message })
      } else {
        toast({ title: "Gagal", description: data.error, variant: "destructive" })
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div className="flex-1">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Manajemen Lembaga</h1>
          <p className="text-muted-foreground mt-1 text-xs sm:text-sm">Kelola sekolah dan lembaga yang terdaftar ({total} tenant)</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleSyncContacts} variant="outline" className="gap-2 bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100 rounded-xl">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 18a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2"></path><rect width="18" height="18" x="3" y="4" rx="2"></rect><circle cx="12" cy="10" r="2"></circle><line x1="8" x2="8" y1="2" y2="4"></line><line x1="16" x2="16" y1="2" y2="4"></line></svg>
            Sinkron Kontak Google
          </Button>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative w-full sm:max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Cari nama, email, atau slug..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="pl-9 rounded-xl w-full"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => { setFilterStatus(e.target.value); setPage(1) }}
          className="flex h-10 w-full sm:w-auto items-center justify-between rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value="all">Semua Status</option>
          <option value="active">Aktif</option>
          <option value="suspended">Suspended</option>
          <option value="deleted">Dihapus (Soft Delete)</option>
        </select>
      </div>

      {/* Table */}
      <Card className="glass border-0 overflow-hidden shadow-xl">
        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b bg-muted/30">
                <TableHead className="px-4 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-widest">Lembaga / Institusi</TableHead>
                <TableHead className="px-4 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-widest">Kontak Owner</TableHead>
                <TableHead className="px-4 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-widest hidden lg:table-cell">URL / Domain</TableHead>
                <TableHead 
                  className="px-4 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-widest text-center cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleSort("plan")}
                >
                  <div className="flex items-center justify-center gap-1">
                    Plan
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </TableHead>
                <TableHead 
                  className="px-4 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-widest text-center cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleSort("aiTokens")}
                >
                  <div className="flex items-center justify-center gap-1">
                    Token AI
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </TableHead>
                <TableHead 
                  className="px-4 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-widest text-center cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleSort("storage")}
                >
                  <div className="flex items-center justify-center gap-1">
                    Disk Usage
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </TableHead>
                <TableHead 
                  className="px-4 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-widest text-center cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleSort("createdAt")}
                >
                  <div className="flex flex-col items-center justify-center gap-1">
                    <span className="flex items-center gap-1">Status <ArrowUpDown className="h-3 w-3" /></span>
                    <span className="text-[10px] font-normal">&amp; Tgl Disetujui</span>
                  </div>
                </TableHead>
                <TableHead className="px-4 py-4 text-right text-xs font-bold text-muted-foreground uppercase tracking-widest">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                [...Array(3)].map((_, i) => (
                  <TableRow key={i} className="border-b">
                    <TableCell className="px-4 py-5" colSpan={8}><div className="skeleton h-10 w-full rounded-xl" /></TableCell>
                  </TableRow>
                ))
              ) : tenants.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="px-4 py-20 text-center">
                    <Building2 className="h-12 w-12 mx-auto text-muted-foreground/20 mb-4" />
                    <p className="text-muted-foreground italic">Belum ada tenant yang terdaftar.</p>
                  </TableCell>
                </TableRow>
              ) : (
                tenants.map((t) => (
                  <TableRow key={t.id} className="hover:bg-muted/20 transition-all group">
                    <TableCell className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary font-bold shadow-sm">
                          {t.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-bold truncate max-w-[200px] max-w-full">{t.name}</p>
                            {t.isContactSynced && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-medium text-green-700 ring-1 ring-inset ring-green-600/20" title="Tersinkronisasi ke Google Contacts">
                                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                Synced
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-muted-foreground font-mono">ID: {t.id.slice(-8).toUpperCase()}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-4">
                      <div className="space-y-1">
                        <p className="text-xs font-medium">{t.owner?.name || "-"}</p>
                        <p className="text-[11px] text-muted-foreground">{t.owner?.email || "-"}</p>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-4 hidden lg:table-cell">
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
                    </TableCell>
                    <TableCell className="px-4 py-4 text-center">
                      <span className={cn("text-[10px] font-bold uppercase rounded-lg px-2 py-1 tracking-tighter", planBadge[t.plan] || planBadge.free)}>
                        {t.plan}
                      </span>
                      <p className="text-[9px] text-muted-foreground mt-1">{t.studentQuota} Siswa</p>
                    </TableCell>
                    <TableCell className="px-4 py-4 text-center">
                      <span className="text-[11px] font-bold text-foreground">
                        {((t.aiTokens || 0) + ((t as any).aiAddonTokens || 0)).toLocaleString("id-ID")}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 py-4 text-center">
                      <span className="text-[11px] font-bold text-foreground">
                        {formatBytes(t.storageUsed || 0)}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 py-4 text-center flex flex-col items-center justify-center gap-1.5">
                      <span className={cn(
                        "inline-flex items-center gap-1.5 text-[10px] font-bold uppercase rounded-full px-2.5 py-1",
                        t.retentionStatus === "SUSPENDED_60" ? "bg-amber-500/10 text-amber-600" :
                        t.isActive ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600"
                      )}>
                        {t.retentionStatus === "SUSPENDED_60" ? "SUSPEND" : t.isActive ? "Aktif" : "Mati"}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {t.createdAt ? formatDate(t.createdAt) : '-'}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 py-4 text-right">
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
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Mobile Card Layout */}
        <div className="md:hidden">
          {loading ? (
            <div className="p-4 space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="skeleton h-32 w-full rounded-2xl" />
              ))}
            </div>
          ) : tenants.length === 0 ? (
            <div className="px-4 py-16 text-center">
              <Building2 className="h-12 w-12 mx-auto text-muted-foreground/20 mb-4" />
              <p className="text-muted-foreground italic text-sm">Belum ada tenant yang terdaftar.</p>
            </div>
          ) : (
            <div className="divide-y divide-border/40">
              {tenants.map((t) => (
                <div key={t.id} className="p-4 space-y-3">
                  {/* Row 1: Name + Actions */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary font-bold shadow-sm">
                        {t.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold truncate">{t.name}</p>
                          {t.isContactSynced && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-medium text-green-700 ring-1 ring-inset ring-green-600/20" title="Tersinkronisasi ke Google Contacts">
                              <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-muted-foreground font-mono">ID: {t.id.slice(-8).toUpperCase()}</p>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl hover:bg-primary/10 shrink-0">
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
                  </div>

                  {/* Row 2: Owner info */}
                  <div className="text-xs space-y-0.5 pl-[52px]">
                    <p className="font-medium">{t.owner?.name || "-"}</p>
                    <p className="text-muted-foreground">{t.owner?.email || "-"}</p>
                  </div>

                  {/* Row 3: Badges row */}
                  <div className="flex items-center gap-2 flex-wrap pl-[52px]">
                    <span className={cn("text-[10px] font-bold uppercase rounded-lg px-2 py-1 tracking-tighter", planBadge[t.plan] || planBadge.free)}>
                      {t.plan} · {t.studentQuota} siswa
                    </span>
                    <span className={cn(
                      "inline-flex items-center text-[10px] font-bold uppercase rounded-full px-2 py-0.5",
                      t.retentionStatus === "SUSPENDED_60" ? "bg-amber-500/10 text-amber-600" :
                      t.isActive ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600"
                    )}>
                      {t.retentionStatus === "SUSPENDED_60" ? "SUSPEND" : t.isActive ? "Aktif" : "Mati"}
                    </span>
                    <span className="text-[10px] font-bold text-purple-600 bg-purple-500/10 px-2 py-0.5 rounded-lg">
                      🤖 {((t.aiTokens || 0) + ((t as any).aiAddonTokens || 0)).toLocaleString("id-ID")}
                    </span>
                    <span className="text-[10px] text-muted-foreground">{formatBytes(t.storageUsed || 0)}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap pl-[52px] text-[10px] text-muted-foreground">
                    <span>Terdaftar: {t.createdAt ? formatDate(t.createdAt) : '-'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-border/40 bg-muted/10">
            <ServerPagination page={page} totalPages={totalPages} total={total} onPageChange={setPage} />
          </div>
        )}
      </Card>

      {/* Modals */}
      <EditTenantModal 
        open={editModalOpen} 
        onOpenChange={setEditModalOpen} 
        tenant={editingTenant} 
        onSuccess={fetchTenants} 
      />
      
      <ResetPasswordModal 
        open={resetModalOpen} 
        onOpenChange={setResetModalOpen} 
        tenant={resetTenant} 
        onSuccess={fetchTenants} 
      />
    </div>
  )
}
