"use client"

import { usePathname } from "next/navigation"
import { MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import useSWR from "swr"
import Link from "next/link"

import { useTenantBranding } from "@/components/providers/tenant-branding-provider"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function MessageIndicator() {
  const { branding } = useTenantBranding()
  const pathname = usePathname()
  const tenantId = branding?.id

  const { data } = useSWR(
    tenantId ? `/api/tenant/messages/unread?tenantId=${tenantId}` : null,
    fetcher,
    { refreshInterval: 60000 } // Poll every minute
  )

  const unreadCount = data?.unread || 0

  const getHref = () => {
    if (pathname.startsWith("/super-admin")) return "#" // Not applicable for super admin
    if (pathname.startsWith("/panel-gtk")) return "/panel-gtk/my-messages"
    return "/admin/my-messages"
  }

  return (
    <Link href={getHref()}>
      <Button variant="ghost" size="icon" className="relative rounded-xl h-9 w-9" title="Pesan">
        <MessageSquare className="h-[18px] w-[18px]" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-rose-500 flex items-center justify-center text-[9px] font-bold text-white border-2 border-background animate-in zoom-in duration-300">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
        <span className="sr-only">Pesan</span>
      </Button>
    </Link>
  )
}
