"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Download, Trash2, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

interface ThemeActionButtonsProps {
  themeId: string
  isSystem: boolean
  isDeletable: boolean
  tenantsCount: number
  isActive?: boolean
}

export function ThemeActionButtons({ themeId, isSystem, isDeletable, tenantsCount, isActive = true }: ThemeActionButtonsProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const handleExport = async () => {
    setIsExporting(true)
    try {
      if (isSystem) {
        // Panggil API untuk men-generate boilerplate ZIP dari tema sistem
        const response = await fetch(`/api/super-admin/themes/export?theme=${themeId}`)
        if (!response.ok) throw new Error("Gagal mengexport tema")
        
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `template-${themeId}.zip`
        document.body.appendChild(a)
        a.click()
        a.remove()
      } else {
        // Implementasi export tema kustom dari DB jika diperlukan di masa depan
        toast({ title: "Fitur belum tersedia", description: "Export tema kustom masih dalam pengembangan." })
      }
    } catch (e: any) {
      toast({ title: "Gagal", description: e.message, variant: "destructive" })
    } finally {
      setIsExporting(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm("Apakah Anda yakin ingin menghapus tema ini?")) return
    
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/super-admin/themes/${themeId}`, {
        method: "DELETE",
        body: JSON.stringify({ isSystem })
      })
      
      if (!response.ok) throw new Error("Gagal menghapus tema")
        
      toast({ title: "Berhasil", description: "Tema berhasil dihapus." })
      router.refresh()
    } catch (e: any) {
      toast({ title: "Gagal", description: e.message, variant: "destructive" })
    } finally {
      setIsDeleting(false)
    }
  }

  const [toggling, setToggling] = useState(false)
  const handleToggle = async (checked: boolean) => {
    setToggling(true)
    try {
      const res = await fetch(`/api/super-admin/themes/${themeId}/toggle`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: checked })
      })
      if (!res.ok) throw new Error("Gagal mengubah status tema")
      toast({ title: "Berhasil", description: `Tema sekarang ${checked ? 'Aktif' : 'Non-aktif'}` })
      router.refresh()
    } catch (e: any) {
      toast({ title: "Gagal", description: e.message, variant: "destructive" })
    } finally {
      setToggling(false)
    }
  }

  return (
    <div className="flex gap-2 w-full justify-between items-center">
      <div className="flex gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          className="text-xs"
          onClick={handleExport}
          disabled={isExporting}
        >
          {isExporting ? <Loader2 className="h-3 w-3 mr-1.5 animate-spin" /> : <Download className="h-3 w-3 mr-1.5" />}
          Export ZIP
        </Button>

        {!isSystem && (
          <Button variant="secondary" size="sm" className="text-xs" asChild>
            <a href={`/theme/${themeId}`} target="_blank" rel="noreferrer">
              Lihat Demo
            </a>
          </Button>
        )}
      </div>

      {!isSystem ? (
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch 
              id={`toggle-${themeId}`} 
              checked={isActive} 
              onCheckedChange={handleToggle}
              disabled={toggling}
            />
            <Label htmlFor={`toggle-${themeId}`} className="text-xs text-muted-foreground cursor-pointer">
              {isActive ? 'Aktif' : 'Draft'}
            </Label>
          </div>
          <Button 
            variant="destructive" 
            size="sm" 
            className="text-xs" 
            disabled={tenantsCount > 0 || isDeleting}
            onClick={handleDelete}
          >
            {isDeleting ? <Loader2 className="h-3 w-3 mr-1.5 animate-spin" /> : <Trash2 className="h-3 w-3 mr-1.5" />}
            Hapus
          </Button>
        </div>
      ) : isDeletable ? (
        <Button 
          variant="destructive" 
          size="sm" 
          className="text-xs" 
          disabled={tenantsCount > 0 || isDeleting}
          onClick={handleDelete}
        >
          {isDeleting ? <Loader2 className="h-3 w-3 mr-1.5 animate-spin" /> : <Trash2 className="h-3 w-3 mr-1.5" />}
          Hapus
        </Button>
      ) : (
        <div className="text-xs text-muted-foreground flex items-center px-2">
          Hanya Baca (Inti)
        </div>
      )}
    </div>
  )
}
