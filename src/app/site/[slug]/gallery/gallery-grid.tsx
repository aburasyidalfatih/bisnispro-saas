"use client"

import { useState } from "react"
import { X, ChevronLeft, ChevronRight, ImageIcon } from "lucide-react"
import { normalizeImageUrl } from "@/lib/utils"

interface GalleryItem {
  url: string
  caption: string
}

interface Props {
  items: GalleryItem[]
}

export function GalleryGrid({ items }: Props) {
  const [lightbox, setLightbox] = useState<number | null>(null)

  const prev = () => setLightbox(i => (i !== null ? (i - 1 + items.length) % items.length : null))
  const next = () => setLightbox(i => (i !== null ? (i + 1) % items.length : null))

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 bg-white/50 rounded-[3rem] border border-dashed border-border/60">
        <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-6">
          <ImageIcon className="h-10 w-10" />
        </div>
        <h3 className="text-2xl font-bold mb-2">Galeri Belum Tersedia</h3>
        <p className="text-muted-foreground max-w-sm text-center mt-2">Foto dan dokumentasi kegiatan akan segera diperbarui.</p>
      </div>
    )
  }

  return (
    <>
      <div className="columns-2 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 sm:gap-6 space-y-4 sm:space-y-6">
        {items.map((item, i) => (
          <button key={i} onClick={() => setLightbox(i)}
            className="group block relative w-full rounded-2xl overflow-hidden border border-border/50 shadow-sm hover:shadow-2xl focus:outline-none focus:ring-4 focus:ring-primary/20 transition-all duration-500 transform hover:-translate-y-1">
            {/* Aspect ratio is natural in columns, but we add an empty div with random heights if needed, or just let img determine height */}
            <img src={normalizeImageUrl(item.url) || item.url} alt={item.caption || `Foto ${i + 1}`}
              className="w-full h-auto object-cover group-hover:scale-110 transition-transform duration-700" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="absolute inset-x-0 bottom-0 p-6 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
              <p className="text-white text-sm font-bold leading-snug">{item.caption || `Dokumentasi ${i + 1}`}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {lightbox !== null && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}>
          {/* Close */}
          <button onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors">
            <X className="h-5 w-5" />
          </button>

          {/* Prev */}
          {items.length > 1 && (
            <button onClick={e => { e.stopPropagation(); prev() }}
              className="absolute left-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors">
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}

          {/* Image */}
          <div className="max-w-4xl max-h-[80vh] flex flex-col items-center gap-3"
            onClick={e => e.stopPropagation()}>
            <img src={normalizeImageUrl(items[lightbox].url) || items[lightbox].url} alt={items[lightbox].caption || `Foto ${lightbox + 1}`}
              className="max-h-[70vh] max-w-full rounded-xl object-contain" />
            {items[lightbox].caption && (
              <p className="text-white text-sm text-center max-w-lg">{items[lightbox].caption}</p>
            )}
            <p className="text-white/50 text-xs">{lightbox + 1} / {items.length}</p>
          </div>

          {/* Next */}
          {items.length > 1 && (
            <button onClick={e => { e.stopPropagation(); next() }}
              className="absolute right-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors">
              <ChevronRight className="h-5 w-5" />
            </button>
          )}
        </div>
      )}
    </>
  )
}
