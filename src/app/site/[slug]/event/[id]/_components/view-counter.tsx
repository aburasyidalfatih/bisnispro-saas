"use client"

import { useEffect, useState } from "react"
import { Eye } from "lucide-react"
import { trackEventView } from "@/features/post/actions/views.action"

export function EventViewCounter({ eventId, initialViews = 0 }: { eventId: string, initialViews?: number }) {
  const [views, setViews] = useState(initialViews)

  useEffect(() => {
    let mounted = true

    const track = async () => {
      setTimeout(async () => {
        if (!mounted) return
        
        const viewedKey = `viewed_event_${eventId}`
        if (sessionStorage.getItem(viewedKey)) return
        
        sessionStorage.setItem(viewedKey, "true")
        
        const res = await trackEventView(eventId)
        if (res.success && mounted) {
          setViews(v => v + 1)
        }
      }, 2000)
    }

    track()

    return () => {
      mounted = false
    }
  }, [eventId])

  return (
    <div className="flex items-center gap-1.5 text-sm text-muted-foreground font-medium" title="Jumlah tayangan">
      <Eye className="h-4 w-4" />
      {views > 0 ? `${views} kali` : "Baru saja"}
    </div>
  )
}
