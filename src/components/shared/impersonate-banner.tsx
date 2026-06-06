"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { ShieldAlert, User } from "lucide-react"
import { Button } from "@/components/ui/button"

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"))
  return match ? decodeURIComponent(match[2]) : null
}

function clearCookies(names: string[]) {
  names.forEach((n) => { document.cookie = `${n}=;path=/;max-age=0` })
}

export function ImpersonateBanner() {
  const [tenantName, setTenantName] = useState<string | null>(null)
  const [userName, setUserName] = useState<string | null>(null)
  const pathname = usePathname()

  useEffect(() => {
    setTenantName(getCookie("impersonate-tenant"))
    setUserName(getCookie("impersonate-user"))
  }, [pathname])

  // Impersonate user (tenant admin → user)
  if (userName) {
    const stop = async () => {
      await fetch("/api/tenant/impersonate-user", { method: "DELETE" })
      clearCookies(["impersonate-user", "impersonate-user-role", "impersonate-by-admin"])
      setUserName(null)
      window.location.reload()
    }

    return (
      <div className="bg-blue-500 text-white px-4 py-2 flex items-center justify-center gap-3 text-sm font-medium z-[100]">
        <User className="h-4 w-4" />
        <span>Melihat sebagai user: <strong>{userName}</strong></span>
        <Button size="sm" variant="outline" className="h-7 rounded-lg border-blue-300 bg-primary text-white hover:bg-blue-700 text-xs px-3" onClick={stop}>
          Kembali ke Admin
        </Button>
      </div>
    )
  }

  // Impersonate tenant (super admin → tenant)
  if (tenantName) {
    const stop = async () => {
      await fetch("/api/super-admin/impersonate", { method: "DELETE" })
      clearCookies(["impersonate-tenant", "impersonate-by"])
      setTenantName(null)
      window.location.href = "/super-admin/tenants"
    }

    return (
      <div className="bg-amber-500 text-amber-950 px-4 py-2 flex items-center justify-center gap-3 text-sm font-medium z-[100]">
        <ShieldAlert className="h-4 w-4" />
        <span>Melihat sebagai tenant: <strong>{tenantName}</strong></span>
        <Button size="sm" variant="outline" className="h-7 rounded-lg border-amber-700 bg-amber-600 text-white hover:bg-amber-700 text-xs px-3" onClick={stop}>
          Kembali ke Super Admin
        </Button>
      </div>
    )
  }

  return null
}
