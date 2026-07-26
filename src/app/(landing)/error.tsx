"use client"

import { useEffect } from "react"
import { AlertTriangle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function LandingError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Landing error:", error)
  }, [error])

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center p-8">
      <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10 mb-6">
        <AlertTriangle className="h-10 w-10 text-destructive" />
      </div>
      <h2 className="text-2xl font-bold mb-2">Terjadi Kesalahan</h2>
      <p className="text-muted-foreground mb-6 max-w-md">
        Maaf, terjadi kesalahan yang tidak terduga. Silakan coba lagi.
      </p>
      <Button onClick={reset} variant="outline">
        <RefreshCw className="mr-2 h-4 w-4" /> Coba Lagi
      </Button>
    </div>
  )
}
