"use client"

import { useEffect } from "react"
import { hexToTailwindHsl } from "@/lib/color-utils"

export function ThemeInjector({ theme, settings }: { theme: string; settings?: any }) {
  const primaryHsl = settings?.primaryColor ? hexToTailwindHsl(settings.primaryColor) : null
  const secondaryHsl = settings?.secondaryColor ? hexToTailwindHsl(settings.secondaryColor) : null
  const fontFamily = settings?.fontFamily || null

  // Script ini dieksekusi oleh browser saat parsing HTML (sebelum React hydrate),
  // sehingga tidak ada delay warna dan menghindari efek "FOUC".
  const injectScript = `
    try {
      var root = document.documentElement;
      root.setAttribute("data-theme", "${theme}");
      ${fontFamily ? `root.setAttribute("data-font", "${fontFamily}");` : ''}
    } catch(e) {}
  `;

  useEffect(() => {
    const root = document.documentElement
    
    // Set base theme
    root.setAttribute("data-theme", theme)
    
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
    }
  }, [theme, settings, primaryHsl, secondaryHsl, fontFamily])

  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: injectScript }} />
      <style dangerouslySetInnerHTML={{
        __html: `
          :root {
            ${primaryHsl ? `--primary: ${primaryHsl};` : ''}
            ${secondaryHsl ? `--secondary: ${secondaryHsl};\n            --accent: ${secondaryHsl};` : ''}
          }
        `
      }} />
    </>
  )
}
