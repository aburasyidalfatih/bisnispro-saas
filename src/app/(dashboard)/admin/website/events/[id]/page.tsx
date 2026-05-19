"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { useTenantBranding } from "@/components/providers/tenant-branding-provider"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { eventSchema } from "@/features/event/schemas/event.schema"
import * as z from "zod"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/hooks/use-toast"
import { ArrowLeft, Save, Loader2 } from "lucide-react"
import Link from "next/link"

type FormData = z.infer<typeof eventSchema>

export default function EventFormPage() {
  const router = useRouter()
  const params = useParams()
  const { branding, isLoadingTenant } = useTenantBranding()
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)

  const tenantId = branding.id

  const isNew = params.id === "new"

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(eventSchema),
  })



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
          toast({ title: "Gagal memuat acara", description: d.error, variant: "destructive" })
          router.push("/admin/website/events")
          return
        }
        setValue("title", d.title)
        setValue("description", d.description || "")
        setValue("location", d.location || "")
        setValue("contactPerson", d.contactPerson || "")
        
        // Format dates for datetime-local input (YYYY-MM-DDThh:mm)
        const formatDateTime = (dateStr: string) => {
          if (!dateStr) return ""
          const date = new Date(dateStr)
          return date.toISOString().slice(0, 16)
        }
        
        setValue("startDate", new Date(d.startDate)) // React hook form can take string but datetime-local needs format. Let's see how register handles it.
        // Wait, for datetime-local, the input value needs to be a string formatted as YYYY-MM-DDThh:mm.
        // But zod expects a Date object because of coerce.date(). Let's handle it by letting react-hook-form pass string from DOM, and Zod coerces it.
        // For setValue, we must pass Date to react-hook-form? No, coerce works on validation. We should pass what the input expects if we don't transform it back.
        // The easiest is to just set it as string that datetime-local understands, and coerce will make it Date on submit, or we set it as string in Zod?
        // Actually, since Zod output is Date, but input is string from DOM, setValue expects Date for type safety but DOM needs string.
        // Let's set it as string but cast to any to bypass TS error or use Date object. react-hook-form with type="datetime-local" needs string.
        // Let's use formatDateTime.
        
        // Let's cast as any for the form values to populate correctly
        setValue("startDate", formatDateTime(d.startDate) as any)
        setValue("endDate", formatDateTime(d.endDate) as any)
        
        setInitialLoading(false)
      })
      .catch(() => {
        toast({ title: "Gagal memuat acara", variant: "destructive" })
        setInitialLoading(false)
      })
  }, [tenantId, isNew, params.id, setValue, router])

  const onSubmit = async (data: FormData) => {
    if (!tenantId) return
    setLoading(true)

    const url = isNew ? `/api/tenant/events` : `/api/tenant/events/${params.id}`
    const method = isNew ? "POST" : "PUT"

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, tenantId })
      })

      const d = await res.json()
      if (res.ok) {
        toast({ title: "Berhasil", description: d.message })
        router.push("/admin/website/events")
        router.refresh()
      } else {
        toast({ title: "Gagal menyimpan", description: d.error, variant: "destructive" })
      }
    } catch {
      toast({ title: "Gagal menyimpan acara", variant: "destructive" })
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
            <h1 className="text-2xl font-bold tracking-tight">{isNew ? "Buat Acara Baru" : "Edit Acara"}</h1>
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
              <Label htmlFor="description">Deskripsi Acara</Label>
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
          <Button type="submit" disabled={loading} className="gap-2 btn-gradient text-white border-0 rounded-xl px-8">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {isNew ? "Simpan Acara" : "Update Acara"}
          </Button>
        </div>
      </form>
    </div>
  )
}
