"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/hooks/use-toast"
import { Loader2, Phone } from "lucide-react"
import { updateProfile, checkUserProfile } from "../affiliate/settings/actions"

export function WaRequirementPopup() {
  const [open, setOpen] = useState(false)
  const [phone, setPhone] = useState("")
  const [userData, setUserData] = useState<{name: string, email: string} | null>(null)
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function check() {
      const data = await checkUserProfile()
      if (data) {
        setUserData({ name: data.name, email: data.email })
        if (!data.phone || data.phone.replace(/[^0-9]/g, "").length < 10) {
          setOpen(true)
        }
      }
      setChecking(false)
    }
    check()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userData) return
    setLoading(true)

    try {
      const res = await updateProfile({ name: userData.name, email: userData.email, phone })
      if (res.error) {
        toast({ title: "Gagal", description: res.error, variant: "destructive" })
      } else {
        toast({ title: "Berhasil", description: "Nomor WhatsApp berhasil disimpan." })
        setOpen(false)
        router.refresh()
      }
    } catch (error) {
      toast({ title: "Gagal", description: "Terjadi kesalahan sistem", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  if (checking) return null

  // Use Dialog with no close buttons (user can't escape without entering phone)
  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md glass border-0" onPointerDownOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
        <DialogHeader>
          <div className="mx-auto w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center mb-4">
            <Phone className="h-6 w-6 text-emerald-600" />
          </div>
          <DialogTitle className="text-center text-xl">Lengkapi Nomor WhatsApp</DialogTitle>
          <DialogDescription className="text-center text-sm mt-2">
            Sebelum memulai, Anda wajib memasukkan nomor WhatsApp aktif untuk keperluan notifikasi komisi dan pencairan dana.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="wa">Nomor WhatsApp Aktif</Label>
            <Input 
              id="wa"
              required 
              autoFocus
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ""))}
              placeholder="Contoh: 081234567890"
              className="rounded-xl h-12 text-lg text-center tracking-widest"
            />
          </div>

          <Button type="submit" disabled={loading || phone.length < 10} className="w-full btn-gradient text-white rounded-xl h-12 text-md flex items-center justify-center">
            {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : "Simpan Nomor WA"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
