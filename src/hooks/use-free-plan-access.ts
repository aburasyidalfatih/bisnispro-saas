import { useEffect, useState } from "react"


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
  const [access, setAccess] = useState<PlanAccess>(DEFAULT_ACCESS)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)

    fetch(`/api/public/free-plan-access?plan=${plan}`, { 
      cache: "force-cache", // Let Next.js handle the fetch caching safely
      signal: controller.signal 
    })
      .then(res => res.json())
      .then(data => {
        if (!controller.signal.aborted) {
          setAccess(data)
          setLoading(false)
        }
      })
      .catch((err) => {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      })
      
    return () => {
      controller.abort()
    }
  }, [plan])

  return { access, loading }
}

// Backward compatibility — alias
export function useFreePlanAccess() {
  return usePlanAccess("free")
}
