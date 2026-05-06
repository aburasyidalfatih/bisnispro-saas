"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { User, Mail, Calendar, ArrowLeft, ShieldCheck, Briefcase, Building2 } from "lucide-react"

export default function UserDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Reusing the same API or we can just fetch the list and find one. 
    // Ideally there's a GET /api/super-admin/users/[id]
    // But since it doesn't exist, we will just say "Detail Page: under construction" or fetch list.
    fetch(`/api/super-admin/users?search=${id}`)
      .then(r => r.json())
      .then(data => {
        const found = data.data?.find((u: any) => u.id === id)
        setUser(found || null)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [id])

  if (loading) return <div className="p-8 text-center">Memuat data pengguna...</div>
  if (!user) return <div className="p-8 text-center text-red-500">Pengguna tidak ditemukan.</div>

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">Detail Pengguna</h1>
      </div>

      <Card className="glass border-0 shadow-lg">
        <CardHeader className="border-b border-border/50 bg-muted/20">
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" /> Informasi Akun
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Nama Lengkap</p>
              <p className="font-bold text-lg">{user.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Email</p>
              <p className="font-medium flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" /> {user.email}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Tanggal Bergabung</p>
              <p className="font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" /> 
                {new Date(user.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-2">Peran & Akses</p>
              <div className="flex flex-wrap gap-2">
                {user.isSuperAdmin && (
                  <Badge className="bg-red-500 hover:bg-red-600 gap-1.5"><ShieldCheck className="h-3 w-3" /> Super Admin</Badge>
                )}
                {user.affiliateProfile && (
                  <Badge className="bg-emerald-500 hover:bg-emerald-600 gap-1.5"><Briefcase className="h-3 w-3" /> Mitra Afiliasi</Badge>
                )}
                {user.tenants && user.tenants.length > 0 && (
                  <Badge className="bg-blue-500 hover:bg-blue-600 gap-1.5"><Building2 className="h-3 w-3" /> Admin Tenant</Badge>
                )}
                {!user.isSuperAdmin && !user.affiliateProfile && (!user.tenants || user.tenants.length === 0) && (
                  <Badge variant="outline">User Biasa</Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {user.tenants && user.tenants.length > 0 && (
        <Card className="glass border-0 shadow-lg">
          <CardHeader className="border-b border-border/50 bg-muted/20">
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" /> Lembaga (Tenant)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="bg-muted/30">
                <tr>
                  <th className="p-4 text-left font-semibold">Nama Tenant</th>
                  <th className="p-4 text-left font-semibold">Slug (Subdomain)</th>
                  <th className="p-4 text-left font-semibold">Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {user.tenants.map((t: any, i: number) => (
                  <tr key={i} className="hover:bg-muted/10">
                    <td className="p-4 font-bold">{t.tenant.name}</td>
                    <td className="p-4 text-primary font-mono text-xs">{t.tenant.slug}</td>
                    <td className="p-4 uppercase text-xs font-semibold">{t.role}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
