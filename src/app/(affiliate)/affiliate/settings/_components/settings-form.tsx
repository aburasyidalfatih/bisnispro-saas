"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/hooks/use-toast"
import { Loader2, Save } from "lucide-react"
import { updateBankInfo } from "../actions"

export function SettingsForm({ initialData }: { initialData: { bankName: string, bankAccount: string, accountName: string } }) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState(initialData)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const res = await updateBankInfo(form)
      if (res.error) {
        toast({ title: "Gagal", description: res.error, variant: "destructive" })
      } else {
        toast({ title: "Berhasil", description: "Informasi rekening berhasil disimpan." })
        router.refresh()
      }
    } catch (error) {
      toast({ title: "Gagal", description: "Terjadi kesalahan sistem", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Nama Bank (misal: BCA, Mandiri, BSI)</Label>
        <Input 
          required 
          value={form.bankName}
          onChange={(e) => setForm({...form, bankName: e.target.value})}
          placeholder="Nama Bank"
          className="rounded-xl"
        />
      </div>
      
      <div className="space-y-2">
        <Label>Nomor Rekening</Label>
        <Input 
          required 
          value={form.bankAccount}
          onChange={(e) => setForm({...form, bankAccount: e.target.value.replace(/[^0-9]/g, "")})}
          placeholder="Hanya angka"
          className="rounded-xl"
        />
      </div>

      <div className="space-y-2">
        <Label>Nama Pemilik Rekening</Label>
        <Input 
          required 
          value={form.accountName}
          onChange={(e) => setForm({...form, accountName: e.target.value})}
          placeholder="Sesuai buku tabungan"
          className="rounded-xl"
        />
        <p className="text-xs text-muted-foreground mt-1">Pastikan nama pemilik sesuai agar proses transfer tidak tertunda.</p>
      </div>

      <Button type="submit" disabled={loading} className="w-full sm:w-auto btn-gradient text-white rounded-xl">
        {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
        Simpan Perubahan
      </Button>
    </form>
  )
}
