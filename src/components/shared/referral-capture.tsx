"use client"

import { useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"

function CaptureLogic() {
  const searchParams = useSearchParams()

  useEffect(() => {
    const ref = searchParams.get("ref")
    if (ref) {
      // Hanya track klik sekali per sesi (untuk menghindari spam reload)
      const trackedKey = `tracked_ref_${ref}`
      if (!sessionStorage.getItem(trackedKey)) {
        sessionStorage.setItem(trackedKey, "true")
        fetch("/api/public/track-referral", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ref })
        }).catch(console.error)
      }
      localStorage.setItem("schoolpro_ref", ref)
    }
  }, [searchParams])

  return null
}

export function ReferralCapture() {
  return (
    <Suspense fallback={null}>
      <CaptureLogic />
    </Suspense>
  )
}
