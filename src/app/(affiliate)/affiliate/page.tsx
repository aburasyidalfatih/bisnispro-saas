import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { Users, Building2, Wallet, ArrowUpRight, Copy } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { redirect } from "next/navigation"

export default async function AffiliateDashboardPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const affiliate = await db.affiliateProfile.findUnique({
    where: { userId: session.user.id },
    include: {
      commissions: {
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { tenant: true }
      }
    }
  })

  if (!affiliate) {
    return <div>Profil Afiliasi tidak ditemukan.</div>
  }

  // Ambil statistik referral
  const referredApplications = await db.tenantApplication.count({
    where: { affiliateId: affiliate.id }
  })

  const referredTenants = await db.tenant.findMany({
    where: { affiliateId: affiliate.id },
    select: { id: true, plan: true }
  })

  const freeTenants = referredTenants.filter(t => t.plan === "free").length
  const proTenants = referredTenants.filter(t => t.plan === "pro").length

  const referralLink = `${process.env.NEXT_PUBLIC_APP_URL || "https://schoolpro.id"}/${affiliate.referralCode.toLowerCase()}`

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard Kemitraan</h1>
        <p className="text-muted-foreground mt-1">Pantau performa referral dan komisi Anda.</p>
      </div>

      {/* Referral Link Card */}
      <Card className="glass border-emerald-500/20 bg-emerald-500/5">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-center gap-4 justify-between">
            <div className="space-y-1">
              <h3 className="font-semibold text-emerald-800 dark:text-emerald-400">Link Referral Anda</h3>
              <p className="text-sm text-emerald-600 dark:text-emerald-500">Bagikan link ini ke calon sekolah untuk mendapatkan komisi.</p>
            </div>
            <div className="flex items-center gap-2 bg-background p-2 rounded-xl border w-full md:w-auto">
              <code className="px-3 py-1 text-sm font-semibold flex-1 md:w-80 truncate">{referralLink}</code>
              <Button size="sm" className="shrink-0 bg-emerald-500 hover:bg-emerald-600 text-white">
                <Copy className="h-4 w-4 mr-2" /> Salin Link
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="glass">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Calon Sekolah</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{referredApplications}</div>
            <p className="text-xs text-muted-foreground mt-1">Sekolah yang mendaftar</p>
          </CardContent>
        </Card>
        
        <Card className="glass">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sekolah Aktif (Free)</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{freeTenants}</div>
            <p className="text-xs text-muted-foreground mt-1">Menggunakan versi gratis</p>
          </CardContent>
        </Card>

        <Card className="glass border-emerald-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sekolah Premium (Pro)</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{proTenants}</div>
            <p className="text-xs text-emerald-600/70 mt-1">Sumber komisi Anda</p>
          </CardContent>
        </Card>

        <Card className="glass border-blue-500/20 bg-gradient-to-br from-blue-500/10 to-indigo-500/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Aktif</CardTitle>
            <Wallet className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">Rp {affiliate.balance.toLocaleString('id-ID')}</div>
            <p className="text-xs text-blue-600/70 mt-1">Total Cair: Rp {affiliate.totalEarnings.toLocaleString('id-ID')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Commissions */}
      <Card className="glass">
        <CardHeader>
          <CardTitle>Komisi Terbaru</CardTitle>
          <CardDescription>Riwayat komisi 5 transaksi terakhir dari sekolah referensi Anda.</CardDescription>
        </CardHeader>
        <CardContent>
          {affiliate.commissions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Belum ada komisi masuk. Bagikan link referral Anda untuk mulai mendapatkan komisi!
            </div>
          ) : (
            <div className="space-y-4">
              {affiliate.commissions.map((comm) => (
                <div key={comm.id} className="flex items-center justify-between p-4 border rounded-xl bg-background/50">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 font-bold">
                      {comm.tenant.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{comm.tenant.name}</p>
                      <p className="text-xs text-muted-foreground">{new Date(comm.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-emerald-600">+ Rp {comm.amount.toLocaleString('id-ID')}</p>
                    <p className="text-[10px] uppercase font-semibold text-muted-foreground">{comm.status}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
