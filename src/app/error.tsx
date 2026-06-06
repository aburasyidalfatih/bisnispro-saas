"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { AlertTriangle, RefreshCw } from "lucide-react"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("App error:", error)
    // Save error to database
    fetch("/api/errors/log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: error.message || "Unknown Error",
        stack: error.stack,
        path: window.location.pathname,
        metadata: { digest: error.digest }
      })
    }).catch(e => console.error("Failed to log error to DB:", e))
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-mesh p-4">
      <div className="text-center max-w-md">
        <div className="flex h-20 w-20 mx-auto items-center justify-center rounded-2xl bg-destructive/10 mb-6">
          <AlertTriangle className="h-10 w-10 text-destructive" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight mb-2">Terjadi Kesalahan</h1>
        <p className="text-muted-foreground mb-6">
          Maaf, terjadi kesalahan yang tidak terduga. Silakan coba lagi.
        </p>
        {error.digest && (
          <p className="text-xs text-muted-foreground mb-4 font-mono">
            Error ID: {error.digest}
          </p>
        )}
        <Button onClick={reset} className="rounded-xl btn-gradient text-white border-0 gap-2 flex items-center justify-center h-10 px-4">
          <RefreshCw className="h-4 w-4" />
          Coba Lagi
        </Button>
      </div>
    </div>
  )
}
