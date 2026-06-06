"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ShieldCheck, Mail, Calendar, UserPlus } from "lucide-react"
import { Button } from "@/components/ui/button"

interface AdminUser {
  id: string
  name: string
  email: string
  createdAt: string
}

export default function AdminsPage() {
  const [admins, setAdmins] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/super-admin/users/admins")
      .then((r) => r.json())
      .then((data) => {
        setAdmins(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Akun Super Admin</h1>
          <p className="text-muted-foreground mt-1 text-sm">Daftar pengguna dengan akses penuh ke sistem.</p>
        </div>
        <Button className="gap-2 btn-gradient text-white border-0 rounded-xl flex items-center justify-center h-10 px-4" disabled>
          <UserPlus className="h-4 w-4" />
          Tambah Admin
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          [1, 2].map((i) => (
            <Card key={i} className="glass border-0"><CardContent className="p-6"><div className="skeleton h-20 w-full rounded-xl" /></CardContent></Card>
          ))
        ) : admins.length === 0 ? (
          <Card className="col-span-full glass border-0">
            <CardContent className="p-12 text-center">
              <ShieldCheck className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
              <p className="text-muted-foreground">Belum ada data admin</p>
            </CardContent>
          </Card>
        ) : (
          admins.map((admin) => (
            <Card key={admin.id} className="glass border-0 hover-lift overflow-hidden group">
              <div className="h-1.5 bg-red-500 w-full" />
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/10 text-red-500 shadow-sm transition-transform group-hover:scale-110">
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                  <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/20 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                    Full Access
                  </Badge>
                </div>
                
                <div className="space-y-1 mb-4">
                  <h3 className="font-bold text-base truncate">{admin.name}</h3>
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-primary" /> {admin.email}
                  </p>
                </div>

                <div className="pt-4 border-t border-border/50 flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground uppercase font-semibold flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> Sejak {new Date(admin.createdAt).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })}
                  </span>
                  <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
