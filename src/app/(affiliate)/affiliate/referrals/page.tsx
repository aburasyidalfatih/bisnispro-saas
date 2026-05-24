import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { School, CheckCircle2, Clock, XCircle } from "lucide-react"

export default async function AffiliateReferralsPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const affiliate = await db.affiliateProfile.findUnique({
    where: { userId: session.user.id },
  })

  if (!affiliate) redirect("/login")

  // Ambil calon sekolah (Leads)
  const applications = await db.tenantApplication.findMany({
    where: { affiliateId: affiliate.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      schoolName: true,
      adminName: true,
      adminPhone: true,
      status: true,
      createdAt: true,
    },
  })

  // Ambil sekolah aktif (Tenants)
  const tenants = await db.tenant.findMany({
    where: { affiliateId: affiliate.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      slug: true,
      plan: true,
      createdAt: true,
    },
  })

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
        <h1 className="text-2xl font-bold tracking-tight">Leads & Sekolah</h1>
        <p className="text-muted-foreground mt-1 text-sm">Daftar sekolah yang mendaftar menggunakan link referral Anda.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Calon Sekolah (Leads) */}
        <Card className="glass shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <School className="h-5 w-5 text-muted-foreground" />
              Pendaftar Baru
            </CardTitle>
            <CardDescription>Sekolah yang masih dalam tahap verifikasi.</CardDescription>
          </CardHeader>
          <CardContent>
            {applications.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground border border-dashed rounded-xl">
                Belum ada sekolah yang mendaftar.
              </div>
            ) : (
              <div className="space-y-4">
                {applications.map((app) => (
                  <div key={app.id} className="flex justify-between items-start p-4 border rounded-xl bg-background/50">
                    <div className="space-y-1">
                      <h4 className="font-medium text-sm">{app.schoolName}</h4>
                      <p className="text-xs text-muted-foreground">{app.adminName} ({app.adminPhone})</p>
                      <p className="text-[10px] text-muted-foreground">{new Date(app.createdAt).toLocaleDateString("id-ID")}</p>
                    </div>
                    <div>{getStatusBadge(app.status)}</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sekolah Aktif (Tenants) */}
        <Card className="glass shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              Sekolah Aktif
            </CardTitle>
            <CardDescription>Sekolah yang sudah aktif menggunakan platform.</CardDescription>
          </CardHeader>
          <CardContent>
            {tenants.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground border border-dashed rounded-xl">
                Belum ada sekolah aktif dari referensi Anda.
              </div>
            ) : (
              <div className="space-y-4">
                {tenants.map((tenant) => (
                  <div key={tenant.id} className="flex justify-between items-start p-4 border rounded-xl bg-background/50">
                    <div className="space-y-1">
                      <h4 className="font-medium text-sm">{tenant.name}</h4>
                      <p className="text-xs text-muted-foreground">{tenant.slug}.schoolpro.id</p>
                      <p className="text-[10px] text-muted-foreground">{new Date(tenant.createdAt).toLocaleDateString("id-ID")}</p>
                    </div>
                    <div>
                      {tenant.plan === "pro" ? (
                        <Badge className="bg-emerald-500 text-white border-0">PRO</Badge>
                      ) : tenant.plan === "lite" ? (
                        <Badge className="bg-blue-500 text-white border-0">LITE</Badge>
                      ) : (
                        <Badge variant="outline" className="bg-muted text-muted-foreground border-0">FREE</Badge>
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
