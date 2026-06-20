import React, { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AlertTriangle, Trash2 } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { toast } from "@/hooks/use-toast"
import { signOut } from "next-auth/react"

interface DangerZoneSettingsProps {
  tenantId: string | null
}

export function DangerZoneSettings({ tenantId }: DangerZoneSettingsProps) {
  const [open, setOpen] = useState(false)
  const [confirmText, setConfirmText] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (confirmText !== "HAPUS") {
      toast({ title: "Konfirmasi gagal", description: "Ketik HAPUS untuk melanjutkan", variant: "destructive" })
      return
    }

    if (!tenantId) return

    setIsDeleting(true)
    try {
      const res = await fetch("/api/tenant/delete-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId })
      })

      if (res.ok) {
        toast({ title: "Berhasil", description: "Website Anda telah dihapus secara permanen." })
        // Redirect back to dashboard or home, don't sign out since account remains
        window.location.href = "/dashboard"
      } else {
        const data = await res.json().catch(() => ({}))
        toast({ title: "Gagal", description: data.error || "Gagal menghapus website", variant: "destructive" })
        setIsDeleting(false)
      }
    } catch (error) {
      toast({ title: "Terjadi Kesalahan", description: "Koneksi terputus.", variant: "destructive" })
      setIsDeleting(false)
    }
  }

  return (
    <Card className="border border-red-200 bg-red-50/50 dark:bg-red-950/10 dark:border-red-900/50">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
            <AlertTriangle className="h-4 w-4" />
          </div>
          <div>
            <CardTitle className="text-lg text-red-700 dark:text-red-400">Zona Bahaya</CardTitle>
            <CardDescription className="text-red-600/80 dark:text-red-400/80">Tindakan ini bersifat permanen dan merusak</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-red-700/80 dark:text-red-300 mb-4">
          Penghapusan website akan melenyapkan <strong>seluruh data sekolah</strong> (berita, galeri, fasilitas, guru, tagihan, dll) secara permanen. Akun Anda akan tetap ada, namun website ini tidak dapat dikembalikan.
        </p>

        <Dialog open={open} onOpenChange={(val) => {
          setOpen(val)
          if (!val) setConfirmText("")
        }}>
          <DialogTrigger asChild>
            <Button variant="destructive" className="w-full sm:w-auto flex items-center gap-2 rounded-xl">
              <Trash2 className="h-4 w-4" />
              Hapus Website
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md border-red-200 dark:border-red-900">
            <DialogHeader>
              <DialogTitle className="text-red-600 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Hapus Permanen?
              </DialogTitle>
              <DialogDescription>
                Tindakan ini <strong>tidak dapat dibatalkan</strong>. Ini akan secara permanen menghapus data lembaga dari peladen kami.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-4">
              <p className="text-sm">Ketik <strong>HAPUS</strong> untuk mengonfirmasi.</p>
              <Input 
                value={confirmText} 
                onChange={e => setConfirmText(e.target.value)} 
                placeholder="HAPUS"
                className="rounded-xl border-red-200 focus-visible:ring-red-500"
              />
            </div>
            <DialogFooter className="sm:justify-start flex-row-reverse sm:flex-row gap-2">
              <Button 
                variant="destructive" 
                onClick={handleDelete} 
                disabled={confirmText !== "HAPUS" || isDeleting}
                className="rounded-xl"
              >
                {isDeleting ? "Menghapus..." : "Ya, Hapus Semua"}
              </Button>
              <Button type="button" variant="outline" onClick={() => setOpen(false)} className="rounded-xl" disabled={isDeleting}>
                Batal
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
