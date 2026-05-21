"use client"

import { useEffect, useState } from "react"
import { Eye } from "lucide-react"
import { trackPostView } from "@/features/post/actions/views.action"

export function PostViewCounter({ postId, initialViews = 0 }: { postId: string, initialViews?: number }) {
  const [views, setViews] = useState(initialViews)

  useEffect(() => {
    let mounted = true

    const track = async () => {
      // Small delay to ensure it's a real user reading, not a quick bounce or bot
      setTimeout(async () => {
        if (!mounted) return
        
        // Prevent double counting in dev mode / strict mode by using sessionStorage
        const viewedKey = `viewed_post_${postId}`
        if (sessionStorage.getItem(viewedKey)) return
        
        sessionStorage.setItem(viewedKey, "true")
        
        const res = await trackPostView(postId)
        if (res.success && mounted) {
          setViews(v => v + 1)
        }
      }, 2000)
    }

    track()

    return () => {
      mounted = false
    }
  }, [postId])

  return (
    <div className="flex items-center gap-1.5 text-sm text-muted-foreground font-medium" title="Jumlah tayangan">
      <Eye className="h-4 w-4" />
      {views > 0 ? `${views} kali` : "Baru saja"}
    </div>
  )
}
