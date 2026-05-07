import { useEffect, useState } from "react"

let cachedAccess: Record<string, boolean> | null = null;

export function useFreePlanAccess() {
  const [access, setAccess] = useState<Record<string, boolean>>(
    cachedAccess || {
      enable_ppdb: false,
      enable_finance: false,
      enable_whatsapp: false,
      enable_custom_domain: false,
      enable_analytics: false,
      enable_parent_portal: false
    }
  )
  const [loading, setLoading] = useState(!cachedAccess)

  useEffect(() => {
    if (cachedAccess) return;
    fetch("/api/public/free-plan-access")
      .then(res => res.json())
      .then(data => {
        cachedAccess = data
        setAccess(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  return { access, loading }
}
