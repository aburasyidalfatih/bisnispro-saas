"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { UserPlus, CheckCircle, XCircle } from "lucide-react"
import Link from "next/link"

export default function AcceptInvitePage() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  const { data: session, status } = useSession()
  const router = useRouter()
  const [state, setState] = useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = useState("")
  const [isMainDomain, setIsMainDomain] = useState(true)
  const [tenantNameDisplay, setTenantNameDisplay] = useState<string | null>(null)

  useEffect(() => {
    const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "schoolpro.my.id"
    const host = window.location.hostname
    const main = host === rootDomain || host === `www.${rootDomain}` || host === "localhost"
    setIsMainDomain(main)
    
    if (!main) {
      const slug = host.split('.')[0]
      fetch(`/api/website/${slug}`)
        .then(res => res.json())
        .then(data => {
          if (data && data.name) {
            setTenantNameDisplay(data.name)
          }
        })
        .catch(console.error)
    }

    if (status === "unauthenticated") {
      router.push(`/login?callbackUrl=/invite/accept?token=${token}`)
      return
    }
    if (status !== "authenticated" || !token) return

    fetch("/api/tenant/invite/accept", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { setState("error"); setMessage(data.error) }
        else { setState("success"); setMessage(data.message) }
      })
      .catch(() => { setState("error"); setMessage("Terjadi kesalahan") })
  }, [status, token, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-mesh p-4 relative overflow-hidden">
      <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full orb-1 opacity-20 blur-3xl" />
      <div className="relative w-full max-w-md">
        <div className="glass rounded-3xl p-8 md:p-10 shadow-2xl text-center">
          {state === "loading" && (
            <>
              <div className="h-14 w-14 mx-auto mb-4 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <p className="text-muted-foreground">Memproses undangan...</p>
            </>
          )}
          {state === "success" && (
            <>
              <div className="flex h-14 w-14 mx-auto items-center justify-center rounded-2xl bg-primary/10 mb-4">
                <CheckCircle className="h-7 w-7 text-primary" />
              </div>
              <h1 className="text-xl font-bold mb-2">Berhasil Bergabung!</h1>
              <p className="text-muted-foreground text-sm mb-6">{message}</p>
              <Link href="/admin"><Button className="rounded-xl btn-gradient text-white border-0">Buka Dashboard</Button></Link>
            </>
          )}
          {state === "error" && (
            <>
              <div className="flex h-14 w-14 mx-auto items-center justify-center rounded-2xl bg-destructive/10 mb-4">
                <XCircle className="h-7 w-7 text-destructive" />
              </div>
              <h1 className="text-xl font-bold mb-2">Gagal</h1>
              <p className="text-muted-foreground text-sm mb-6">{message}</p>
              <Link href="/admin"><Button variant="outline" className="rounded-xl">Kembali ke Dashboard</Button></Link>
            </>
          )}
        </div>
        <p className="text-center text-xs text-muted-foreground mt-6">&copy; {new Date().getFullYear()} {tenantNameDisplay || (isMainDomain ? "SchoolPro" : "Sistem Informasi Sekolah")}</p>
      </div>
    </div>
  )
}
