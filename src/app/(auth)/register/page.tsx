"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { registerSchema, type RegisterInput } from "@/lib/validations/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { UserPlus } from "lucide-react"

export default function RegisterPage() {
  const router = useRouter()
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [isMainDomain, setIsMainDomain] = useState(true)
  const [tenantSlug, setTenantSlug] = useState<string | undefined>()
  const [tenantNameDisplay, setTenantNameDisplay] = useState<string | null>(null)
  const [platformLogo, setPlatformLogo] = useState("/logo-schoolpro.png")

  useEffect(() => {
    const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "schoolpro.my.id"
    const host = window.location.hostname
    const main = host === rootDomain || host === `www.${rootDomain}` || host === "localhost"
    setIsMainDomain(main)

    if (main) {
      fetch("/api/public/platform-info")
        .then(res => res.json())
        .then(data => {
          if (data && data.app_logo) {
            setPlatformLogo(data.app_logo)
          }
        })
        .catch(console.error)
    } else {
      const slug = host.split('.')[0]
      setTenantSlug(slug)
      
      // Ambil nama tenant untuk ditampilkan
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

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  })

  async function onSubmit(data: RegisterInput) {
    setLoading(true)
    setError("")

    // Jika di subdomain, masukkan tenantSlug dan kosongkan tenantName
    if (!isMainDomain && tenantSlug) {
      data.tenantSlug = tenantSlug
      data.tenantName = undefined
    }

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })

    const result = await res.json()

    if (!res.ok) {
      setError(result.error || "Terjadi kesalahan")
      setLoading(false)
    } else {
      router.push("/login?registered=true")
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-mesh p-4 relative overflow-hidden">
      <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full orb-1 opacity-20 blur-3xl" />
      <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full orb-2 opacity-15 blur-3xl" />
      <div className="absolute top-1/3 right-1/4 h-64 w-64 rounded-full orb-3 opacity-10 blur-3xl" />

      <div className="relative w-full max-w-md">
        <div className="glass rounded-3xl p-8 md:p-10 shadow-2xl">
          <div className="flex flex-col items-center mb-8 text-center">
            {isMainDomain ? (
              <img src={platformLogo} alt="SchoolPro Logo" className="h-20 w-auto mb-2 object-contain" />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl btn-gradient text-white font-bold text-xl shadow-lg glow-primary mb-4">
                {tenantNameDisplay ? tenantNameDisplay.charAt(0) : "S"}
              </div>
            )}
            <h1 className="text-2xl font-bold tracking-tight">Buat akun baru</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {isMainDomain 
                ? "Daftar dan buat organisasi Anda" 
                : `Daftar ke portal sistem informasi ${tenantNameDisplay || 'sekolah'}`}
            </p>
          </div>

          {!isMainDomain ? (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {error && (
                <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive text-center">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="name">Nama Lengkap</Label>
                <Input id="name" placeholder="Nama Anda" className="h-11 rounded-xl bg-background/50" {...register("name")} />
                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="nama@email.com" className="h-11 rounded-xl bg-background/50" {...register("email")} />
                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" placeholder="Minimal 8 karakter" className="h-11 rounded-xl bg-background/50" {...register("password")} />
                {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
              </div>

              <Button type="submit" className="w-full h-11 rounded-xl btn-gradient text-white shadow-lg glow-primary border-0 gap-2 mt-1" disabled={loading}>
                {loading ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" />
                    Daftar
                  </>
                )}
              </Button>
            </form>
          ) : (
            <div className="text-center text-sm text-muted-foreground mb-4">
              Silakan daftar menggunakan akun Google Anda untuk bergabung menjadi Mitra Afiliasi.
            </div>
          )}

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Sudah punya akun?{" "}
              <Link href="/login" className="text-primary font-semibold hover:underline">Masuk</Link>
            </p>
          </div>

          {/* OAuth */}
          <div className="mt-5">
            {!isMainDomain && (
              <div className="relative mb-4">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">atau</span></div>
              </div>
            )}
            <Button
              type="button"
              variant="outline"
              className="w-full h-11 rounded-xl gap-2"
              onClick={() => signIn("google", { callbackUrl: "/admin" })}
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              Daftar dengan Google
            </Button>
          </div>
        </div>
        <p className="text-center text-xs text-muted-foreground mt-6">&copy; {new Date().getFullYear()} {tenantNameDisplay || (isMainDomain ? "SchoolPro" : "Sistem Informasi Sekolah")}</p>
      </div>
    </div>
  )
}
