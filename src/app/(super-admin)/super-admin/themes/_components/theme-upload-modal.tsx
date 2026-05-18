"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Loader2, UploadCloud, FileArchive } from "lucide-react"

interface ThemeUploadModalProps {
  trigger?: React.ReactNode
}

export function ThemeUploadModal({ trigger }: ThemeUploadModalProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const { toast } = useToast()
  const router = useRouter()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0])
    }
  }

  const handleUpload = async () => {
    if (!file) {
      toast({ title: "Pilih file", description: "Silakan pilih file .zip tema terlebih dahulu.", variant: "destructive" })
      return
    }

    if (!file.name.endsWith('.zip')) {
      toast({ title: "Format Tidak Valid", description: "File harus berekstensi .zip", variant: "destructive" })
      return
    }

    try {
      setLoading(true)
      const formData = new FormData()
      formData.append("file", file)

      const res = await fetch("/api/super-admin/themes/upload", {
        method: "POST",
        body: formData,
      })

      const result = await res.json()

      if (!res.ok) throw new Error(result.error || "Gagal mengupload tema")

      toast({
        title: "Tema Berhasil Diupload!",
        description: `Tema ${result.theme.name} siap digunakan oleh sekolah.`,
      })
      
      setOpen(false)
      setFile(null)
      router.refresh()
    } catch (error: any) {
      toast({
        title: "Upload Gagal",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <UploadCloud className="mr-2 h-4 w-4" /> Upload Tema
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Tema Baru</DialogTitle>
          <DialogDescription>
            Upload file tema berekstensi .zip yang berisi struktur template Handlebars.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg bg-muted/50 transition-colors hover:bg-muted">
            <FileArchive className="h-10 w-10 text-muted-foreground mb-4" />
            <div className="text-center">
              <Label htmlFor="theme-upload" className="cursor-pointer">
                <span className="text-primary hover:underline font-semibold">Klik untuk memilih file</span>
                {" "}atau drag & drop
              </Label>
              <Input 
                id="theme-upload" 
                type="file" 
                accept=".zip" 
                className="hidden" 
                onChange={handleFileChange}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">Maksimal ukuran file: 10MB</p>
          </div>
          
          {file && (
            <div className="flex items-center gap-3 p-3 bg-primary/5 border rounded-md">
              <FileArchive className="h-5 w-5 text-primary" />
              <div className="flex-1 truncate">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setFile(null)}>Batal</Button>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>Batal</Button>
          <Button onClick={handleUpload} disabled={!file || loading}>
            {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Memproses...</> : "Upload & Ekstrak"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
