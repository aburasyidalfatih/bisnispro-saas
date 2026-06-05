"use client"

import { useEffect, useState, useCallback } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Users, Search, UserPlus, MoreHorizontal, Pencil, Trash2, LogIn,
  ShieldCheck, GraduationCap, UserCheck, Loader2
} from "lucide-react"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
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

const roleConfig: Record<string, { label: string; badge: string; icon: any; addLabel: string; emptyLabel: string }> = {
  admin: {
    label: "Admin",
    badge: "bg-primary/10 text-primary",
    icon: ShieldCheck,
    addLabel: "Tambah Admin",
    emptyLabel: "Belum ada admin",
  },
  guru: {
    label: "Guru / Tenaga Kependidikan",
    badge: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    icon: Users,
    addLabel: "Tambah Guru",
    emptyLabel: "Belum ada guru",
  },
  orangtua: {
    label: "Orang Tua / Wali",
    badge: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
    icon: UserCheck,
    addLabel: "Tambah Orang Tua",
    emptyLabel: "Belum ada orang tua",
  },
}

interface RoleUserPageProps {
  role: "admin" | "guru" | "orangtua"
}

export function RoleUserPage({ role }: RoleUserPageProps) {
  const config = roleConfig[role]
  const { data: session, status } = useSession()
  const [users, setUsers] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [visibleCount, setVisibleCount] = useState(20)
  const [showAdd, setShowAdd] = useState(false)
  const [addLoading, setAddLoading] = useState(false)
  const [editUser, setEditUser] = useState<UserRow | null>(null)
  const [editLoading, setEditLoading] = useState(false)

  const tenantId = session?.user?.tenants?.[0]?.id
  const currentRole = session?.user?.tenants?.[0]?.role
  const isImpersonatingUser = typeof document !== "undefined" && document.cookie.includes("impersonate-user=")
  const isImpersonatingTenant = typeof document !== "undefined" && document.cookie.includes("impersonate-tenant=")
  const isAdmin = !isImpersonatingUser && (currentRole === "owner" || currentRole === "admin" || session?.user?.isSuperAdmin)

  const [resolvedTenantId, setResolvedTenantId] = useState<string | null>(tenantId || null)

  useEffect(() => {
    if (tenantId) { setResolvedTenantId(tenantId); return }
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

  useEffect(() => {
    if (status === "authenticated" && !isAdmin) {
      window.location.replace("/admin")
    }
  }, [status, isAdmin])

  const fetchUsers = useCallback(() => {
    if (!resolvedTenantId || !isAdmin) return
    setLoading(true)
    fetch(`/api/tenant/users?tenantId=${resolvedTenantId}&role=${role}`)
      .then((r) => r.json())
      .then((data) => { setUsers(data.data || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [resolvedTenantId, isAdmin, role])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  if (!isAdmin) return null

  const filtered = search
    ? users.filter((u) => u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()))
    : users

  const visibleEntries = filtered.slice(0, visibleCount)

  useEffect(() => {
    setVisibleCount(20)
  }, [search])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((prev) => prev + 20)
        }
      },
      { rootMargin: "200px" }
    )
    
    const target = document.getElementById("scroll-observer-users")
    if (target) observer.observe(target)
      
    return () => {
      if (target) observer.unobserve(target)
    }
  }, [visibleCount])

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
        role,
        password: fd.get("password") || undefined,
      }),
    })
    const data = await res.json()
    setAddLoading(false)
    if (res.ok) {
      toast({ title: "Berhasil", description: `${config.label} berhasil ditambahkan.` })
      setShowAdd(false)
      fetchUsers()
    } else {
      toast({ title: "Gagal", description: data.error, variant: "destructive" })
    }
  }

  const handleEdit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!editUser) return
    setEditLoading(true)
    const fd = new FormData(e.currentTarget)
    const res = await fetch("/api/tenant/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tenantUserId: editUser.tenantUserId,
        name: fd.get("name"),
        email: fd.get("email"),
        phone: fd.get("phone"),
        password: fd.get("password") || "",
      }),
    })
    const data = await res.json()
    setEditLoading(false)
    if (res.ok) {
      toast({ title: "Berhasil", description: "Data berhasil diperbarui." })
      setEditUser(null)
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

  const RoleIcon = config.icon

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Data {config.label}</h1>
          <p className="text-muted-foreground mt-1">Kelola data {config.label.toLowerCase()} ({filtered.length} data)</p>
        </div>
        <div className="flex gap-2">
          {role ==="guru" ? (
            <Button asChild className="gap-2 btn-gradient text-white border-0 rounded-xl">
              <Link href="/admin/website/gtk/new">
                <UserPlus className="h-4 w-4" />
                {config.addLabel}
              </Link>
            </Button>
          ) : (
            <Button className="gap-2 btn-gradient text-white border-0 rounded-xl" onClick={() => setShowAdd(!showAdd)}>
              <UserPlus className="h-4 w-4" />
              {config.addLabel}
            </Button>
          )}
        </div>
      </div>

      {/* Add User Form - NO role selector */}
      {showAdd && (
        <Card className="glass border-0 p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <RoleIcon className="h-5 w-5 text-primary" />
            Tambah {config.label} Baru
          </h3>
          <form onSubmit={handleAdd} className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
              <Input name="password" type="password" placeholder="Default: 12345678" className="rounded-xl" />
            </div>
            <div className="flex items-end gap-2 md:col-span-2 lg:col-span-4">
              <Button type="submit" className="btn-gradient text-white border-0 rounded-xl" disabled={addLoading}>
                {addLoading ?"Menyimpan..." :"Simpan"}
              </Button>
              <Button type="button" variant="outline" className="rounded-xl" onClick={() => setShowAdd(false)}>
                Batal
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Edit User Dialog */}
      <Dialog open={!!editUser} onOpenChange={(open) => !open && setEditUser(null)}>
        <DialogContent className="glass border-0 sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5 text-primary" />
              Edit {config.label}
            </DialogTitle>
          </DialogHeader>
          {editUser && (
            <form onSubmit={handleEdit} className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Nama</Label>
                <Input name="name" defaultValue={editUser.name} required className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input name="email" type="email" defaultValue={editUser.email} required className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label>No. Telepon</Label>
                <Input name="phone" defaultValue={editUser.phone ||""} className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label>Password (Opsional)</Label>
                <Input name="password" type="password" placeholder="Kosongkan jika tidak diubah" className="rounded-xl" />
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button type="button" variant="outline" className="rounded-xl" onClick={() => setEditUser(null)}>
                  Batal
                </Button>
                <Button type="submit" className="btn-gradient text-white border-0 rounded-xl" disabled={editLoading}>
                  {editLoading ?"Menyimpan..." :"Simpan Perubahan"}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

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
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Bergabung</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(3)].map((_, i) => (
                  <tr key={i} className="border-b"><td className="px-4 py-4" colSpan={6}><div className="skeleton h-6 w-full rounded-lg" /></td></tr>
                ))
              ) : visibleEntries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <RoleIcon className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
                    <p className="text-sm text-muted-foreground">{config.emptyLabel}</p>
                  </td>
                </tr>
              ) : (
                visibleEntries.map((u) => (
                  <tr key={u.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-bold text-xs", config.badge)}>
                          {u.name.split("").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                        </div>
                        <span className="text-sm font-medium">{u.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">{u.email}</td>
                    <td className="px-4 py-3 text-sm hidden md:table-cell">{u.phone ||"-"}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground hidden lg:table-cell">{formatDate(u.createdAt)}</td>
                    <td className="px-4 py-3">
                      <span className={cn("inline-flex items-center gap-1 text-xs font-medium rounded-full px-2 py-0.5",
                        u.isActive ?"bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" :"bg-destructive/10 text-destructive"
                      )}>
                        <span className={cn("h-1.5 w-1.5 rounded-full", u.isActive ?"bg-emerald-500" :"bg-destructive")} />
                        {u.isActive ?"Aktif" :"Nonaktif"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {u.role !=="owner" && (
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
                            <DropdownMenuItem className="gap-2 rounded-lg cursor-pointer" onClick={() => setEditUser(u)}>
                              <Pencil className="h-4 w-4" /> Edit
                            </DropdownMenuItem>
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
              {visibleCount < filtered.length && (
                <tr id="scroll-observer-users">
                  <td colSpan={6} className="px-4 py-8 text-center">
                    <div className="h-6 w-6 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600 mx-auto"></div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
