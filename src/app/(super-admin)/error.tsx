"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { AlertCircle } from "lucide-react"
import * as Sentry from "@sentry/nextjs"

export default function SuperAdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error)
    Sentry.captureException(error)
  }, [error])

  return (
    <div className="flex h-[80vh] w-full flex-col items-center justify-center gap-4 px-4 text-center">
      <div className="rounded-full bg-destructive/10 p-4">
        <AlertCircle className="h-10 w-10 text-destructive" />
      </div>
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold tracking-tight">Oops, terjadi kesalahan sistem!</h2>
        <p className="text-muted-foreground max-w-[500px]">
          Panel Super Admin mengalami gangguan. Kesalahan ini telah otomatis dicatat untuk diperiksa.
        </p>
      </div>
      <div className="flex gap-4 mt-4">
        <Button onClick={() => reset()} variant="default">
          Coba Muat Ulang
        </Button>
        <Button onClick={() => window.location.href = "/super-admin"} variant="outline">
          Kembali ke Dasbor
        </Button>
      </div>
      {process.env.NODE_ENV === "development" && (
        <pre className="mt-8 max-w-[800px] overflow-auto rounded bg-secondary p-4 text-left text-xs text-secondary-foreground">
          {error.message}
          {"\n"}
          {error.stack}
        </pre>
      )}
    </div>
  )
}
