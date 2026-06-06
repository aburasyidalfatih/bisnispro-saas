"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/hooks/use-toast"
import { Loader2, Save } from "lucide-react"
import { updateProfile } from "../actions"

export function ProfileForm({ initialData }: { initialData: { name: string, email: string, phone: string } }) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState(initialData)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const res = await updateProfile(form)
      if (res.error) {
        toast({ title: "Gagal", description: res.error, variant: "destructive" })
      } else {
        toast({ title: "Berhasil", description: "Profil berhasil diperbarui." })
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
        <Label>Nama Lengkap</Label>
        <Input 
          required 
          value={form.name}
          onChange={(e) => setForm({...form, name: e.target.value})}
          placeholder="Nama Lengkap"
          className="rounded-xl"
        />
      </div>
      
      <div className="space-y-2">
        <Label>Nomor WhatsApp</Label>
        <Input 
          required 
          value={form.phone}
          onChange={(e) => setForm({...form, phone: e.target.value.replace(/[^0-9]/g, "")})}
          placeholder="Mulai dengan 08..."
          className="rounded-xl"
        />
      </div>

      <div className="space-y-2">
        <Label>Email (Wajib @gmail.com)</Label>
        <Input 
          required 
          type="email"
          value={form.email}
          onChange={(e) => setForm({...form, email: e.target.value})}
          placeholder="akun@gmail.com"
          className="rounded-xl"
        />
        <p className="text-xs text-muted-foreground mt-1">Demi keamanan login, Anda hanya diizinkan menggunakan email @gmail.com.</p>
      </div>

      <Button type="submit" disabled={loading} className="w-full sm:w-auto btn-gradient text-white rounded-xl flex items-center justify-center h-10 px-4">
        {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
        Simpan Profil
      </Button>
    </form>
  )
}
