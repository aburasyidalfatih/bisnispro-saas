"use client"

/**
 * TenantBrandingProvider
 *
 * Menyimpan nama dan logo tenant di React Context sehingga bisa
 * di-update secara instan tanpa menunggu JWT refresh.
 *
 * Sidebar dan komponen lain membaca dari context ini, bukan dari session.
 * Settings page memanggil updateBranding() setelah simpan.
 */

import { createContext, useContext, useEffect, useState } from "react"
import { useSession } from "next-auth/react"

interface TenantBranding {
  id: string | null
  name: string
  slug?: string
  logo: string | null
}

interface TenantBrandingContextValue {
  branding: TenantBranding
  updateBranding: (data: Partial<TenantBranding>) => void
  isLoadingTenant: boolean
}

const TenantBrandingContext = createContext<TenantBrandingContextValue>({
  branding: { id: null, name: "SchoolPro", slug: "", logo: null },
  updateBranding: () => {},
  isLoadingTenant: true,
})

export function TenantBrandingProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()

  const [branding, setBranding] = useState<TenantBranding>({
    id: null,
    name: "SchoolPro",
    slug: "",
    logo: null,
  })
  
  const [isLoadingTenant, setIsLoadingTenant] = useState(true)

  useEffect(() => {
    if (status === "loading") return
    
    const resolveTenant = async () => {
      // Cek apakah ada cookie impersonate
      const match = typeof document !== "undefined" ? document.cookie.match(/impersonate-tenant=([^;]+)/) : null
      const impSlug = match?.[1]

      if (impSlug) {
        try {
          const res = await fetch(`/api/tenant/by-slug?slug=${impSlug}`)
          const data = await res.json()
          if (data && data.id) {
            setBranding({
              id: data.id,
              name: data.name || "SchoolPro",
              slug: data.slug || impSlug,
              logo: data.logo || null,
            })
          }
        } catch (e) {
          console.error("Gagal resolve impersonate tenant", e)
        }
      } else {
        const tenant = session?.user?.tenants?.[0]
        if (tenant) {
          setBranding({
            id: tenant.id,
            name: tenant.name || "SchoolPro",
            slug: (tenant as any).slug || "",
            logo: (tenant as any).logo || null,
          })
        }
      }
      setIsLoadingTenant(false)
    }

    resolveTenant()
  }, [session?.user?.tenants, status])

  const updateBranding = (data: Partial<TenantBranding>) => {
    setBranding((prev) => ({ ...prev, ...data }))
  }

  // Update favicon dynamically
  useEffect(() => {
    if (branding.logo) {
      let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']")
      if (!link) {
        link = document.createElement("link")
        link.rel = "icon"
        document.head.appendChild(link)
      }
      link.href = branding.logo
    }
  }, [branding.logo])

  return (
    <TenantBrandingContext.Provider value={{ branding, updateBranding, isLoadingTenant }}>
      {children}
    </TenantBrandingContext.Provider>
  )
}

export function useTenantBranding() {
  return useContext(TenantBrandingContext)
}
