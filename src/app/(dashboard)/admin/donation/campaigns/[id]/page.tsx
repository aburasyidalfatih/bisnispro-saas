"use client"

import { useEffect, useState, use } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { ImageUploadDirect } from "@/components/ui/image-upload-direct"
import {
  ArrowLeft, Heart, Target, Users, Loader2, Check,
  AlertCircle, Calendar, Edit2, Globe, HeartHandshake,
  ExternalLink, Sparkles
} from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { id as localeId } from "date-fns/locale"

interface Props {
  params: Promise<{ id: string }>
}

export default function CampaignDetailPage({ params }: Props) {
  const { id } = use(params)
  const { data: session } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const tenant = session?.user?.tenants?.[0]

  const [campaign, setCampaign] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [approvingId, setApprovingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    title: "",
    description: "",
    imageUrl: "",
    qrisUrl: "",
    bankInfo: "",
    targetAmount: 0,
    startDate: "",
    endDate: "",
    isPublic: true,
    isActive: true,
    slug: "",
  })

  const fetchCampaign = async () => {
    if (!tenant) return
    try {
      const res = await fetch(`/api/donation/campaigns/${id}?tenantId=${tenant.id}`)
      if (!res.ok) throw new Error("Gagal mengambil detail kampanye")
      const data = await res.json()
      setCampaign(data)
      setForm({
        title: data.title || "",
        description: data.description || "",
        imageUrl: data.imageUrl || "",
        qrisUrl: data.qrisUrl || "",
        bankInfo: data.bankInfo || "",
        targetAmount: data.targetAmount || 0,
        startDate: data.startDate ? new Date(data.startDate).toISOString().split("T")[0] : "",
        endDate: data.endDate ? new Date(data.endDate).toISOString().split("T")[0] : "",
        isPublic: data.isPublic ?? true,
        isActive: data.isActive ?? true,
        slug: data.slug || "",
      })
    } catch (err: any) {
      toast({ title: "Gagal memuat kampanye", description: err.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCampaign()
  }, [tenant, id])

  const handleApprove = async (donationId: string) => {
    if (!confirm("Setujui pembayaran donasi ini?")) return
    setApprovingId(donationId)
    try {
      const res = await fetch(`/api/donation/donations/${donationId}/approve`, {
        method: "POST",
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      toast({ title: "Berhasil menyetujui donasi!" })
      fetchCampaign()
    } catch (err: any) {
      toast({ title: "Gagal menyetujui donasi", description: err.message, variant: "destructive" })
    } finally {
      setApprovingId(null)
    }
  }

  const handleUpdateCampaign = async () => {
    if (!tenant) return
    setSaving(true)
    try {
      const res = await fetch(`/api/donation/campaigns/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId: tenant.id,
          ...form,
          targetAmount: Number(form.targetAmount),
          startDate: form.startDate ? new Date(form.startDate) : undefined,
          endDate: form.endDate ? new Date(form.endDate) : null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Gagal memperbarui kampanye")

      toast({ title: "Kampanye berhasil diperbarui!" })
      fetchCampaign()
    } catch (err: any) {
      toast({ title: "Gagal memperbarui kampanye", description: err.message, variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-rose-500" />
        <p className="text-sm text-muted-foreground">Memuat detail kampanye...</p>
      </div>
    )
  }

  if (!campaign) {
    return (
      <Card className="glass border-0 max-w-md mx-auto text-center p-8 mt-12">
        <AlertCircle className="h-16 w-16 text-rose-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold">Kampanye Tidak Ditemukan</h2>
        <p className="text-sm text-muted-foreground mt-2">Mungkin kampanye ini sudah dihapus atau tidak dapat diakses.</p>
        <Link href="/admin/donation/campaigns" className="mt-4 inline-block">
          <Button variant="outline" className="rounded-xl">Kembali ke Daftar</Button>
        </Link>
      </Card>
    )
  }

  const donations = campaign.donations || []
  const pendingDonations = donations.filter((d: any) => d.status === "PENDING")
  const paidDonations = donations.filter((d: any) => d.status === "PAID")
  const pct = Math.min((campaign.collectedAmount / campaign.targetAmount) * 100, 100)

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/admin/donation/campaigns">
            <Button variant="ghost" size="icon" className="rounded-xl"><ArrowLeft className="h-5 w-5" /></Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{campaign.title}</h1>
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <span>Crowdfunding Sekolah</span>
              <span>•</span>
              <span className="font-mono text-xs">{campaign.slug}</span>
              {campaign.isPublic && (
                <>
                  <span>•</span>
                  <Badge variant="outline" className="text-[10px] bg-sky-500/10 text-sky-600 border-sky-200 gap-1">
                    <Globe className="h-3 w-3" /> Publik
                  </Badge>
                </>
              )}
            </p>
          </div>
        </div>

        <a href={`/donasi/${campaign.id}`} target="_blank" rel="noopener noreferrer">
          <Button variant="outline" className="rounded-xl gap-2 text-rose-600 border-rose-200 bg-rose-50/50 hover:bg-rose-50">
            <ExternalLink className="h-4 w-4" /> Buka Halaman Publik
          </Button>
        </a>
      </div>

      {/* Progress Cards */}
      <div className="grid md:grid-cols-3 gap-5">
        <Card className="glass border-0 shadow-sm md:col-span-2">
          <CardContent className="p-5 space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Total Dana Terkumpul</p>
                <h3 className="text-3xl font-black text-rose-600 mt-1">Rp {campaign.collectedAmount.toLocaleString("id-ID")}</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Target: <strong>Rp {campaign.targetAmount.toLocaleString("id-ID")}</strong>
                </p>
              </div>
              <Badge className="bg-rose-500/10 text-rose-600 font-bold border-rose-200 border text-sm px-3 py-1">
                {Math.round(pct)}% Tercapai
              </Badge>
            </div>

            <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-rose-500 to-pink-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
            </div>

            <div className="flex justify-between text-xs text-muted-foreground pt-1">
              <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5 text-rose-500" /> <strong>{paidDonations.length}</strong> Donatur Lunas</span>
              <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5 text-rose-500" /> Mulai {format(new Date(campaign.startDate), "dd MMMM yyyy", { locale: localeId })}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-0 shadow-sm bg-gradient-to-br from-amber-500/5 to-orange-500/5 border-amber-500/10">
          <CardContent className="p-5 h-full flex flex-col justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Menunggu Persetujuan</p>
              <h3 className="text-3xl font-black text-amber-600 mt-1">{pendingDonations.length} Transaksi</h3>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                Terdapat donasi manual (Transfer/QRIS) yang memerlukan pengecekan rekening sekolah & persetujuan Anda.
              </p>
            </div>
            {pendingDonations.length > 0 && (
              <Badge className="bg-amber-500 text-white animate-pulse self-start mt-4 px-2.5 py-1">
                Perlu Verifikasi
              </Badge>
            )}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="donations" className="space-y-6">
        <TabsList className="bg-slate-100 p-1 rounded-xl">
          <TabsTrigger value="donations" className="rounded-lg gap-2">
            <HeartHandshake className="h-4 w-4" /> Donatur ({donations.length})
          </TabsTrigger>
          <TabsTrigger value="edit" className="rounded-lg gap-2">
            <Edit2 className="h-4 w-4" /> Pengaturan Kampanye
          </TabsTrigger>
        </TabsList>

        <TabsContent value="donations" className="space-y-6">
          {/* Persetujuan Donasi */}
          {pendingDonations.length > 0 && (
            <Card className="border border-amber-200/60 shadow-sm bg-amber-500/5 rounded-2xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold flex items-center gap-2 text-amber-700">
                  <AlertCircle className="h-5 w-5 text-amber-500" /> Butuh Persetujuan Pembayaran
                </CardTitle>
                <CardDescription>
                  Periksa mutasi rekening sekolah Anda sebelum menyetujui transaksi donasi manual di bawah ini.
                </CardDescription>
              </CardHeader>
              <CardContent className="divide-y divide-amber-200/30">
                {pendingDonations.map((d: any) => (
                  <div key={d.id} className="py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-foreground">{d.donorName}</span>
                        {d.donorEmail && <span className="text-xs text-muted-foreground">({d.donorEmail})</span>}
                        {d.isAnonymous && <Badge variant="outline" className="text-[10px] bg-slate-100">Anonim</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Metode: <Badge variant="secondary" className="text-[10px]">{d.method}</Badge>
                        {" • "}
                        Tanggal: {format(new Date(d.createdAt), "dd MMM yyyy HH:mm", { locale: localeId })}
                      </p>
                      {d.message && (
                        <p className="text-xs text-amber-800 bg-amber-500/10 px-3 py-1.5 rounded-lg italic mt-2 border border-amber-500/10">
                          "{d.message}"
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-amber-200/20">
                      <span className="font-black text-amber-600 text-lg sm:text-base">
                        Rp {d.amount.toLocaleString("id-ID")}
                      </span>
                      <Button
                        size="sm"
                        className="rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold gap-1"
                        disabled={approvingId === d.id}
                        onClick={() => handleApprove(d.id)}
                      >
                        {approvingId === d.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Setujui
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Daftar Donatur Lunas */}
          <Card className="glass border-0 shadow-sm rounded-2xl">
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Check className="h-5 w-5 text-emerald-500" /> Riwayat Donasi Berhasil ({paidDonations.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {paidDonations.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  Belum ada donasi lunas yang masuk untuk kampanye ini.
                </div>
              ) : (
                <div className="divide-y">
                  {paidDonations.map((d: any) => (
                    <div key={d.id} className="py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-foreground">{d.donorName}</span>
                          {d.isAnonymous && <Badge variant="outline" className="text-[10px] bg-slate-100">Anonim</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Metode: <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-600 border-emerald-100">{d.method}</Badge>
                          {" • "}
                          Diterima: {d.paidAt ? format(new Date(d.paidAt), "dd MMM yyyy HH:mm", { locale: localeId }) : "-"}
                        </p>
                        {d.message && <p className="text-xs text-muted-foreground italic mt-2">"{d.message}"</p>}
                      </div>
                      <span className="font-black text-emerald-600 text-lg sm:text-base">
                        + Rp {d.amount.toLocaleString("id-ID")}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="edit" className="space-y-6">
          <Card className="glass border-0 shadow-sm rounded-2xl">
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-rose-500" /> Pengaturan Kampanye Donasi
              </CardTitle>
              <CardDescription>
                Sesuaikan informasi detail, target penggalangan dana, serta rekening pembayaran.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Judul Kampanye *</Label>
                  <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label>Target Dana (Rp) *</Label>
                  <Input type="number" value={form.targetAmount || ""} onChange={e => setForm(f => ({ ...f, targetAmount: Number(e.target.value) }))} className="rounded-xl" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Deskripsi Cerita Kampanye</Label>
                <Textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="rounded-xl min-h-[120px] resize-none"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tanggal Mulai *</Label>
                  <Input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} className="rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label>Tanggal Selesai (Opsional)</Label>
                  <Input type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} className="rounded-xl" />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Slug URL Kampanye</Label>
                  <Input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} className="rounded-xl font-mono text-sm" />
                </div>
                <div className="space-y-2">
                  <Label>URL Gambar Utama Kampanye</Label>
                  <Input value={form.imageUrl} onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))} placeholder="https://..." className="rounded-xl" />
                </div>
              </div>

              <div className="border-t border-slate-100 pt-5 space-y-4">
                <h4 className="font-bold text-sm text-foreground">Metode Pembayaran Manual Sekolah</h4>

                <div className="space-y-2">
                  <Label>QRIS Sekolah (Unggah Gambar Barcode)</Label>
                  {tenant && (
                    <ImageUploadDirect
                      tenantId={tenant.id}
                      value={form.qrisUrl}
                      onChange={url => setForm(f => ({ ...f, qrisUrl: url }))}
                      subDir="donations"
                      hint="Upload file gambar QRIS sekolah"
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Informasi Rekening Bank (Manual)</Label>
                  <Textarea
                    value={form.bankInfo}
                    onChange={e => setForm(f => ({ ...f, bankInfo: e.target.value }))}
                    placeholder="Contoh: Transfer ke BSI 123-456-7890 a.n. Masjid Sekolah"
                    className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm min-h-[80px] resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>

              <div className="border-t border-slate-100 pt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-4 rounded-xl border">
                  <div>
                    <p className="font-semibold text-sm">Kampanye Aktif</p>
                    <p className="text-xs text-muted-foreground">Aktifkan untuk menerima donasi baru</p>
                  </div>
                  <Switch checked={form.isActive} onCheckedChange={v => setForm(f => ({ ...f, isActive: v }))} />
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl border">
                  <div>
                    <p className="font-semibold text-sm">Tampilkan di Publik</p>
                    <p className="text-xs text-muted-foreground">Dapat diakses oleh umum tanpa perlu login</p>
                  </div>
                  <Switch checked={form.isPublic} onCheckedChange={v => setForm(f => ({ ...f, isPublic: v }))} />
                </div>
              </div>

              <div className="flex justify-end pt-3">
                <Button onClick={handleUpdateCampaign} className="rounded-xl px-8 h-12 font-bold" disabled={saving}>
                  {saving ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null} Simpan Perubahan
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
