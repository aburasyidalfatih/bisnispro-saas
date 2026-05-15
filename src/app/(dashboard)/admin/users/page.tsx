"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

// Redirect /admin/users to /admin/users/admin
export default function UsersIndexPage() {
  const router = useRouter()
  useEffect(() => {
    router.replace("/admin/users/admin")
  }, [router])
  return (
    <div className="flex h-[50vh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  )
}
