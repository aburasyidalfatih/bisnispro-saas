"use client"

import { useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent } from "@/components/ui/card"
import { Heart, Loader2, Users, Target, CheckCircle } from "lucide-react"
import { format } from "date-fns"
import { id as localeId } from "date-fns/locale"
import Image from "next/image"
import { normalizeImageUrl } from "@/lib/utils"
import DOMPurify from "isomorphic-dompurify"

const QUICK_AMOUNTS = [10000, 25000, 50000, 100000, 250000, 500000]

interface Campaign {
  id: string; title: string; description?: string | null; imageUrl?: string | null
  qrisUrl?: string | null
  bankInfo?: string | null
  targetAmount: number; collectedAmount: number; endDate?: Date | string | null
  tenant: { id: string; name: string; logo?: string | null; slug: string }
  donations: {
    id: string; donorName: string; amount: number; message?: string | null
    isAnonymous: boolean; paidAt?: Date | string | null
  }[]
}

export function DonationPublicClient({ campaign }: { campaign: Campaign }) {
  const { toast } = useToast()
  const [step, setStep] = useState<"form" | "payment" | "success">("form")
  const [amount, setAmount] = useState<number>(0)
  const [form, setForm] = useState({
    donorName: "", donorEmail: "", message: "", isAnonymous: false, paymentChannel: "QRIS",
  })
  const [loading, setLoading] = useState(false)
  const [checkoutUrl, setCheckoutUrl] = useState("")

  const pct = Math.min((campaign.collectedAmount / campaign.targetAmount) * 100, 100)
  const donorCount = campaign.donations.length

  const handleSubmit = async () => {
    if (!amount || amount < 1000) return toast({ title: "Nominal minimal Rp 1.000", variant: "destructive" })
    if (!form.donorName && !form.isAnonymous) return toast({ title: "Nama donatur wajib diisi", variant: "destructive" })

    setLoading(true)
    try {
      const res = await fetch("/api/donation/donate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId: campaign.id,
          tenantId: campaign.tenant.id,
          donorName: form.isAnonymous ? "Hamba Allah" : form.donorName,
          donorEmail: form.donorEmail || undefined,
          amount,
          method: "MANUAL",
          message: form.message || undefined,
          isAnonymous: form.isAnonymous,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      setStep("payment")
    } catch (err: any) {
      toast({ title: "Gagal memproses donasi", description: err.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  if (step === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center p-5 bg-gradient-to-b from-emerald-50 to-white">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="h-24 w-24 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto">
            <CheckCircle className="h-12 w-12 text-emerald-600" />
          </div>
          <h1 className="text-3xl font-black">Terima Kasih! 🎉</h1>
          <p className="text-muted-foreground">Konfirmasi donasi Anda sebesar <strong>Rp {amount.toLocaleString("id-ID")}</strong> untuk <strong>{campaign.title}</strong> telah kami terima.</p>
          <p className="text-sm text-amber-600 bg-amber-50 border border-amber-200/50 px-4 py-3 rounded-xl max-w-sm mx-auto font-medium">
            Status donasi saat ini sedang diverifikasi oleh pihak sekolah. Nominal donasi terkumpul akan bertambah setelah pembayaran Anda disetujui admin.
          </p>
          <p className="text-xs text-muted-foreground">Semoga menjadi amal jariyah yang terus mengalir.</p>
        </div>
      </div>
    )
  }

  if (step === "payment") {
    return (
      <div className="min-h-screen flex items-center justify-center p-5 bg-gradient-to-b from-rose-50/30 to-white">
        <div className="max-w-md w-full bg-white rounded-2xl border border-gray-100 p-6 shadow-xl text-center space-y-6">
          <h1 className="text-2xl font-bold">Selesaikan Pembayaran</h1>
          <p className="text-sm text-muted-foreground">
            Silakan lakukan transfer sebesar <strong className="text-rose-600 text-lg">Rp {amount.toLocaleString("id-ID")}</strong> menggunakan metode di bawah ini:
          </p>

          {campaign.qrisUrl && (
            <div className="bg-slate-50 p-4 rounded-xl border border-dashed border-gray-200 flex flex-col items-center gap-2">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Scan QRIS</span>
              <div className="relative w-48 h-48 bg-white border rounded-lg p-2 overflow-hidden flex items-center justify-center">
                <Image src={normalizeImageUrl(campaign.qrisUrl) || campaign.qrisUrl} alt="QRIS Sekolah" fill className="object-contain max-h-full max-w-full" unoptimized />
              </div>
              <p className="text-[10px] text-muted-foreground">Bisa discan dengan aplikasi m-banking atau e-wallet apa saja</p>
            </div>
          )}

          {campaign.bankInfo && (
            <div className="bg-slate-50 p-4 rounded-xl border border-gray-200 text-left space-y-2">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest block text-center">Transfer Bank</span>
              <p className="text-sm text-foreground font-mono bg-white px-3 py-2 rounded border break-all whitespace-pre-wrap">
                {campaign.bankInfo}
              </p>
            </div>
          )}

          {!campaign.qrisUrl && !campaign.bankInfo && (
            <div className="bg-slate-50 p-4 rounded-xl border text-center text-muted-foreground text-sm">
              Silakan hubungi pihak sekolah untuk informasi rekening donasi.
            </div>
          )}

          <div className="space-y-2">
            <Button onClick={() => setStep("success")} className="w-full h-14 rounded-xl text-base font-bold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-md">
              Saya Sudah Melakukan Pembayaran
            </Button>
            <button onClick={() => setStep("form")} className="text-xs text-muted-foreground underline block mx-auto">
              ← Ubah Nominal / Data
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50/50 to-white">
      {/* Hero */}
      <div className="relative h-72 sm:h-96 bg-gray-200 overflow-hidden">
        {campaign.imageUrl ? (
          <Image src={normalizeImageUrl(campaign.imageUrl) || campaign.imageUrl} alt={campaign.title} fill className="object-cover" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-rose-400 to-pink-600 flex items-center justify-center">
            <Heart className="h-24 w-24 text-white/50" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
          <div className="flex items-center gap-2 mb-3">
            {campaign.tenant.logo && (
              <Image src={normalizeImageUrl(campaign.tenant.logo) || campaign.tenant.logo} alt={campaign.tenant.name} width={32} height={32} className="rounded-full bg-white p-0.5 object-contain" unoptimized />
            )}
            <span className="text-sm font-semibold text-white/90">{campaign.tenant.name}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black leading-tight">{campaign.title}</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-5 py-8 space-y-6">
        {/* Progress */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex justify-between items-start mb-3">
            <div>
              <p className="text-2xl font-black text-rose-600">Rp {campaign.collectedAmount.toLocaleString("id-ID")}</p>
              <p className="text-sm text-muted-foreground">terkumpul dari <strong>Rp {campaign.targetAmount.toLocaleString("id-ID")}</strong></p>
            </div>
            <span className="text-2xl font-black text-rose-600">{Math.round(pct)}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden mb-3">
            <div className="h-full bg-gradient-to-r from-rose-500 to-pink-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
          </div>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5"><Users className="h-4 w-4" /> {donorCount} donatur</span>
            {campaign.endDate && (
              <span className="flex items-center gap-1.5"><Target className="h-4 w-4" />
                Sampai {format(new Date(campaign.endDate), "d MMMM yyyy", { locale: localeId })}
              </span>
            )}
          </div>
        </div>

        {/* Deskripsi */}
        {campaign.description && (
          <div className="prose prose-slate max-w-none mb-8">
            <h3 className="text-xl font-bold text-foreground mb-4">Cerita & Tujuan Donasi</h3>
            <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(campaign.description) }} />
          </div>
        )}

        {/* Form Donasi */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-5">
          <h2 className="text-xl font-bold flex items-center gap-2"><Heart className="h-5 w-5 text-rose-500" /> Tulis Donasimu</h2>

          {/* Pilih Nominal */}
          <div className="space-y-3">
            <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Pilih Nominal</Label>
            <div className="grid grid-cols-3 gap-2">
              {QUICK_AMOUNTS.map(n => (
                <button
                  key={n}
                  onClick={() => setAmount(n)}
                  className={`py-3 rounded-xl text-sm font-bold border-2 transition-all ${amount === n ? "border-rose-500 bg-rose-500/10 text-rose-600" : "border-gray-200 hover:border-rose-300 text-muted-foreground"}`}
                >
                  {n >= 1000000 ? `${n / 1000000}Jt` : `${n / 1000}Rb`}
                </button>
              ))}
            </div>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">Rp</span>
              <Input
                type="number"
                value={amount || ""}
                onChange={e => setAmount(Number(e.target.value))}
                placeholder="Nominal lainnya..."
                className="pl-10 rounded-xl h-12 font-bold text-base"
              />
            </div>
          </div>

          {/* Identitas */}
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl border border-gray-200">
              <Label className="text-sm font-semibold">Donasi Anonim</Label>
              <Switch checked={form.isAnonymous} onCheckedChange={v => setForm(f => ({ ...f, isAnonymous: v }))} />
            </div>

            {!form.isAnonymous && (
              <div className="space-y-3">
                <Input
                  value={form.donorName}
                  onChange={e => setForm(f => ({ ...f, donorName: e.target.value }))}
                  placeholder="Nama Anda *"
                  className="rounded-xl h-12"
                />
                <Input
                  type="email"
                  value={form.donorEmail}
                  onChange={e => setForm(f => ({ ...f, donorEmail: e.target.value }))}
                  placeholder="Email (untuk notifikasi, opsional)"
                  className="rounded-xl h-12"
                />
              </div>
            )}

            <Input
              value={form.message}
              onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
              placeholder="Pesan / Doa (opsional)"
              className="rounded-xl h-12"
            />
          </div>

          <Button
            className="w-full h-14 rounded-2xl text-base font-bold bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 shadow-lg shadow-rose-500/30"
            disabled={loading || !amount}
            onClick={handleSubmit}
          >
            {loading
              ? <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              : <><Heart className="mr-2 h-5 w-5" /> Donasi Rp {amount > 0 ? amount.toLocaleString("id-ID") : "..."}</>
            }
          </Button>
        </div>

        {/* Donatur terbaru */}
        {campaign.donations.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h2 className="font-bold mb-4">Donatur Terbaru ({donorCount})</h2>
            <div className="space-y-3">
              {campaign.donations.map(d => (
                <div key={d.id} className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-full bg-rose-500/10 flex items-center justify-center shrink-0 font-bold text-rose-600 text-sm">
                    {d.isAnonymous ? "?" : d.donorName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <p className="font-semibold text-sm">{d.isAnonymous ? "Hamba Allah" : d.donorName}</p>
                      <p className="text-sm font-black text-rose-600">Rp {d.amount.toLocaleString("id-ID")}</p>
                    </div>
                    {d.message && <p className="text-xs text-muted-foreground italic">"{d.message}"</p>}
                    {d.paidAt && (
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {format(new Date(d.paidAt), "d MMM yyyy", { locale: localeId })}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
