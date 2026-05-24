"use client"

import { useEffect, useRef } from "react"
import { usePathname, useSearchParams } from "next/navigation"

interface PageTrackerProps {
  tenantId: string
}

export function PageTracker({ tenantId }: PageTrackerProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const lastTracked = useRef("")

  useEffect(() => {
    const trackKey = `${pathname}?${searchParams.toString()}`
    
    // Prevent double-tracking on same page
    if (lastTracked.current === trackKey) return
    lastTracked.current = trackKey

    // Get or create session ID
    let sessionId = sessionStorage.getItem("_sp_sid")
    if (!sessionId) {
      sessionId = crypto.randomUUID?.() || Math.random().toString(36).slice(2)
      sessionStorage.setItem("_sp_sid", sessionId)
    }

    // Read UTM params from URL
    const utmSource = searchParams.get("utm_source")
    const utmMedium = searchParams.get("utm_medium")
    const utmCampaign = searchParams.get("utm_campaign")

    // Delay to not block page render
    const timer = setTimeout(() => {
      fetch("/api/public/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId,
          path: pathname,
          referrer: document.referrer || null,
          source: utmSource || null,
          medium: utmMedium || null,
          campaign: utmCampaign || null,
          sessionId,
        }),
        keepalive: true,
      }).catch(() => {
        // Silently fail - don't affect UX
      })
    }, 100)

    return () => clearTimeout(timer)
  }, [pathname, searchParams, tenantId])

  return null
}
