"use client"

import { useEffect } from "react"
import * as Sentry from "@sentry/nextjs"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])
  return (
    <html lang="id">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif" }}>
        <div style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1rem",
          background: "#fafafa",
        }}>
          <div style={{ textAlign: "center", maxWidth: "400px" }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>⚠️</div>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.5rem" }}>
              Kesalahan Sistem
            </h1>
            <p style={{ color: "#666", marginBottom: "1.5rem" }}>
              Terjadi kesalahan fatal. Tim kami telah diberitahu.
            </p>
            {error.digest && (
              <p style={{ fontSize: "0.75rem", color: "#999", marginBottom: "1rem", fontFamily: "monospace" }}>
                Ref: {error.digest}
              </p>
            )}
            <button
              onClick={reset}
              style={{
                padding: "0.75rem 1.5rem",
                background: "#6c47ff",
                color: "white",
                border: "none",
                borderRadius: "0.75rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Muat Ulang
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
