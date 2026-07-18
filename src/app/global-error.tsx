"use client"

import { useEffect } from "react"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Optionally log the error to an error reporting service
    console.error("Global Error Caught:", error)
  }, [error])

  return (
    <html lang="id">
      <body style={{ margin: 0, padding: 0, fontFamily: "system-ui, -apple-system, sans-serif", backgroundColor: "#f8fafc" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: "2rem", textAlign: "center" }}>
          <div style={{ background: "white", padding: "3rem", borderRadius: "1rem", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)", maxWidth: "500px", width: "100%" }}>
            <div style={{ width: "64px", height: "64px", background: "#fee2e2", color: "#ef4444", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem" }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            </div>
            <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#0f172a", marginBottom: "1rem" }}>
              Sistem Sedang Gangguan
            </h2>
            <p style={{ color: "#64748b", marginBottom: "2rem", lineHeight: 1.6 }}>
              Mohon maaf, terjadi kesalahan fatal pada sistem kami saat mencoba memuat halaman (kemungkinan gangguan koneksi). Silakan muat ulang halaman ini.
            </p>
            <button
              onClick={() => reset()}
              style={{ background: "#0f172a", color: "white", border: "none", padding: "0.75rem 1.5rem", borderRadius: "0.5rem", fontWeight: "600", cursor: "pointer", transition: "background 0.2s" }}
            >
              Muat Ulang Halaman
            </button>
            {process.env.NODE_ENV === "development" && (
              <div style={{ marginTop: "2rem", textAlign: "left", background: "#f1f5f9", padding: "1rem", borderRadius: "0.5rem", overflowX: "auto" }}>
                <p style={{ fontWeight: "bold", color: "#ef4444", margin: "0 0 0.5rem 0", fontSize: "0.875rem" }}>[DEV ONLY] Detail Error:</p>
                <pre style={{ fontSize: "0.75rem", margin: 0, color: "#334155", whiteSpace: "pre-wrap" }}>
                  {error.message || "Unknown Error"}
                </pre>
              </div>
            )}
          </div>
        </div>
      </body>
    </html>
  )
}
