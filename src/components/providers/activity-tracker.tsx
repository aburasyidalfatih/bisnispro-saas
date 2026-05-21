"use client"

import { useEffect } from "react"

/**
 * Pings the server once per dashboard session to track tenant activity (login/usage).
 * Does not block rendering and fails silently if errors occur.
 */
export function ActivityTracker() {
  useEffect(() => {
    // Fire and forget
    fetch("/api/tenant/ping", { method: "POST" }).catch(() => {})
  }, [])

  return null
}
