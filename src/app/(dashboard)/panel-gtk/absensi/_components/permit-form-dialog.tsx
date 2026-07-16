"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { FileText, Loader2, Send } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"

type PermitFormDialogProps = {
  tenantId: string
  staffId: string
  onSubmitted: () => void
}

export function PermitFormDialog({ tenantId, staffId, onSubmitted }: PermitFormDialogProps) {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [permitFile, setPermitFile] = useState<File | null>(null)
  const [form, setForm] = useState({
    type: "IZIN",
    startDate: format(new Date(), "yyyy-MM-dd"),
    endDate: format(new Date(), "yyyy-MM-dd"),
    reason: "",
    proofUrl: ""
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      let finalProofUrl = form.proofUrl

      if (permitFile) {
        const formData = new FormData()
        formData.append("file", permitFile)
        formData.append("tenantId", tenantId)
        formData.append("subDir", "permits")

        const uploadRes = await fetch("/api/upload", { method: "POST", body: formData })
        const uploadData = await uploadRes.json()
        if (!uploadRes.ok) throw new Error(uploadData.error || "Gagal upload file")
        finalProofUrl = uploadData.url
      }

      const res = await fetch("/api/gtk/attendance/permits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          proofUrl: finalProofUrl,
          tenantId,
          staffId
        })
      })
      if (!res.ok) throw new Error((await res.json()).error)
      toast({ title: "Pengajuan izin berhasil dikirim!" })
      setOpen(false)
      onSubmitted()
      setForm({ type: "IZIN", startDate: format(new Date(), "yyyy-MM-dd"), endDate: format(new Date(), "yyyy-MM-dd"), reason: "", proofUrl: "" })
      setPermitFile(null)
    } catch (err: any) {
      toast({ title: "Gagal mengajukan izin", description: err.message, variant: "destructive" })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full h-12 rounded-2xl font-bold border-blue-200 text-blue-700 bg-blue-50/50 hover:bg-blue-100 hover:text-blue-800 transition-colors">
          <FileText className="mr-2 h-4 w-4" />
          Ajukan Izin / Sakit
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md border-0 glass-panel">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" /> Formulir Izin / Sakit
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground">Jenis Izin</label>
            <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
              <SelectTrigger className="rounded-xl"><SelectValue placeholder="Pilih Jenis" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="IZIN">Izin</SelectItem>
                <SelectItem value="SAKIT">Sakit</SelectItem>
                <SelectItem value="TUGAS_LUAR">Tugas Luar</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground">Dari Tanggal</label>
              <Input type="date" required value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} className="rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground">Sampai Tanggal</label>
              <Input type="date" required value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} className="rounded-xl" />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground">Keterangan / Alasan</label>
            <Textarea required placeholder="Tuliskan alasan lengkap Anda..." value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} className="rounded-xl resize-none h-24" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground">Surat/Dokumen Lampiran (Opsional)</label>
            <Input type="file" accept="image/*,.pdf" onChange={e => { if (e.target.files?.[0]) setPermitFile(e.target.files[0]) }} className="rounded-xl h-auto py-2 text-sm" />
            <p className="text-[10px] text-muted-foreground">Upload surat dokter, surat tugas luar, atau dokumen pendukung lainnya (Maks 2MB, PDF/Gambar).</p>
          </div>
          <Button type="submit" disabled={submitting} className="w-full rounded-xl font-bold h-11 bg-blue-600 hover:bg-blue-700 mt-2">
            {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
            Kirim Pengajuan
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
