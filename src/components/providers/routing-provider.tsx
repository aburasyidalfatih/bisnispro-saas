"use client"

import { createContext, useContext, ReactNode } from "react"

interface RoutingContextProps {
  isSubdomain: boolean
  isCustomDomain: boolean
  hostname: string
  rootDomain: string
  basePath: string // e.g. "/site/slug" or ""
}

const RoutingContext = createContext<RoutingContextProps | null>(null)

export function RoutingProvider({ 
  children, 
  value 
}: { 
  children: ReactNode, 
  value: RoutingContextProps 
}) {
  return (
    <RoutingContext.Provider value={value}>
      {children}
    </RoutingContext.Provider>
  )
}

export function useRouting() {
  const context = useContext(RoutingContext)
  if (!context) {
    // Fallback default jika di luar provider (misal saat build atau dev mode tertentu)
    return {
      isSubdomain: false,
      isCustomDomain: false,
      hostname: "",
      rootDomain: "",
      basePath: "",
      resolveHref: (href: string) => href
    }
  }

  /**
   * Mengubah href mentah menjadi href yang sesuai dengan konteks domain.
   * Contoh: "/contact" -> "/site/pijm/contact" (jika di main domain)
   * Contoh: "/contact" -> "/contact" (jika di subdomain pijm.bisnispro.id)
   */
  const resolveHref = (href: string) => {
    // Jika href eksternal, biarkan saja
    if (href.startsWith("http") || href.startsWith("mailto:") || href.startsWith("tel:")) {
      return href
    }

    // Pastikan href diawali /
    const normalizedHref = href.startsWith("/") ? href : `/${href}`

    // Jika di subdomain atau custom domain, prefix /site/[slug] sudah di-strip oleh middleware
    if (context.isSubdomain || context.isCustomDomain) {
      // Jika user tidak sengaja memasukkan link dengan prefix /site/[slug], bersihkan
      if (context.basePath && normalizedHref.startsWith(context.basePath)) {
        return normalizedHref.replace(context.basePath, "") || "/"
      }
      return normalizedHref === "" ? "/" : normalizedHref
    }

    // Jika di main domain, pastikan ada prefix basePath
    if (context.basePath && !normalizedHref.startsWith(context.basePath)) {
      // Hindari double slash
      const base = context.basePath.endsWith("/") ? context.basePath.slice(0, -1) : context.basePath
      return `${base}${normalizedHref}`
    }

    return normalizedHref
  }

  return { ...context, resolveHref }
}
