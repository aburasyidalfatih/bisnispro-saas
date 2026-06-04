import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { Users, Building2, Wallet, ArrowUpRight, MousePointerClick, MessageCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { redirect } from "next/navigation"
import { CopyLinkButton } from "./copy-button"

export default async function AffiliateDashboardPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const affiliate = await db.affiliateProfile.findUnique({
    where: { userId: session.user.id },
    include: {
      discountCodes: true,
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
  const liteTenants = referredTenants.filter(t => t.plan === "lite").length
  const proTenants = referredTenants.filter(t => t.plan === "pro").length
  const paidTenants = liteTenants + proTenants

  const displayCode = affiliate.referralCode.replace(/^ref-/i, '').toLowerCase()
  const referralLink = `${process.env.NEXT_PUBLIC_APP_URL || "https://schoolpro.id"}/${displayCode}`

  const cashbackCoupon = affiliate.discountCodes?.find(c => c.type === "CASHBACK" && c.isActive)
  const cashbackValueText = cashbackCoupon ? (cashbackCoupon.cashbackAmount > 0 ? `Rp ${cashbackCoupon.cashbackAmount.toLocaleString()}` : `${cashbackCoupon.percentage}%`) : 'menarik'

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard Kemitraan</h1>
          <p className="text-muted-foreground mt-1">Pantau performa referral dan komisi Anda.</p>
        </div>
        
        <div className="flex items-center gap-3 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-500/10 dark:to-amber-500/10 px-4 py-3 rounded-xl border border-orange-200 dark:border-orange-500/20 shadow-sm w-full md:w-fit max-w-xl">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-orange-800 dark:text-orange-400">Kupon Cashback Anda</p>
            <p className="text-[11px] text-orange-700/90 dark:text-orange-400/90 leading-tight">
              Kupon cashback ini sengaja <strong>dibatasi 1 kali penggunaan</strong> khusus untuk <em>upgrade</em> sekolah Anda sendiri. Besaran cashback <strong>{cashbackValueText}</strong> akan masuk ke saldo komisi Anda. Jika Anda butuh kupon tambahan, silakan <em>request</em> ke Super Admin.
            </p>
          </div>
          <code className="font-mono font-bold text-lg text-orange-700 dark:text-orange-300 bg-white dark:bg-black/50 px-3 py-1 rounded-lg border border-orange-100 dark:border-orange-500/20 shrink-0">{displayCode}</code>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {/* Referral Link Card */}
        <Card className="glass border-emerald-500/20 bg-emerald-500/5">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center gap-4 justify-between">
              <div className="space-y-1 text-center md:text-left">
                <h3 className="font-semibold text-emerald-800 dark:text-emerald-400">Link Referral Anda</h3>
                <p className="text-sm text-emerald-600 dark:text-emerald-500">Bagikan link ini ke calon sekolah untuk mendapatkan komisi.</p>
              </div>
              <div className="flex items-center gap-2 bg-background p-2 rounded-xl border w-full md:w-auto">
                <code className="px-3 py-1 text-sm font-semibold flex-1 md:w-80 truncate">{referralLink}</code>
                <CopyLinkButton link={referralLink} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cashback Coupons Card */}
        {affiliate.discountCodes && affiliate.discountCodes.length > 0 && (
          <Card className="glass border-orange-500/20 bg-orange-500/5">
            <CardContent className="p-6 flex flex-col gap-4">
              <div className="space-y-1">
                <h3 className="font-semibold text-orange-800 dark:text-orange-400">Kupon Cashback Anda</h3>
                <p className="text-sm text-orange-600 dark:text-orange-500">
                  Gunakan kode kupon ini saat checkout langganan. Anda akan menerima saldo komisi senilai nominal cashback, tanpa mengubah total tagihan sekolah.
                </p>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {affiliate.discountCodes.filter((dc: any) => dc.isActive && dc.type === "CASHBACK").map((coupon: any) => (
                  <div key={coupon.id} className="flex flex-col gap-2 p-3 border rounded-xl bg-background/80">
                    <div className="flex justify-between items-center">
                      <span className="font-mono font-bold text-lg">{coupon.code}</span>
                      <span className="text-xs font-semibold bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
                        {coupon.cashbackAmount > 0 ? `CB Rp ${coupon.cashbackAmount.toLocaleString()}` : `${coupon.percentage}% CB`}
                      </span>
                    </div>
                    {coupon.linkedTenantId ? (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full bg-slate-400"></span> Telah digunakan (Terkunci)
                      </p>
                    ) : (
                      <p className="text-xs text-emerald-600 flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full bg-emerald-500"></span> Siap digunakan (Belum diklaim)
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* WhatsApp Group Card */}
        <Card className="glass border-blue-500/20 bg-blue-500/5">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center gap-4 justify-between">
              <div className="space-y-1 text-center md:text-left">
                <h3 className="font-semibold text-blue-800 dark:text-blue-400">Komunitas Mitra SchoolPro</h3>
                <p className="text-sm text-blue-600 dark:text-blue-500">Gabung grup WhatsApp untuk info terbaru dan diskusi kemitraan.</p>
              </div>
              <div className="flex items-center gap-2 w-full md:w-auto">
                <a href="https://chat.whatsapp.com/EpCkrF5mTnhBEQMNFrawhk" target="_blank" rel="noopener noreferrer" className="w-full md:w-auto">
                  <Button variant="default" className="bg-[#25D366] hover:bg-[#128C7E] text-white w-full md:w-auto">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Gabung Grup WA
                  </Button>
                </a>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
        <Card className="glass">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Klik Link</CardTitle>
            <MousePointerClick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{affiliate.clicks || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Kunjungan referral</p>
          </CardContent>
        </Card>
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
            <p className="text-xs text-muted-foreground mt-1">Belum memberikan komisi</p>
          </CardContent>
        </Card>

        <Card className="glass border-emerald-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sekolah Berbayar</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{paidTenants}</div>
            <p className="text-xs text-emerald-600/70 mt-1">{liteTenants} Lite · {proTenants} Pro — Sumber komisi 20%</p>
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
