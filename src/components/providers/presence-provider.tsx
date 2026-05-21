"use client"

import { useEffect } from "react"

export function PresenceProvider() {
  useEffect(() => {
    let mounted = true
    let interval: NodeJS.Timeout

    const ping = async () => {
      if (!mounted) return
      try {
        await fetch("/api/user/presence", { method: "POST" })
      } catch (error) {
        // Silently fail if network is down
      }
    }

    // Ping immediately on mount
    ping()

    // Ping every 2 minutes (120000 ms)
    interval = setInterval(ping, 120 * 1000)

    return () => {
      mounted = false
      clearInterval(interval)
    }
  }, [])

  return null
}
