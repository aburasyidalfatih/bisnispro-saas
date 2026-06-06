"use client"

import { useSession } from "next-auth/react"
import { Building2, ChevronDown, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

import { getRootDomain } from "@/lib/utils"

export function TenantSwitcher() {
  const { data: session } = useSession()

  const tenants = session?.user?.tenants || []
  if (tenants.length <= 1) return null

  // Current tenant = first tenant (or detected from subdomain in production)
  const currentTenant = tenants[0]
  const rootDomain = getRootDomain()

  const switchTenant = (slug: string) => {
    // In production: navigate to subdomain
    // In development: just reload (single tenant per session)
    if (rootDomain !== "localhost:3000") {
      window.location.href = `https://${slug}.${rootDomain}/dashboard`
    } else {
      // Dev mode: show info that subdomain switching requires custom domain
      window.location.href = "/admin"
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="gap-2 rounded-xl h-9 px-3">
          <Building2 className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium max-w-[120px] truncate max-w-full">{currentTenant?.name}</span>
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 glass rounded-xl" align="start">
        <DropdownMenuLabel className="text-xs text-muted-foreground">Lembaga Anda</DropdownMenuLabel>
        {tenants.map((t) => (
          <DropdownMenuItem
            key={t.id}
            onClick={() => switchTenant(t.slug)}
            className="flex items-center justify-between rounded-lg"
          >
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                {t.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium">{t.name}</p>
                <p className="text-[11px] text-muted-foreground">{t.role}</p>
              </div>
            </div>
            {currentTenant?.id === t.id && <Check className="h-4 w-4 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
