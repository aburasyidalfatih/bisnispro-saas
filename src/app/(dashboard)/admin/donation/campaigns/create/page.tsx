"use client"

import { useState } from"react"
import { useSession } from"next-auth/react"
import { useRouter } from"next/navigation"
import { useToast } from"@/hooks/use-toast"
import { Card, CardContent, CardHeader, CardTitle } from"@/components/ui/card"
import { Button } from"@/components/ui/button"
import { Input } from"@/components/ui/input"
import { Label } from"@/components/ui/label"
import { Switch } from"@/components/ui/switch"
import { ArrowLeft, Loader2, Heart } from"lucide-react"
import Link from"next/link"
import dynamic from"next/dynamic"
import { Textarea } from "@/components/ui/textarea"

export default function CreateCampaignPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const tenant = session?.user?.tenants?.[0]
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    title:"",
    description:"",
    imageUrl:"",
    targetAmount: 0,
    startDate: new Date().toISOString().split("T")[0],
    endDate:"",
    isPublic: true,
    slug:"",
  })

  const handleSubmit = async () => {
    if (!tenant) return
    if (!form.title || !form.targetAmount) return toast({ title:"Judul dan target wajib diisi", variant:"destructive" })
    setLoading(true)
    try {
      const res = await fetch("/api/donation/campaigns", {
        method:"POST",
        headers: {"Content-Type":"application/json" },
        body: JSON.stringify({ tenantId: tenant.id, ...form, targetAmount: Number(form.targetAmount) }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error?.message || data.error ||"Gagal membuat kampanye")
      toast({ title:"Kampanye berhasil dibuat!" })
      router.push("/admin/donation/campaigns")
    } catch (err: any) {
      toast({ title:"Gagal", description: err.message, variant:"destructive" })
    } finally {
      setLoading(false)
    }
  }

  const autoSlug = form.title.toLowerCase().replace(/\s+/g,"-").replace(/[^a-z0-9-]/g,"")

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      <div className="flex items-center gap-3">
        <Link href="/admin/donation/campaigns">
          <Button variant="ghost" size="icon" className="rounded-xl"><ArrowLeft className="h-5 w-5" /></Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Buat Kampanye Donasi</h1>
          <p className="text-sm text-muted-foreground">Galang dana untuk kebutuhan sekolah.</p>
        </div>
      </div>

      <Card className="glass border-0">
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Heart className="h-4 w-4 text-rose-500" /> Detail Kampanye</CardTitle></CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label>Judul Kampanye *</Label>
            <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Pembangunan Masjid Sekolah" className="rounded-xl" />
          </div>

          <div className="space-y-2">
            <Label>Deskripsi</Label>
            <Textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Ceritakan tujuan dan rencana penggunaan dana..."
              className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm min-h-[100px] resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Target Dana (Rp) *</Label>
              <Input type="number" value={form.targetAmount ||""} onChange={e => setForm(f => ({ ...f, targetAmount: Number(e.target.value) }))} placeholder="50000000" className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label>URL Gambar</Label>
              <Input value={form.imageUrl} onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))} placeholder="https://..." className="rounded-xl" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tanggal Mulai *</Label>
              <Input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label>Tanggal Selesai (Opsional)</Label>
              <Input type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} className="rounded-xl" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Slug URL (Publik)</Label>
            <Input
              value={form.slug || autoSlug}
              onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
              placeholder={autoSlug ||"pembangunan-masjid"}
              className="rounded-xl font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">Akses publik: /donasi/{form.slug || autoSlug ||"slug-kampanye"}</p>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl bg-rose-500/5 border border-rose-500/10">
            <div>
              <p className="font-semibold text-sm">Tampilkan di Website Publik</p>
              <p className="text-xs text-muted-foreground">Siapa pun bisa berdonasi tanpa login</p>
            </div>
            <Switch checked={form.isPublic} onCheckedChange={v => setForm(f => ({ ...f, isPublic: v }))} />
          </div>
        </CardContent>
      </Card>

      <Button className="w-full rounded-xl h-12 font-bold" disabled={loading} onClick={handleSubmit}>
        {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <><Heart className="mr-2 h-5 w-5" /> Buat Kampanye</>}
      </Button>
    </div>
  )
}
