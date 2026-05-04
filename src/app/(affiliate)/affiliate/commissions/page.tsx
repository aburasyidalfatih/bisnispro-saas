import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Wallet, ArrowRightLeft, CreditCard, AlertCircle } from "lucide-react"
import { WithdrawalForm } from "./_components/withdrawal-form"

export default async function AffiliateCommissionsPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const affiliate = await db.affiliateProfile.findUnique({
    where: { userId: session.user.id },
    include: {
      commissions: {
        orderBy: { createdAt: "desc" },
        include: { tenant: true }
      },
      withdrawals: {
        orderBy: { createdAt: "desc" }
      }
    }
  })

  if (!affiliate) redirect("/login")

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Komisi & Penarikan</h1>
          <p className="text-muted-foreground mt-1 text-sm">Kelola saldo Anda dan tarik komisi ke rekening bank.</p>
        </div>
      </div>

      {(!affiliate.bankAccount || !affiliate.bankName) && (
        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-600 px-4 py-3 rounded-xl flex gap-3 text-sm items-start">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Informasi Rekening Belum Lengkap</p>
            <p className="mt-1">Anda belum melengkapi informasi rekening bank. Silakan lengkapi di menu Pengaturan Akun agar dapat melakukan penarikan dana.</p>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        {/* Balance Card */}
        <Card className="glass md:col-span-1 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border-blue-500/20 flex flex-col">
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Wallet className="w-4 h-4 text-blue-600" />
              Saldo Tersedia
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-between">
            <div>
              <div className="text-3xl font-bold text-blue-700 dark:text-blue-400">
                Rp {affiliate.balance.toLocaleString('id-ID')}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Total Komisi Diterima: Rp {(affiliate.balance + affiliate.totalEarnings).toLocaleString('id-ID')}
              </p>
            </div>
            
            <div className="mt-6">
              <WithdrawalForm 
                balance={affiliate.balance} 
                hasBankInfo={!!affiliate.bankAccount && !!affiliate.bankName} 
              />
            </div>
          </CardContent>
        </Card>

        {/* Withdrawal History */}
        <Card className="glass md:col-span-2 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ArrowRightLeft className="h-5 w-5 text-muted-foreground" />
              Riwayat Penarikan
            </CardTitle>
          </CardHeader>
          <CardContent>
            {affiliate.withdrawals.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground border border-dashed rounded-xl">
                Belum ada riwayat penarikan dana.
              </div>
            ) : (
              <div className="space-y-3">
                {affiliate.withdrawals.map((wd) => (
                  <div key={wd.id} className="flex justify-between items-center p-3 border rounded-xl bg-background/50">
                    <div>
                      <p className="text-sm font-semibold">Tarik Dana</p>
                      <p className="text-xs text-muted-foreground">{new Date(wd.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-foreground">Rp {wd.amount.toLocaleString('id-ID')}</p>
                      {wd.status === "PENDING" && <Badge className="mt-1 bg-amber-500/10 text-amber-600 border-0 text-[10px]">Diproses</Badge>}
                      {wd.status === "PAID" && <Badge className="mt-1 bg-emerald-500/10 text-emerald-600 border-0 text-[10px]">Berhasil</Badge>}
                      {wd.status === "REJECTED" && <Badge className="mt-1 bg-rose-500/10 text-rose-600 border-0 text-[10px]">Ditolak</Badge>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Commission History */}
      <Card className="glass shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-muted-foreground" />
            Riwayat Komisi
          </CardTitle>
          <CardDescription>Rincian komisi dari pembayaran sekolah.</CardDescription>
        </CardHeader>
        <CardContent>
          {affiliate.commissions.length === 0 ? (
             <div className="text-center py-8 text-sm text-muted-foreground border border-dashed rounded-xl">
               Belum ada riwayat komisi.
             </div>
          ) : (
            <div className="rounded-xl border overflow-hidden overflow-x-auto">
              <table className="w-full text-sm text-left whitespace-nowrap md:whitespace-normal">
                <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Tanggal</th>
                    <th className="px-4 py-3 font-medium">Sekolah</th>
                    <th className="px-4 py-3 font-medium text-right">Nominal</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {affiliate.commissions.map((comm) => (
                    <tr key={comm.id} className="bg-background/50 hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                        {new Date(comm.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-4 py-3 font-medium">{comm.tenant.name}</td>
                      <td className="px-4 py-3 text-right font-bold text-emerald-600">+ Rp {comm.amount.toLocaleString('id-ID')}</td>
                      <td className="px-4 py-3">
                        {comm.status === "AVAILABLE" && <Badge className="bg-emerald-500/10 text-emerald-600 border-0">Tersedia</Badge>}
                        {comm.status === "PENDING" && <Badge className="bg-amber-500/10 text-amber-600 border-0">Tertunda</Badge>}
                        {comm.status === "PAID" && <Badge variant="outline" className="text-muted-foreground">Telah Ditarik</Badge>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
