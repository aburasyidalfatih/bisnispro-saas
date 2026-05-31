import { useEffect, useState } from "react"

let cachedAccess: Record<string, Record<string, boolean>> = {};

export interface PlanAccess {
  // Legacy keys (backward compat)
  enable_ppdb: boolean
  enable_finance: boolean
  enable_whatsapp: boolean
  enable_custom_domain: boolean
  enable_analytics: boolean
  enable_parent_portal: boolean
  // New granular access
  _plan_access: Record<string, boolean>
}

const DEFAULT_ACCESS: PlanAccess = {
  enable_ppdb: false,
  enable_finance: false,
  enable_whatsapp: false,
  enable_custom_domain: false,
  enable_analytics: false,
  enable_parent_portal: false,
  _plan_access: {},
}

export function usePlanAccess(plan: string = "free") {
  const [access, setAccess] = useState<PlanAccess>(
    (cachedAccess[plan] as any) || DEFAULT_ACCESS
  )
  const [loading, setLoading] = useState(!cachedAccess[plan])

  useEffect(() => {
    if (cachedAccess[plan]) {
      setAccess(cachedAccess[plan] as any)
      setLoading(false)
      return
    }
    fetch(`/api/public/free-plan-access?plan=${plan}`, { cache: "no-store" })
      .then(res => res.json())
      .then(data => {
        cachedAccess[plan] = data
        setAccess(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [plan])

  return { access, loading }
}

// Backward compatibility — alias
export function useFreePlanAccess() {
  return usePlanAccess("free")
}
