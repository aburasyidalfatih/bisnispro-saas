"use client"

import { useEffect } from "react"
import { hexToTailwindHsl } from "@/lib/color-utils"

export function ThemeInjector({ theme, settings }: { theme: string; settings?: any }) {
  const primaryHsl = settings?.primaryColor ? hexToTailwindHsl(settings.primaryColor) : null
  const secondaryHsl = settings?.secondaryColor ? hexToTailwindHsl(settings.secondaryColor) : null
  const fontFamily = settings?.fontFamily || null
  const industryPreset = settings?.industryPreset || "corporate"
  const publicLocale = settings?.exportProfile?.enabled && settings?.exportProfile?.primaryLocale === "en" ? "en" : "id"

  useEffect(() => {
    const root = document.documentElement
    
    // Set base theme
    root.setAttribute("data-theme", theme)
    root.setAttribute("data-industry", industryPreset)
    root.setAttribute("lang", publicLocale)
    
    // Inject custom colors if provided
    if (primaryHsl) {
      root.style.setProperty("--primary", primaryHsl)
    } else {
      root.style.removeProperty("--primary")
    }

    if (secondaryHsl) {
      root.style.setProperty("--secondary", secondaryHsl)
      root.style.setProperty("--accent", secondaryHsl)
    } else {
      root.style.removeProperty("--secondary")
      root.style.removeProperty("--accent")
    }

    if (fontFamily) {
      root.setAttribute("data-font", fontFamily)
    }

    return () => {
      // Reset ke cookie theme saat leave website
      const match = document.cookie.match(/color-theme=([^;]+)/)
      if (match) {
        root.setAttribute("data-theme", match[1])
      } else {
        root.removeAttribute("data-theme")
      }
      root.style.removeProperty("--primary")
      root.style.removeProperty("--secondary")
      root.style.removeProperty("--accent")
      root.removeAttribute("data-font")
      root.removeAttribute("data-industry")
      root.removeAttribute("lang")
    }
  }, [theme, settings, primaryHsl, secondaryHsl, fontFamily, industryPreset, publicLocale])

  return (
    <style dangerouslySetInnerHTML={{
      __html: `
        :root {
          ${primaryHsl ? `--primary: ${primaryHsl};` : ''}
          ${secondaryHsl ? `--secondary: ${secondaryHsl};\n          --accent: ${secondaryHsl};` : ''}
        }
      `
    }} />
  )
}

export function ThemeInitScript({ theme, settings }: { theme: string; settings?: any }) {
  const fontFamily = settings?.fontFamily || null
  const industryPreset = settings?.industryPreset || "corporate"
  const publicLocale = settings?.exportProfile?.enabled && settings?.exportProfile?.primaryLocale === "en" ? "en" : "id"

  const injectScript = `
    try {
      var root = document.documentElement;
      root.setAttribute("data-theme", "${theme}");
      root.setAttribute("data-industry", "${industryPreset}");
      root.setAttribute("lang", "${publicLocale}");
      ${fontFamily ? `root.setAttribute("data-font", "${fontFamily}");` : ''}
    } catch(e) {}
  `;

  return (
    <script dangerouslySetInnerHTML={{ __html: injectScript }} suppressHydrationWarning />
  )
}
