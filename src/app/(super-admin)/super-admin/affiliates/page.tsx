"use client"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Users, CreditCard, Wallet, Search, Ban, CheckCircle2, ChevronRight, Trophy, Settings, Save } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import Link from "next/link"

interface Affiliate {
  id: string
  referralCode: string
  balance: number
  isActive: boolean
  createdAt: string
  user: { name: string; email: string }
  withdrawals: Array<{ amount: number }>
}

interface Stats {
  totalAffiliates: number
  totalBalance: number
  totalWithdrawalsPending: number
}

export default function SuperAdminAffiliatesPage() {
  const [data, setData] = useState<{ affiliates: Affiliate[], stats: Stats, totalPages: number }>({ 
    affiliates: [], 
    stats: { totalAffiliates: 0, totalBalance: 0, totalWithdrawalsPending: 0 },
    totalPages: 1
  })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [toggleTarget, setToggleTarget] = useState<Affiliate | null>(null)
  const [toggling, setToggling] = useState(false)

  // Affiliate Settings State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [settingsForm, setSettingsForm] = useState({ AFFILIATE_COMMISSION_PERCENTAGE: "20", AFFILIATE_DEFAULT_CASHBACK_PERCENTAGE: "20" })
  const [savingSettings, setSavingSettings] = useState(false)

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/super-admin/settings")
      const result = await res.json()
      setSettingsForm({
        AFFILIATE_COMMISSION_PERCENTAGE: result.AFFILIATE_COMMISSION_PERCENTAGE || "20",
        AFFILIATE_DEFAULT_CASHBACK_PERCENTAGE: result.AFFILIATE_DEFAULT_CASHBACK_PERCENTAGE || "20"
      })
    } catch (e) {
      console.error(e)
    }
  }, [])

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  const handleSaveSettings = async () => {
    setSavingSettings(true)
    try {
      const res = await fetch("/api/super-admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settingsForm),
      })
      if (res.ok) {
        toast({ title: "Berhasil", description: "Pengaturan komisi afiliasi disimpan." })
        setIsSettingsOpen(false)
      } else {
        throw new Error("Gagal menyimpan")
      }
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" })
    } finally {
      setSavingSettings(false)
    }
  }

  const fetchAffiliates = useCallback(async () => {
    try {
      const url = new URL("/api/super-admin/affiliates", window.location.origin)
      url.searchParams.set("page", page.toString())
      url.searchParams.set("limit", "10")
      if (search) url.searchParams.set("search", search)
      
      const res = await fetch(url.toString())
      const result = await res.json()
      setData(result)
      setLoading(false)
    } catch {
      setLoading(false)
    }
  }, [page, search])

  useEffect(() => {
    setPage(1)
  }, [search])

  useEffect(() => { 
    const timer = setTimeout(() => fetchAffiliates(), 500)
    return () => clearTimeout(timer)
  }, [fetchAffiliates])

  const handleToggleStatus = async () => {
    if (!toggleTarget) return
    setToggling(true)
    try {
      const res = await fetch(`/api/super-admin/affiliates/${toggleTarget.id}/toggle-status`, {
        method: "POST",
      })
      const result = await res.json()
      if (res.ok) {
        toast({ title: "Berhasil", description: result.message })
        setToggleTarget(null)
        fetchAffiliates()
      } else {
        toast({ title: "Gagal", description: result.error, variant: "destructive" })
      }
    } finally {
      setToggling(false)
    }
  }

  const affiliates = data.affiliates || []

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row justify-between gap-4 md:items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Manajemen Afiliasi</h1>
          <p className="text-muted-foreground mt-1">Kelola mitra afiliasi, komisi, dan permintaan penarikan dana.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setIsSettingsOpen(true)} className="rounded-xl gap-2 shadow-sm border-orange-200 bg-orange-50/50 hover:bg-orange-100 text-orange-700">
            <Settings className="h-4 w-4" />
            Pengaturan Komisi
          </Button>
          <Link href="/super-admin/affiliates/leaderboard">
            <Button variant="outline" className="rounded-xl gap-2 border-amber-200 bg-amber-50/50 hover:bg-amber-100 text-amber-700 shadow-sm">
              <Trophy className="h-4 w-4" />
              Leaderboard
            </Button>
          </Link>
          <Link href="/super-admin/affiliates/withdrawals">
            <Button className="rounded-xl gap-2 bg-amber-600 hover:bg-amber-700 text-white border-0 shadow-md">
              <CreditCard className="h-4 w-4" />
              Antrian Penarikan Dana
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="glass">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Mitra</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.stats.totalAffiliates}</div>
          </CardContent>
        </Card>
        
        <Card className="glass">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Saldo Mitra</CardTitle>
            <Wallet className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">Rp {data.stats.totalBalance.toLocaleString('id-ID')}</div>
          </CardContent>
        </Card>

        <Card className="glass border-amber-500/20 bg-amber-500/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-amber-700">Withdrawal Pending</CardTitle>
            <CreditCard className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">Rp {data.stats.totalWithdrawalsPending.toLocaleString('id-ID')}</div>
            <p className="text-xs text-amber-600/70 mt-1">Total antrian dana belum cair</p>
          </CardContent>
        </Card>
      </div>

      <Card className="glass shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle>Daftar Mitra Afiliasi</CardTitle>
              <CardDescription>Semua marketer yang terdaftar di platform.</CardDescription>
            </div>
            <div className="relative w-full sm:w-[250px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari nama atau email..."
                className="rounded-xl pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => <div key={i} className="h-16 bg-muted/50 rounded-xl animate-pulse" />)}
            </div>
          ) : (
            <div className="rounded-xl border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="px-4 py-3 font-medium">Mitra</TableHead>
                    <TableHead className="px-4 py-3 font-medium">Kode Ref</TableHead>
                    <TableHead className="px-4 py-3 font-medium text-right">Saldo Aktif</TableHead>
                    <TableHead className="px-4 py-3 font-medium text-right">Req. Withdraw</TableHead>
                    <TableHead className="px-4 py-3 font-medium text-center">Status</TableHead>
                    <TableHead className="px-4 py-3 font-medium text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {affiliates.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="px-4 py-8 text-center text-muted-foreground italic">Belum ada mitra terdaftar atau tidak ditemukan.</TableCell>
                    </TableRow>
                  ) : (
                    affiliates.map((aff) => {
                      const pendingWd = aff.withdrawals.reduce((a, w) => a + w.amount, 0)
                      return (
                        <TableRow key={aff.id} className="bg-background/50 hover:bg-muted/50 transition-colors">
                          <TableCell className="px-4 py-3 whitespace-nowrap">
                            <div className="font-medium text-foreground">{aff.user.name}</div>
                            <div className="text-[10px] text-muted-foreground">{aff.user.email}</div>
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            <Badge variant="outline" className="font-mono text-xs">{aff.referralCode}</Badge>
                          </TableCell>
                          <TableCell className="px-4 py-3 text-right font-bold text-emerald-600">Rp {aff.balance.toLocaleString('id-ID')}</TableCell>
                          <TableCell className="px-4 py-3 text-right">
                            {pendingWd > 0 ? (
                              <Badge className="bg-amber-500/10 text-amber-600 border-0">Rp {pendingWd.toLocaleString('id-ID')}</Badge>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="px-4 py-3 text-center">
                            {aff.isActive ? (
                              <Badge className="bg-emerald-500/10 text-emerald-600 border-0"><CheckCircle2 className="h-3 w-3 mr-1" /> Aktif</Badge>
                            ) : (
                              <Badge className="bg-rose-500/10 text-rose-600 border-0"><Ban className="h-3 w-3 mr-1" /> Nonaktif</Badge>
                            )}
                          </TableCell>
                          <TableCell className="px-4 py-3 text-right">
                            <Button 
                              variant={aff.isActive ? "outline" : "default"} 
                              size="sm" 
                              onClick={() => setToggleTarget(aff)}
                              className={cn("rounded-lg h-8 text-xs", aff.isActive ? "text-rose-600 hover:text-rose-700 hover:bg-rose-50" : "bg-emerald-600 hover:bg-emerald-700 text-white")}
                            >
                              {aff.isActive ? "Blokir" : "Aktifkan"}
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          {data.totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-6">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-xl"
              >
                Sebelumnya
              </Button>
              <span className="text-sm font-medium text-muted-foreground">
                Halaman {page} dari {data.totalPages}
              </span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setPage(p => Math.min(data.totalPages, p + 1))}
                disabled={page === data.totalPages}
                className="rounded-xl"
              >
                Selanjutnya
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!toggleTarget} onOpenChange={(o) => !o && setToggleTarget(null)}>
        <DialogContent className="rounded-3xl max-w-sm">
          <DialogHeader>
            <DialogTitle>Konfirmasi Status</DialogTitle>
            <DialogDescription>
              {toggleTarget?.isActive 
                ? `Apakah Anda yakin ingin memblokir/menonaktifkan afiliasi ${toggleTarget.user.name}? Mereka tidak akan bisa mendapatkan komisi baru.` 
                : `Aktifkan kembali afiliasi ${toggleTarget?.user.name}?`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="ghost" onClick={() => setToggleTarget(null)} disabled={toggling} className="rounded-xl">Batal</Button>
            <Button variant="outline" 
              onClick={handleToggleStatus} 
              disabled={toggling}
              className={cn("rounded-xl border-0", toggleTarget?.isActive ? "bg-rose-600 hover:bg-rose-700 text-white" : "bg-emerald-600 hover:bg-emerald-700 text-white")}
            >
              {toggling ? "Memproses..." : toggleTarget?.isActive ? "Ya, Blokir" : "Ya, Aktifkan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="rounded-3xl max-w-md">
          <DialogHeader>
            <DialogTitle>Pengaturan Komisi & Cashback Afiliasi</DialogTitle>
            <DialogDescription>
              Atur persentase komisi dan nominal default cashback untuk program afiliasi.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Persentase Komisi (%)</label>
              <Input 
                type="number" 
                value={settingsForm.AFFILIATE_COMMISSION_PERCENTAGE} 
                onChange={e => setSettingsForm({...settingsForm, AFFILIATE_COMMISSION_PERCENTAGE: e.target.value})} 
                className="rounded-xl"
              />
              <p className="text-xs text-muted-foreground">Persentase dari total pembayaran sekolah yang akan masuk ke saldo Mitra (Misal: 20).</p>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Persentase Cashback Default (%)</label>
              <Input 
                type="number" 
                value={settingsForm.AFFILIATE_DEFAULT_CASHBACK_PERCENTAGE} 
                onChange={e => setSettingsForm({...settingsForm, AFFILIATE_DEFAULT_CASHBACK_PERCENTAGE: e.target.value})} 
                className="rounded-xl"
              />
              <p className="text-xs text-muted-foreground">Cashback (potongan harga) berupa persentase otomatis yang dibuat untuk sekolah saat menggunakan kode referral mitra baru.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsSettingsOpen(false)} disabled={savingSettings} className="rounded-xl">Batal</Button>
            <Button onClick={handleSaveSettings} disabled={savingSettings} className="rounded-xl gap-2 border-0 btn-gradient text-white">
              {savingSettings ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <Save className="h-4 w-4" />}
              Simpan Pengaturan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
