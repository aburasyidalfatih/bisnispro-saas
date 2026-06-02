"use client"

import { useState } from"react"
import { Button } from"@/components/ui/button"
import { RotateCcw, Loader2 } from"lucide-react"
import { useToast } from"@/hooks/use-toast"
import { useRouter } from"next/navigation"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from"@/components/ui/alert-dialog"

export function ResetMenuButton() {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const handleReset = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/website/menu/reset", { method:"POST" })
      const data = await res.json()

      if (res.ok) {
        toast({
          title:"✅ Menu Berhasil Direset",
          description:"Semua menu telah dikembalikan ke susunan bawaan.",
        })
        router.refresh()
      } else {
        toast({
          title:"Gagal",
          description: data.error ||"Terjadi kesalahan saat mereset menu.",
          variant:"destructive",
        })
      }
    } catch (e) {
      toast({
        title:"Gagal",
        description:"Tidak dapat terhubung ke server.",
        variant:"destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 text-orange-600 border-orange-200 hover:bg-orange-50 hover:text-orange-700 hover:border-orange-300 shrink-0"
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RotateCcw className="h-4 w-4" />
          )}
          Reset ke Default
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Reset Menu ke Default?</AlertDialogTitle>
          <AlertDialogDescription>
            Tindakan ini akan <strong>menghapus semua menu navigasi</strong> yang sudah Anda buat dan menggantinya
            dengan susunan menu bawaan sistem (Beranda, Profil Sekolah, Informasi, Galeri, Kontak beserta sub-menunya).
            <br /><br />
            Perubahan ini tidak dapat dibatalkan.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Batal</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleReset}
            className="bg-orange-600 hover:bg-orange-700"
          >
            Ya, Reset Menu
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
