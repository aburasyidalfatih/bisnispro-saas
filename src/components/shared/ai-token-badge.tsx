"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Zap } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

export function AiTokenBadge() {
  const { data: session } = useSession()
  const [tokens, setTokens] = useState<number | null>(null)
  
  useEffect(() => {
    const tenantId = session?.user?.tenants?.[0]?.id
    if (!tenantId) return

    const fetchTokens = () => {
      fetch(`/api/tenant/ai-settings?tenantId=${tenantId}`)
        .then(res => res.json())
        .then(data => {
          if (data && (typeof data.aiTokens === 'number' || typeof data.aiAddonTokens === 'number')) {
            const total = (data.aiTokens || 0) + (data.aiAddonTokens || 0)
            setTokens(total)
          }
        })
        .catch(() => {})
    }

    fetchTokens()
    
    // Optional: set interval to refresh tokens every few minutes
    const interval = setInterval(fetchTokens, 60000)
    return () => clearInterval(interval)
  }, [session])

  if (tokens === null) return null

  return (
    <Link href="/admin/settings/ai">
      <div className={cn(
        "flex items-center gap-1.5 px-3 py-1.5 rounded-full border bg-background hover:bg-accent/50 transition-colors shadow-sm",
        tokens > 0 ? "border-blue-500/30 bg-blue-50/50 dark:bg-blue-950/20" : "border-border"
      )}>
        <Zap className={cn("h-3.5 w-3.5", tokens > 0 ? "text-blue-500 fill-blue-500/20" : "text-muted-foreground")} />
        <span className={cn("text-xs font-bold", tokens > 0 ? "text-blue-600 dark:text-blue-400" : "text-muted-foreground")}>
          {tokens.toLocaleString("id-ID")}
        </span>
      </div>
    </Link>
  )
}
