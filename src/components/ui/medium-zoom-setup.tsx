"use client"

import { useEffect, useRef } from "react"
import mediumZoom, { Zoom } from "medium-zoom"
import { usePathname } from "next/navigation"

export function MediumZoomSetup() {
  const pathname = usePathname()
  const zoomRef = useRef<Zoom | null>(null)

  useEffect(() => {
    if (!zoomRef.current) {
      zoomRef.current = mediumZoom({
        margin: 24,
        background: 'rgba(0, 0, 0, 0.85)',
      })
    }

    const attachZoom = () => {
      if (zoomRef.current) {
        zoomRef.current.detach()
        zoomRef.current.attach('article img, .prose img, .zoomable')
      }
    }

    attachZoom()
    const timeoutId = setTimeout(attachZoom, 500) // Delay to ensure images in rich text are mounted

    return () => clearTimeout(timeoutId)
  }, [pathname])

  return null
}
