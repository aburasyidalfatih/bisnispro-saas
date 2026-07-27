"use client"

import * as React from "react"

type ThemeProviderProps = {
  children: React.ReactNode
  attribute?: "class"
  defaultTheme?: "light" | "dark" | "system"
  enableSystem?: boolean
  disableTransitionOnChange?: boolean
}

/**
 * Minimal, App Router-safe theme bridge.
 *
 * The previous third-party provider was evaluated as a Server Component in
 * Next.js 16 dev mode, taking down every public route with createContext().
 * Tenant colour tokens are managed separately by ColorThemeProvider; this
 * bridge only owns the optional dark class on <html>.
 */
export function ThemeProvider({
  children,
  defaultTheme = "light",
  enableSystem = false,
}: ThemeProviderProps) {
  React.useEffect(() => {
    const storedTheme = window.localStorage.getItem("theme")
    const shouldUseDark = storedTheme === "dark" || (
      !storedTheme && defaultTheme === "system" && enableSystem &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    )
    document.documentElement.classList.toggle("dark", shouldUseDark)
  }, [defaultTheme, enableSystem])

  return <>{children}</>
}
