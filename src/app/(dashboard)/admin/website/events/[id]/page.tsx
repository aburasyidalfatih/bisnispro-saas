"use client"

import { useEffect, useState } from"react"
import { useRouter, useParams } from"next/navigation"
import { useTenantBranding } from"@/components/providers/tenant-branding-provider"
import { useForm } from"react-hook-form"
import { zodResolver } from"@hookform/resolvers/zod"
import { eventSchema } from"@/features/event/schemas/event.schema"
import * as z from"zod"
import { Card, CardContent, CardHeader, CardTitle } from"@/components/ui/card"
import { Button } from"@/components/ui/button"
import { Input } from"@/components/ui/input"
import { Label } from"@/components/ui/label"
import { Textarea } from"@/components/ui/textarea"
import { toast } from"@/hooks/use-toast"
import { ArrowLeft, Save, Loader2, Sparkles, Wand2 } from"lucide-react"
import Link from"next/link"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from"@/components/ui/dialog"

type FormData = z.infer<typeof eventSchema>

export default function EventFormPage() {
  const router = useRouter()
  const params = useParams()
  const { branding, isLoadingTenant } = useTenantBranding()
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)

  const tenantId = branding.id

  const isNew = params.id ==="new"

  const { register, handleSubmit, setValue, getValues, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(eventSchema),
  })

  // AI State
  const [aiModalOpen, setAiModalOpen] = useState(false)
  const [aiInputText, setAiInputText] = useState("")
  const [aiLoading, setAiLoading] = useState(false)

  const handleGenerateAI = async () => {
    const title = getValues("title")
    if (!title) {
      toast({ title:"Judul Belum Diisi", description:"Silakan isi Judul Acara terlebih dahulu.", variant:"destructive" })
      return
    }
    if (!aiInputText.trim()) {
      toast({ title:"Input kosong", description:"Silakan masukkan detail acara.", variant:"destructive" })
      return
    }

    setAiLoading(true)
    try {
      const res = await fetch("/api/tenant/ai/generate-content", {
        method:"POST",
        headers: {"Content-Type":"application/json" },
        body: JSON.stringify({ 
          tenantId, 
          promptType:"event", 
          inputs: { text: aiInputText, name: title } 
        })
      })
      const d = await res.json()
      if (res.ok && d.success && d.data?.result) {
        setValue("description", d.data.result, { shouldValidate: true })
        setAiModalOpen(false)
        setAiInputText("")
        toast({ title:"Berhasil", description:"Deskripsi acara berhasil di-generate AI." })
      } else {
        toast({ title:"Gagal", description: d.error ||"Terjadi kesalahan", variant:"destructive" })
      }
    } catch (err) {
      toast({ title:"Error", description:"Gagal menghubungi server AI", variant:"destructive" })
    } finally {
      setAiLoading(false)
    }
  }

  useEffect(() => {
    if (isLoadingTenant) return
    if (!tenantId) return
    if (isNew) {
      setInitialLoading(false)
      return
    }

    fetch(`/api/tenant/events/${params.id}?tenantId=${tenantId}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) {
          toast({ title:"Gagal memuat acara", description: d.error, variant:"destructive" })
          router.push("/admin/website/events")
          return
        }
        setValue("title", d.title)
        setValue("description", d.description ||"")
        setValue("location", d.location ||"")
        setValue("contactPerson", d.contactPerson ||"")
        
        // Format dates for datetime-local input (YYYY-MM-DDThh:mm) in local timezone
        const formatDateTime = (dateStr: string) => {
          if (!dateStr) return ""
          const date = new Date(dateStr)
          const pad = (n: number) => n.toString().padStart(2, '0')
          return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
        }
        
        // Let's cast as any for the form values to populate correctly
        setValue("startDate", formatDateTime(d.startDate) as any)
        setValue("endDate", formatDateTime(d.endDate) as any)
        
        setInitialLoading(false)
      })
      .catch(() => {
        toast({ title:"Gagal memuat acara", variant:"destructive" })
        setInitialLoading(false)
      })
  }, [tenantId, isNew, params.id, setValue, router])

  const onSubmit = async (data: FormData) => {
    if (!tenantId) return
    setLoading(true)

    const url = isNew ? `/api/tenant/events` : `/api/tenant/events/${params.id}`
    const method = isNew ?"POST" :"PUT"

    try {
      const res = await fetch(url, {
        method,
        headers: {"Content-Type":"application/json" },
        body: JSON.stringify({ ...data, tenantId })
      })

      const d = await res.json()
      if (res.ok) {
        toast({ title:"Berhasil", description: d.message })
        router.push("/admin/website/events")
        router.refresh()
      } else {
        toast({ title:"Gagal menyimpan", description: d.error, variant:"destructive" })
      }
    } catch {
      toast({ title:"Gagal menyimpan acara", variant:"destructive" })
    } finally {
      setLoading(false)
    }
  }

  if (initialLoading) return <div className="skeleton h-96 rounded-2xl" />

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="icon" className="h-8 w-8 rounded-full">
            <Link href="/admin/website/events">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{isNew ?"Buat Acara Baru" :"Edit Acara"}</h1>
            <p className="text-muted-foreground mt-1">Tambahkan informasi acara ke kalender sekolah.</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card className="glass border-0">
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Informasi Dasar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Judul Acara <span className="text-red-500">*</span></Label>
              <Input id="title" {...register("title")} className="rounded-xl" placeholder="Contoh: Rapat Wali Murid" />
              {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="startDate">Waktu Mulai <span className="text-red-500">*</span></Label>
                <Input type="datetime-local" id="startDate" {...register("startDate")} className="rounded-xl" />
                {errors.startDate && <p className="text-xs text-red-500">{errors.startDate.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">Waktu Selesai <span className="text-red-500">*</span></Label>
                <Input type="datetime-local" id="endDate" {...register("endDate")} className="rounded-xl" />
                {errors.endDate && <p className="text-xs text-red-500">{errors.endDate.message}</p>}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="location">Lokasi</Label>
                <Input id="location" {...register("location")} className="rounded-xl" placeholder="Contoh: Aula Utama" />
                {errors.location && <p className="text-xs text-red-500">{errors.location.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactPerson">Narahubung (Contact Person)</Label>
                <Input id="contactPerson" {...register("contactPerson")} className="rounded-xl" placeholder="Contoh: Bpk. Budi (08123...)" />
                {errors.contactPerson && <p className="text-xs text-red-500">{errors.contactPerson.message}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="description">Deskripsi Acara</Label>
                <Button type="button" variant="outline" size="sm" onClick={() => setAiModalOpen(true)} className="h-7 text-[10px] gap-1.5 rounded-xl border-violet-200 text-violet-600 bg-violet-50 hover:bg-violet-100 hover:text-violet-700 px-2">
                  <Sparkles className="h-3 w-3" /> Buat Deskripsi AI
                </Button>
              </div>
              <Textarea 
                id="description" 
                {...register("description")} 
                className="rounded-xl min-h-[150px] resize-y text-sm" 
                placeholder="Tuliskan detail lengkap tentang acara ini..." 
              />
              {errors.description && <p className="text-xs text-red-500">{errors.description.message}</p>}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button asChild variant="outline" className="rounded-xl">
            <Link href="/admin/website/events">Batal</Link>
          </Button>
          <Button type="submit" disabled={loading} className="gap-2 btn-gradient text-white border-0 rounded-xl px-8 flex items-center justify-center">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {isNew ?"Simpan Acara" :"Update Acara"}
          </Button>
        </div>
      </form>

      {/* AI Content Modal */}
      <Dialog open={aiModalOpen} onOpenChange={setAiModalOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-2xl max-w-full">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-violet-500" />
              Generate Deskripsi Acara
            </DialogTitle>
            <DialogDescription>
              AI akan merangkai poin-poin informasi menjadi deskripsi acara yang menarik dan informatif.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Detail / Poin Acara <span className="text-red-500">*</span></Label>
              <Textarea 
                value={aiInputText}
                onChange={(e) => setAiInputText(e.target.value)}
                placeholder="Contoh: Mengundang seluruh wali murid untuk pembagian rapot semester ganjil, harap hadir tepat waktu, tempat di aula."
                className="min-h-[120px] rounded-xl resize-none"
              />
            </div>
            
            <div className="rounded-xl bg-violet-500/10 p-3 flex gap-2 items-start mt-2 border border-violet-500/20">
              <Wand2 className="h-4 w-4 text-violet-600 mt-0.5 shrink-0" />
              <p className="text-[11px] text-violet-700 leading-relaxed">
                Akan memotong saldo AI Token (25 token). Pastikan judul acara sudah diisi sebelum generate.
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="ghost" className="rounded-xl" onClick={() => setAiModalOpen(false)} disabled={aiLoading}>
              Batal
            </Button>
            <Button 
              type="button"
              onClick={handleGenerateAI} 
              disabled={aiLoading || !aiInputText.trim()}
              className="rounded-xl gap-2 bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white border-0"
            >
              {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {aiLoading ?"Memproses..." :"Generate Deskripsi"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
