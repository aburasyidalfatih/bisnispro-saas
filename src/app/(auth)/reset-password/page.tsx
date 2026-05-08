"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { KeyRound, CheckCircle } from "lucide-react"

export default function ResetPasswordPage() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [isMainDomain, setIsMainDomain] = useState(true)
  const [tenantNameDisplay, setTenantNameDisplay] = useState<string | null>(null)

  useEffect(() => {
    const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "schoolpro.id"
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
  }, [])

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError("")
    const formData = new FormData(e.currentTarget)
    const password = formData.get("password") as string
    const confirm = formData.get("confirm") as string

    if (password !== confirm) { setError("Password tidak cocok"); setLoading(false); return }

    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error); setLoading(false); return }
    setSuccess(true)
    setLoading(false)
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-mesh p-4">
        <div className="glass rounded-3xl p-8 shadow-2xl text-center max-w-md">
          <p className="text-destructive font-medium">Token tidak ditemukan</p>
          <Link href="/forgot-password"><Button variant="outline" className="mt-4 rounded-xl">Minta Link Baru</Button></Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-mesh p-4 relative overflow-hidden">
      <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full orb-1 opacity-20 blur-3xl" />
      <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full orb-2 opacity-15 blur-3xl" />
      <div className="relative w-full max-w-md">
        <div className="glass rounded-3xl p-8 md:p-10 shadow-2xl">
          <div className="flex flex-col items-center mb-8 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl btn-gradient text-white font-bold text-xl shadow-lg glow-primary mb-4">
              {tenantNameDisplay ? tenantNameDisplay.charAt(0) : (success ? <CheckCircle className="h-6 w-6" /> : <KeyRound className="h-6 w-6" />)}
            </div>
            <h1 className="text-2xl font-bold tracking-tight">{success ? "Berhasil!" : "Reset Password"}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {success 
                ? "Password Anda telah diperbarui" 
                : (isMainDomain 
                    ? "Masukkan password baru untuk akun SchoolPro Anda" 
                    : `Masukkan password baru untuk sistem ${tenantNameDisplay || 'sekolah'}`)}
            </p>
          </div>

          {success ? (
            <div className="text-center">
              <Link href="/login"><Button className="rounded-xl btn-gradient text-white border-0 glow-primary">Masuk Sekarang</Button></Link>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-5">
              {error && <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive text-center">{error}</div>}
              <div className="space-y-2">
                <Label htmlFor="password">Password Baru</Label>
                <Input id="password" name="password" type="password" placeholder="Minimal 8 karakter" required minLength={8} className="h-11 rounded-xl bg-background/50" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm">Konfirmasi Password</Label>
                <Input id="confirm" name="confirm" type="password" placeholder="Ulangi password baru" required minLength={8} className="h-11 rounded-xl bg-background/50" />
              </div>
              <Button type="submit" className="w-full h-11 rounded-xl btn-gradient text-white shadow-lg glow-primary border-0" disabled={loading}>
                {loading ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : "Reset Password"}
              </Button>
            </form>
          )}
        </div>
        <p className="text-center text-xs text-muted-foreground mt-6">&copy; {new Date().getFullYear()} {tenantNameDisplay || (isMainDomain ? "SchoolPro" : "Sistem Informasi Sekolah")}</p>
      </div>
    </div>
  )
}
