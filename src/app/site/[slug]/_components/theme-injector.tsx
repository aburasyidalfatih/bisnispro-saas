"use client"

import { useEffect } from "react"
import { hexToTailwindHsl } from "@/lib/color-utils"

export function ThemeInjector({ theme, settings }: { theme: string; settings?: any }) {
  useEffect(() => {
    const root = document.documentElement
    
    // Set base theme
    root.setAttribute("data-theme", theme)
    
    // Inject custom colors if provided
    if (settings?.primaryColor) {
      try {
        root.style.setProperty("--primary", hexToTailwindHsl(settings.primaryColor))
      } catch (e) {
        console.error("Invalid primary color", e)
      }
    } else {
      root.style.removeProperty("--primary")
    }

    if (settings?.secondaryColor) {
      try {
        root.style.setProperty("--secondary", hexToTailwindHsl(settings.secondaryColor))
        root.style.setProperty("--accent", hexToTailwindHsl(settings.secondaryColor))
      } catch (e) {
        console.error("Invalid secondary color", e)
      }
    } else {
      root.style.removeProperty("--secondary")
      root.style.removeProperty("--accent")
    }

    // Set font family classes
    const fontClassMap: Record<string, string> = {
      "inter": "font-sans",
      "plus-jakarta": "font-sans", 
      "playfair": "font-serif",
      "outfit": "font-sans tracking-tight"
    }

    // Default cleanup old font classes (if any, though Next.js handles body classes in layout usually)
    // To make this work best, we should return a style tag or just inject class to body
    if (settings?.fontFamily) {
      root.setAttribute("data-font", settings.fontFamily)
    }

    return () => {
      // Reset ke cookie theme saat leave website
      const match = document.cookie.match(/color-theme=([^;]+)/)
      if (match) {
        root.setAttribute("data-theme", match[1])
      }
      root.style.removeProperty("--primary")
      root.style.removeProperty("--secondary")
      root.style.removeProperty("--accent")
      root.removeAttribute("data-font")
    }
  }, [theme, settings])

  // Also inject a <style> tag so there's no layout shift if possible, or font variables
  return null
}
