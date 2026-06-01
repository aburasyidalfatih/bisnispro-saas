"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { toast } from "@/hooks/use-toast"
import { ImageIcon, X, Loader2, UploadCloud } from "lucide-react"
import Image from "next/image"
import { normalizeImageUrl } from "@/lib/utils"

interface ImageUploadDirectProps {
  value: string
  onChange: (url: string) => void
  tenantId: string
  subDir?: string
  hint?: string
}

export function ImageUploadDirect({ value, onChange, tenantId, subDir = "posts", hint }: ImageUploadDirectProps) {
  const [uploading, setUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(value || null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const normalized = normalizeImageUrl(value) || null
    if (normalized !== previewUrl && !uploading) {
      setPreviewUrl(normalized)
    }
  }, [value, previewUrl, uploading])

  const compressImage = async (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const img = document.createElement("img")
      img.src = URL.createObjectURL(file)
      img.onload = () => {
        const canvas = document.createElement("canvas")
        const MAX_SIZE = 1920
        let { width, height } = img
        
        // Proporsional resize berdasarkan sisi terpanjang
        if (width > height) {
          if (width > MAX_SIZE) {
            height = Math.round(height * (MAX_SIZE / width))
            width = MAX_SIZE
          }
        } else {
          if (height > MAX_SIZE) {
            width = Math.round(width * (MAX_SIZE / height))
            height = MAX_SIZE
          }
        }
        
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext("2d")
        if (!ctx) return resolve(file)
        ctx.drawImage(img, 0, 0, width, height)
        
        canvas.toBlob(
          (blob) => {
            if (!blob) return resolve(file)
            const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".webp", {
              type: "image/webp",
              lastModified: Date.now(),
            })
            resolve(compressedFile)
          },
          "image/webp",
          0.8
        )
      }
      img.onerror = () => resolve(file)
    })
  }

  const handleUpload = async (file: File) => {
    // Batas file asli sebelum dikompresi: 10 MB (mempermudah upload foto HP)
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "File terlalu besar", description: "Ukuran file asli tidak boleh lebih dari 10 MB", variant: "destructive" })
      return
    }

    try {
      setUploading(true)
      
      // Temporary preview
      const tempUrl = URL.createObjectURL(file)
      setPreviewUrl(tempUrl)
      
      const compressedFile = await compressImage(file)
      
      // Batas setelah dikompresi wajib di bawah 2 MB untuk keamanan server
      if (compressedFile.size > 2 * 1024 * 1024) {
        setUploading(false)
        setPreviewUrl(value || null)
        toast({ title: "Gagal Kompresi", description: "Setelah dikompresi, file masih lebih dari 2 MB. Gunakan gambar lain.", variant: "destructive" })
        return
      }
      
      const fd = new FormData()
      fd.append("file", compressedFile)
      fd.append("tenantId", tenantId)
      fd.append("subDir", subDir)
      
      const uploadRes = await fetch("/api/upload", { method: "POST", body: fd })
      const uploadData = await uploadRes.json()
      
      if (!uploadRes.ok || !uploadData.url) {
        throw new Error(uploadData.error || "Gagal mengunggah gambar")
      }
      
      onChange(uploadData.url)
      setPreviewUrl(uploadData.url)

      // Show storage warning if quota is getting low
      if (uploadData.storageWarning) {
        toast({
          title: uploadData.storageWarning.usagePercent >= 95 ? "⚠️ Penyimpanan Hampir Penuh!" : "📦 Penyimpanan Menipis",
          description: uploadData.storageWarning.message,
          variant: uploadData.storageWarning.usagePercent >= 95 ? "destructive" : "default",
        })
      }
    } catch (error: any) {
      toast({ title: "Gagal", description: error.message, variant: "destructive" })
      setPreviewUrl(value || null) // Revert
    } finally {
      setUploading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleUpload(e.target.files[0])
    }
  }

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange("")
    setPreviewUrl(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <div className="relative group">
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        className="hidden" 
        accept="image/*" 
        disabled={uploading}
      />
      
      <div 
        onClick={() => !uploading && fileInputRef.current?.click()}
        className={`cursor-pointer flex flex-col items-center justify-center border-2 border-dashed rounded-xl transition-all overflow-hidden relative ${
          previewUrl 
            ? 'aspect-video border-transparent bg-transparent' 
            : 'aspect-video border-border hover:border-primary/50 hover:bg-primary/5 p-4'
        }`}
      >
        {previewUrl ? (
          <>
            <Image src={previewUrl} alt="Preview" fill className="object-cover rounded-lg" 
              onError={(e) => {
                e.currentTarget.style.display = 'none'
                setPreviewUrl(null)
              }}
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
              <p className="text-white text-sm font-medium flex items-center gap-2">
                <UploadCloud className="h-4 w-4" /> Ganti Gambar
              </p>
            </div>
            {uploading && (
              <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center rounded-lg z-10">
                <Loader2 className="h-8 w-8 text-white animate-spin mb-2" />
                <p className="text-white text-xs font-medium">Mengunggah...</p>
              </div>
            )}
            {!uploading && (
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-20"
                onClick={handleRemove}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </>
        ) : (
          <div className="text-center py-8">
            {uploading ? (
              <>
                <Loader2 className="h-10 w-10 mx-auto mb-3 text-primary animate-spin" />
                <p className="text-sm font-medium">Mengoptimalkan & Mengunggah...</p>
              </>
            ) : (
              <>
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <ImageIcon className="h-6 w-6 text-primary" />
                </div>
                <p className="text-sm font-medium">Klik untuk upload gambar</p>
                <p className="text-xs text-muted-foreground mt-1">Format: JPG, PNG, WebP (Maks asli 10MB, Otomatis dikompres)</p>
                {hint && <p className="text-xs text-primary font-semibold mt-2 bg-primary/10 inline-block px-2 py-1 rounded-md">{hint}</p>}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
