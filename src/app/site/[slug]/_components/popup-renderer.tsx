"use client"

import { useEffect, useState } from "react"
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, 
  DialogDescription, DialogFooter 
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { X, ExternalLink } from "lucide-react"
import { OptimizedImage } from "@/components/ui/optimized-image"

interface PopupProps {
  popup: {
    id: string
    title: string
    content?: string | null
    imageUrl?: string | null
    videoUrl?: string | null
    buttonText?: string | null
    buttonLink?: string | null
    displayOnce: boolean
  }
}

export function PopupRenderer({ popup }: PopupProps) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const hasSeen = localStorage.getItem(`popup_seen_${popup.id}`)
    if (popup.displayOnce && hasSeen) return

    // Tampilkan setelah 2 detik agar tidak terlalu mengganggu
    const timer = setTimeout(() => {
      setOpen(true)
    }, 2000)

    return () => clearTimeout(timer)
  }, [popup.id, popup.displayOnce])

  const handleClose = () => {
    if (popup.displayOnce) {
      localStorage.setItem(`popup_seen_${popup.id}`, "true")
    }
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-0 bg-transparent shadow-none shadow-black/20 max-w-full">
        <div className="bg-background rounded-3xl overflow-hidden border shadow-2xl relative">
          <button 
            type="button"
            onClick={handleClose}
            aria-label="Tutup popup"
            className="absolute top-4 right-4 z-20 h-8 w-8 rounded-full bg-black/20 text-white backdrop-blur-md flex items-center justify-center hover:bg-black/40 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>

          {popup.imageUrl && (
            <div className="relative aspect-video w-full">
              <OptimizedImage src={popup.imageUrl} alt={popup.title} fill className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            </div>
          )}

          <div className="p-8">
            <h3 className="text-2xl font-bold tracking-tight mb-3">{popup.title}</h3>
            {popup.content && (
              <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                {popup.content}
              </p>
            )}

            {(popup.buttonText && popup.buttonLink) && (
              <Button asChild className="w-full btn-gradient text-white rounded-xl h-12 font-bold shadow-lg shadow-primary/20 flex items-center justify-center">
                <a href={popup.buttonLink} target="_blank" rel="noopener">
                   {popup.buttonText} <ExternalLink className="ml-2 h-4 w-4" />
                </a>
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
