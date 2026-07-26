import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { School, CheckCircle2, Clock, XCircle, MessageCircle, AlertTriangle, UserPlus } from "lucide-react"
import { EmptyState } from "@/components/ui/empty-state"

export default async function AffiliateReferralsPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const affiliate = await db.affiliateProfile.findUnique({
    where: { userId: session.user.id },
  })

  if (!affiliate) redirect("/login")

  // Ambil calon bisnis (Leads)
  const applications = await db.tenantApplication.findMany({
    where: { affiliateId: affiliate.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      businessName: true,
      adminName: true,
      adminPhone: true,
      status: true,
      createdAt: true,
    },
  })

  // Ambil bisnis aktif (Tenants)
  const tenants = await db.tenant.findMany({
    where: { affiliateId: affiliate.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      slug: true,
      plan: true,
      phone: true,
      createdAt: true,
      lastActiveAt: true,
    },
  })

  // Helper untuk format nomor ke URL wa.me
  const getWaUrl = (phone?: string | null) => {
    if (!phone) return "#"
    let clean = phone.replace(/\D/g, '')
    if (clean.startsWith('0')) clean = '62' + clean.slice(1)
    return `https://wa.me/${clean}`
  }

  // Helper cek belum pernah login
  const hasNeverLoggedIn = (createdAt: Date, lastActiveAt: Date) => {
    // Jika selisih createdAt dan lastActiveAt kurang dari 5 detik, berarti belum pernah login
    return Math.abs(lastActiveAt.getTime() - createdAt.getTime()) < 5000
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "APPROVED": return <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-0"><CheckCircle2 className="w-3 h-3 mr-1"/> Disetujui</Badge>
      case "PENDING": return <Badge className="bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 border-0"><Clock className="w-3 h-3 mr-1"/> Menunggu</Badge>
      case "REJECTED": return <Badge className="bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 border-0"><XCircle className="w-3 h-3 mr-1"/> Ditolak</Badge>
      default: return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Leads & Bisnis</h1>
        <p className="text-muted-foreground mt-1 text-sm">Daftar bisnis yang mendaftar menggunakan link referral Anda.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Calon Bisnis (Leads) */}
        <Card className="glass shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <School className="h-5 w-5 text-muted-foreground" />
              Pendaftar Baru
            </CardTitle>
            <CardDescription>Bisnis yang masih dalam tahap verifikasi.</CardDescription>
          </CardHeader>
          <CardContent>
            {applications.length === 0 ? (
              <div className="py-8">
                <EmptyState icon={UserPlus} title="Belum Ada Pendaftar" description="Belum ada bisnis yang mendaftar." />
              </div>
            ) : (
              <div className="space-y-4">
                {applications.map((app) => (
                  <div key={app.id} className="flex justify-between items-start p-4 border rounded-xl bg-background/50">
                    <div className="space-y-1">
                      <h4 className="font-medium text-sm">{app.businessName}</h4>
                      <p className="text-xs text-muted-foreground">{app.adminName} ({app.adminPhone})</p>
                      <p className="text-[10px] text-muted-foreground">{new Date(app.createdAt).toLocaleDateString("id-ID")}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {getStatusBadge(app.status)}
                      {app.adminPhone && (
                        <a 
                          href={getWaUrl(app.adminPhone)} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                        >
                          <MessageCircle className="w-3.5 h-3.5" /> Hubungi
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bisnis Aktif (Tenants) */}
        <Card className="glass shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              Bisnis Aktif
            </CardTitle>
            <CardDescription>Bisnis yang sudah aktif menggunakan platform.</CardDescription>
          </CardHeader>
          <CardContent>
            {tenants.length === 0 ? (
              <div className="py-8">
                <EmptyState icon={UserPlus} title="Belum Ada Bisnis Aktif" description="Belum ada bisnis aktif dari referensi Anda." />
              </div>
            ) : (
              <div className="space-y-4">
                {tenants.map((tenant) => (
                  <div key={tenant.id} className="flex justify-between items-start p-4 border rounded-xl bg-background/50">
                    <div className="space-y-1">
                      <h4 className="font-medium text-sm flex items-center gap-2">
                        {tenant.name}
                        {hasNeverLoggedIn(tenant.createdAt, tenant.lastActiveAt) && (
                          <span className="flex items-center gap-1 text-[10px] bg-rose-500/10 text-rose-600 px-1.5 py-0.5 rounded-md border border-rose-500/20 font-medium" title="Bisnis ini belum pernah login sejak disetujui">
                            <AlertTriangle className="w-3 h-3" /> Belum Login
                          </span>
                        )}
                      </h4>
                      <p className="text-xs text-muted-foreground">{tenant.slug}.bisnispro.id</p>
                      <p className="text-[10px] text-muted-foreground">{new Date(tenant.createdAt).toLocaleDateString("id-ID")}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {tenant.plan === "pro" ? (
                        <Badge className="bg-emerald-500 text-white border-0">PRO</Badge>
                      ) : tenant.plan === "lite" ? (
                        <Badge className="bg-blue-500 text-white border-0">LITE</Badge>
                      ) : (
                        <Badge variant="outline" className="bg-muted text-muted-foreground border-0">FREE</Badge>
                      )}
                      {tenant.phone && (
                        <a 
                          href={getWaUrl(tenant.phone)} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                        >
                          <MessageCircle className="w-3.5 h-3.5" /> Hubungi
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
