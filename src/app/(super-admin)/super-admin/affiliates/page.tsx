import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, CreditCard, Building2, Wallet } from "lucide-react"

export default async function SuperAdminAffiliatesPage() {
  const session = await auth()
  if (!session?.user?.isSuperAdmin) redirect("/login")

  const affiliates = await db.affiliateProfile.findMany({
    include: {
      user: true,
      commissions: true,
      withdrawals: { where: { status: "PENDING" } }
    },
    orderBy: { createdAt: "desc" }
  })

  // Statistik
  const totalAffiliates = affiliates.length
  const totalBalance = affiliates.reduce((acc, curr) => acc + curr.balance, 0)
  const totalWithdrawalsPending = affiliates.reduce((acc, curr) => acc + curr.withdrawals.reduce((a, w) => a + w.amount, 0), 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between gap-4 md:items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Manajemen Afiliasi</h1>
          <p className="text-muted-foreground mt-1">Kelola mitra afiliasi, komisi, dan permintaan penarikan dana.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="glass">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Mitra</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAffiliates}</div>
          </CardContent>
        </Card>
        
        <Card className="glass">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Saldo Mitra</CardTitle>
            <Wallet className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">Rp {totalBalance.toLocaleString('id-ID')}</div>
          </CardContent>
        </Card>

        <Card className="glass border-amber-500/20 bg-amber-500/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-amber-700">Withdrawal Pending</CardTitle>
            <CreditCard className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">Rp {totalWithdrawalsPending.toLocaleString('id-ID')}</div>
            <p className="text-xs text-amber-600/70 mt-1">Menunggu persetujuan</p>
          </CardContent>
        </Card>
      </div>

      <Card className="glass shadow-sm">
        <CardHeader>
          <CardTitle>Daftar Mitra Afiliasi</CardTitle>
          <CardDescription>Semua marketer yang terdaftar di platform SchoolPro.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Mitra</th>
                  <th className="px-4 py-3 font-medium">Kode Ref</th>
                  <th className="px-4 py-3 font-medium text-right">Saldo Aktif</th>
                  <th className="px-4 py-3 font-medium">Req. Withdraw</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {affiliates.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Belum ada mitra terdaftar.</td>
                  </tr>
                ) : (
                  affiliates.map((aff) => {
                    const pendingWd = aff.withdrawals.reduce((a, w) => a + w.amount, 0)
                    return (
                      <tr key={aff.id} className="bg-background/50 hover:bg-muted/50 transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="font-medium text-foreground">{aff.user.name}</div>
                          <div className="text-[10px] text-muted-foreground">{aff.user.email}</div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className="font-mono text-xs">{aff.referralCode}</Badge>
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-emerald-600">Rp {aff.balance.toLocaleString('id-ID')}</td>
                        <td className="px-4 py-3">
                          {pendingWd > 0 ? (
                            <Badge className="bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 border-0">Rp {pendingWd.toLocaleString('id-ID')}</Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {aff.isActive ? (
                            <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-0">Aktif</Badge>
                          ) : (
                            <Badge className="bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 border-0">Nonaktif</Badge>
                          )}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
