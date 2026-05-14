"use client"

import { useEffect, useState, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Users, Search, UserPlus, MoreHorizontal, Pencil, Trash2, LogIn,
} from "lucide-react"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { cn } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"

interface UserRow {
  id: string
  tenantUserId: string
  name: string
  email: string
  phone: string | null
  role: string
  isActive: boolean
  createdAt: string
}

const roleBadge: Record<string, string> = {
  owner: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  admin: "bg-primary/10 text-primary",
  guru: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  siswa: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  orangtua: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  member: "bg-muted text-muted-foreground",
}

export default function UsersPage() {
  const { data: session, status } = useSession()
  const [users, setUsers] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [showAdd, setShowAdd] = useState(false)
  const [addLoading, setAddLoading] = useState(false)

  const searchParams = useSearchParams()
  const roleParam = searchParams.get("role")

  const tenantId = session?.user?.tenants?.[0]?.id
  const currentRole = session?.user?.tenants?.[0]?.role
  const isImpersonatingUser = typeof document !== "undefined" && document.cookie.includes("impersonate-user=")
  const isImpersonatingTenant = typeof document !== "undefined" && document.cookie.includes("impersonate-tenant=")
  const isAdmin = !isImpersonatingUser && (currentRole === "owner" || currentRole === "admin" || session?.user?.isSuperAdmin)

  // Resolve tenantId — fallback ke impersonate cookie
  const [resolvedTenantId, setResolvedTenantId] = useState<string | null>(tenantId || null)

  useEffect(() => {
    if (tenantId) { setResolvedTenantId(tenantId); return }
    // Impersonate mode: resolve dari cookie
    if (isImpersonatingTenant) {
      const match = document.cookie.match(/impersonate-tenant=([^;]+)/)
      const slug = match?.[1]
      if (slug) {
        fetch(`/api/tenant/by-slug?slug=${slug}`)
          .then((r) => r.json())
          .then((data) => { if (data.id) setResolvedTenantId(data.id) })
          .catch(() => {})
      }
    }
  }, [tenantId, isImpersonatingTenant])

  // Redirect non-admin segera
  useEffect(() => {
    if (status === "authenticated" && !isAdmin) {
      window.location.replace("/admin")
    }
  }, [status, isAdmin])

  const fetchUsers = useCallback(() => {
    if (!resolvedTenantId || !isAdmin) return
    setLoading(true)
    fetch(`/api/tenant/users?tenantId=${resolvedTenantId}${roleParam ? `&role=${roleParam}` : ""}`)
      .then((r) => r.json())
      .then((data) => { setUsers(data.data || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [resolvedTenantId, isAdmin, roleParam])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  // Jangan render apapun kalau bukan admin
  if (!isAdmin) return null

  const filtered = search
    ? users.filter((u) => u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()))
    : users

  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setAddLoading(true)
    const fd = new FormData(e.currentTarget)
    const res = await fetch("/api/tenant/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tenantId: resolvedTenantId,
        name: fd.get("name"),
        email: fd.get("email"),
        phone: fd.get("phone"),
        role: fd.get("role") || "orangtua",
        password: fd.get("password") || undefined,
      }),
    })
    const data = await res.json()
    setAddLoading(false)
    if (res.ok) {
      toast({ title: "Berhasil", description: "User berhasil ditambahkan." })
      setShowAdd(false)
      fetchUsers()
    } else {
      toast({ title: "Gagal", description: data.error, variant: "destructive" })
    }
  }

  const handleDelete = async (tenantUserId: string, name: string) => {
    const res = await fetch("/api/tenant/users", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tenantUserId }),
    })
    if (res.ok) {
      toast({ title: "Dihapus", description: `${name} telah dihapus.` })
      fetchUsers()
    }
  }

  const handleLoginAs = async (userId: string, name: string) => {
    if (!resolvedTenantId) {
      toast({ title: "Gagal", description: "Tenant belum terdeteksi, coba refresh halaman.", variant: "destructive" })
      return
    }
    try {
      const res = await fetch("/api/tenant/impersonate-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, tenantId: resolvedTenantId }),
      })
      if (res.ok) {
        window.location.reload()
      } else {
        const data = await res.json().catch(() => ({ error: "Terjadi kesalahan" }))
        toast({ title: "Gagal", description: data.error, variant: "destructive" })
      }
    } catch {
      toast({ title: "Gagal", description: "Tidak dapat terhubung ke server", variant: "destructive" })
    }
  }

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight capitalize">
            {roleParam ? `Data ${roleParam === "orangtua" ? "Orang Tua" : roleParam}` : "Semua Pengguna"}
          </h1>
          <p className="text-muted-foreground mt-1">Kelola anggota lembaga ({filtered.length} data)</p>
        </div>
        {roleParam === "guru" ? (
          <div className="flex gap-2">
            <Button asChild variant="outline" className="gap-2 rounded-xl">
              <Link href="/admin/users/import">
                <UserPlus className="h-4 w-4" />
                Import Data Guru
              </Link>
            </Button>
            <Button asChild className="gap-2 btn-gradient text-white border-0 rounded-xl">
              <Link href="/admin/website/gtk/new">
                <UserPlus className="h-4 w-4" />
                Tambah Data Guru
              </Link>
            </Button>
          </div>
        ) : (
          <Button className="gap-2 btn-gradient text-white border-0 rounded-xl" onClick={() => setShowAdd(!showAdd)}>
            <UserPlus className="h-4 w-4" />
            Tambah User
          </Button>
        )}
      </div>

      {/* Add User Form */}
      {showAdd && (
        <Card className="glass border-0 p-6">
          <h3 className="font-semibold mb-4">Tambah User Baru</h3>
          <form onSubmit={handleAdd} className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label>Nama</Label>
              <Input name="name" placeholder="Nama lengkap" required className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input name="email" type="email" placeholder="email@contoh.com" required className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label>No. Telepon</Label>
              <Input name="phone" placeholder="08xxxxxxxxxx" className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label>Password</Label>
              <Input name="password" type="password" placeholder="Biarkan kosong untuk default: 12345678" className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <select name="role" defaultValue={roleParam || "orangtua"} className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm">
                <option value="admin">Admin</option>
                <option value="guru">Guru</option>
                <option value="siswa">Siswa</option>
                <option value="orangtua">Orang Tua</option>
              </select>
            </div>
            <div className="flex items-end gap-2">
              <Button type="submit" className="btn-gradient text-white border-0 rounded-xl" disabled={addLoading}>
                {addLoading ? "Menyimpan..." : "Simpan"}
              </Button>
              <Button type="button" variant="outline" className="rounded-xl" onClick={() => setShowAdd(false)}>
                Batal
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Cari nama atau email..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 rounded-xl" />
      </div>

      {/* Table */}
      <Card className="glass border-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Nama</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Telepon</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Role</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Bergabung</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(3)].map((_, i) => (
                  <tr key={i} className="border-b"><td className="px-4 py-4" colSpan={7}><div className="skeleton h-6 w-full rounded-lg" /></td></tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <Users className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
                    <p className="text-sm text-muted-foreground">Belum ada user</p>
                  </td>
                </tr>
              ) : (
                filtered.map((u) => (
                  <tr key={u.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs">
                          {u.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                        </div>
                        <span className="text-sm font-medium">{u.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">{u.email}</td>
                    <td className="px-4 py-3 text-sm hidden md:table-cell">{u.phone || "-"}</td>
                    <td className="px-4 py-3">
                      <span className={cn("text-[11px] font-semibold uppercase rounded-full px-2 py-0.5", roleBadge[u.role] || roleBadge.orangtua)}>
                        {u.role === "member" ? "Orang Tua" : u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground hidden lg:table-cell">{formatDate(u.createdAt)}</td>
                    <td className="px-4 py-3">
                      <span className={cn("inline-flex items-center gap-1 text-xs font-medium rounded-full px-2 py-0.5",
                        u.isActive ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-destructive/10 text-destructive"
                      )}>
                        <span className={cn("h-1.5 w-1.5 rounded-full", u.isActive ? "bg-emerald-500" : "bg-destructive")} />
                        {u.isActive ? "Aktif" : "Nonaktif"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {u.role !== "owner" && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44 glass rounded-xl">
                            {session?.user?.isSuperAdmin && (
                              <DropdownMenuItem className="gap-2 rounded-lg" onClick={() => handleLoginAs(u.id, u.name)}>
                                <LogIn className="h-4 w-4" /> Login Sebagai
                              </DropdownMenuItem>
                            )}
                            {u.role === "guru" ? (
                              <DropdownMenuItem asChild className="gap-2 rounded-lg cursor-pointer">
                                <Link href={`/admin/website/gtk/${u.id}/edit`}>
                                  <Pencil className="h-4 w-4" /> Edit
                                </Link>
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem className="gap-2 rounded-lg" onClick={() => toast({ title: "Edit", description: "Fitur edit segera hadir." })}>
                                <Pencil className="h-4 w-4" /> Edit
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <ConfirmDialog
                              trigger={
                                <DropdownMenuItem className="gap-2 rounded-lg text-destructive" onSelect={(e) => e.preventDefault()}>
                                  <Trash2 className="h-4 w-4" /> Hapus
                                </DropdownMenuItem>
                              }
                              title={`Hapus ${u.name}?`}
                              description={`${u.name} akan dihapus dari lembaga ini. Tindakan ini tidak dapat dibatalkan.`}
                              confirmText="Ya, hapus"
                              onConfirm={() => handleDelete(u.tenantUserId, u.name)}
                            />
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
