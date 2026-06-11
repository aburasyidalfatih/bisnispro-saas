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
  const [toggling, setToggling] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const getDownloadFilename = (disposition: string | null) => {
    if (!disposition) return `theme-${themeId}.zip`

    const encodedMatch = disposition.match(/filename\*=UTF-8''([^;]+)/i)
    if (encodedMatch?.[1]) return decodeURIComponent(encodedMatch[1])

    const quotedMatch = disposition.match(/filename="([^"]+)"/i)
    if (quotedMatch?.[1]) return quotedMatch[1]

    return `theme-${themeId}.zip`
  }

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const response = await fetch(`/api/super-admin/themes/export?theme=${encodeURIComponent(themeId)}`)
      if (!response.ok) {
        const result = await response.json().catch(() => null)
        throw new Error(result?.error || "Gagal mengekspor tema")
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = getDownloadFilename(response.headers.get("Content-Disposition"))
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
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
        headers: { "Content-Type": "application/json" },
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
              disabled={toggling || tenantsCount > 0}
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
