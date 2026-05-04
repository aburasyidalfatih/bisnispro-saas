"use client"

import { useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"

function CaptureLogic() {
  const searchParams = useSearchParams()

  useEffect(() => {
    const ref = searchParams.get("ref")
    if (ref) {
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
