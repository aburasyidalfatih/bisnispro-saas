"use client"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

import { useEffect, useState, useCallback } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Users, Search, ShieldCheck, Mail, Calendar,
  Building2, MoreHorizontal, Trash2, ExternalLink, Briefcase, Download
} from "lucide-react"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ServerPagination } from "@/components/shared/server-pagination"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

interface UserRow {
  id: string
  name: string
  email: string
  isSuperAdmin: boolean
  createdAt: string
  affiliateProfile?: { id: string } | null
  tenants: {
    role: string
    tenant: { name: string; slug: string }
  }[]
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserRow[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const { toast } = useToast()
  const limit = 20

  const fetchUsers = useCallback(() => {
    setLoading(true)
    fetch(`/api/super-admin/users?page=${page}&limit=${limit}&search=${search}`)
      .then((r) => r.json())
      .then((data) => {
        setUsers(data.data || [])
        setTotal(data.total || 0)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [page, search])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  const handleDeleteConfirm = async () => {
    if (!deleteId) return
    
    try {
      const res = await fetch(`/api/super-admin/users/${deleteId}`, { method: "DELETE" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Gagal menghapus pengguna")
      toast({ title: "Berhasil", description: "Pengguna telah dihapus." })
      setDeleteId(null)
      fetchUsers()
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    }
  }

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Manajemen Pengguna</h1>
          <p className="text-muted-foreground mt-1 text-sm">Kelola seluruh pengguna di platform ({total} pengguna)</p>
        </div>
      </div>

      {/* Search and Export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Cari nama atau email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="pl-9 rounded-xl"
          />
        </div>
        <Button asChild variant="outline" className="rounded-xl border-primary/20 text-primary hover:bg-primary/5 shadow-sm">
          <a href={`/api/super-admin/users/export${search ? `?search=${encodeURIComponent(search)}` : ''}`} download>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </a>
        </Button>
      </div>

      {/* Table */}
      <Card className="glass border-0 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b bg-muted/30">
                <TableHead className="px-4 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-widest">Nama & Email</TableHead>
                <TableHead className="px-4 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-widest">Akses Platform</TableHead>
                <TableHead className="px-4 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-widest">Lembaga (Tenant)</TableHead>
                <TableHead className="px-4 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-widest">Bergabung</TableHead>
                <TableHead className="px-4 py-4 text-right text-xs font-bold text-muted-foreground uppercase tracking-widest">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                [...Array(3)].map((_, i) => (
                  <TableRow key={i} className="border-b">
                    <TableCell className="px-4 py-5" colSpan={5}><div className="skeleton h-10 w-full rounded-xl" /></TableCell>
                  </TableRow>
                ))
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="px-4 py-20 text-center">
                    <Users className="h-12 w-12 mx-auto text-muted-foreground/20 mb-4" />
                    <p className="text-muted-foreground italic">Belum ada pengguna yang terdaftar.</p>
                  </TableCell>
                </TableRow>
              ) : (
                users.map((u) => (
                  <TableRow key={u.id} className="hover:bg-muted/20 transition-all group">
                    <TableCell className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-muted text-muted-foreground font-bold shadow-sm group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold truncate max-w-[150px] max-w-full">{u.name}</p>
                          <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                            <Mail className="h-3 w-3" /> {u.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="px-4 py-4">
                      <div className="flex flex-col gap-1.5 items-start">
                        {u.isSuperAdmin && (
                          <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/20 gap-1.5 rounded-lg px-2 py-0.5">
                            <ShieldCheck className="h-3.5 w-3.5" /> Super Admin
                          </Badge>
                        )}
                        {u.affiliateProfile && (
                          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 gap-1.5 rounded-lg px-2 py-0.5">
                            <Briefcase className="h-3.5 w-3.5" /> Mitra Afiliasi
                          </Badge>
                        )}
                        {u.tenants && u.tenants.length > 0 && (
                          <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20 gap-1.5 rounded-lg px-2 py-0.5">
                            <Building2 className="h-3.5 w-3.5" /> Admin Tenant
                          </Badge>
                        )}
                        {!u.isSuperAdmin && !u.affiliateProfile && (!u.tenants || u.tenants.length === 0) && (
                          <Badge variant="outline" className="bg-slate-500/10 text-slate-600 border-slate-500/20 gap-1.5 rounded-lg px-2 py-0.5">
                            User Biasa
                          </Badge>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="px-4 py-4">
                      <div className="flex flex-wrap gap-1.5 max-w-[250px] max-w-full">
                        {u.tenants.length > 0 ? (
                          u.tenants.map((tu, i) => (
                            <div key={i} className="flex items-center gap-1.5 bg-primary/5 text-primary border border-primary/10 rounded-lg px-2 py-0.5">
                              <Building2 className="h-3 w-3" />
                              <span className="text-[10px] font-bold uppercase truncate max-w-[100px] max-w-full" title={tu.tenant.name}>
                                {tu.tenant.name}
                              </span>
                              <span className="text-[9px] opacity-60">({tu.role})</span>
                            </div>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground italic">Tidak ada lembaga</span>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="px-4 py-4">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(u.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </div>
                    </TableCell>

                    <TableCell className="px-4 py-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl hover:bg-primary/10 hover:text-primary transition-all">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 glass rounded-2xl p-2 shadow-2xl border-0 ring-1 ring-black/5">
                          <DropdownMenuItem asChild className="gap-2 rounded-xl h-10 cursor-pointer">
                            <Link href={`/super-admin/users/${u.id}`}>
                              <ExternalLink className="h-4 w-4 text-primary" />
                              <span className="font-medium text-sm">Lihat Detail</span>
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="gap-2 rounded-xl h-10 cursor-pointer text-red-600 hover:bg-red-50 hover:text-red-700"
                            onClick={() => setDeleteId(u.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="font-medium text-sm">Hapus Pengguna</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-border/40 bg-muted/10">
            <ServerPagination page={page} totalPages={totalPages} total={total} onPageChange={setPage} />
          </div>
        )}
      </Card>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Hapus Pengguna?"
        description="Apakah Anda yakin ingin menghapus pengguna ini? Tindakan ini tidak dapat dibatalkan."
        onConfirm={handleDeleteConfirm}
        confirmText="Hapus Pengguna"
        variant="destructive"
      />
    </div>
  )
}
