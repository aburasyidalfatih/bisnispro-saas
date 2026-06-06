"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { loginSchema, type LoginInput } from "@/features/auth/schemas/auth.schema"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { LogIn } from "lucide-react"

import { Turnstile } from "@marsidev/react-turnstile"

import { checkIsMainDomain, getRootDomain, normalizeImageUrl } from "@/lib/utils"

export default function LoginPage({
  isMainDomain,
  tenantNameDisplay,
  platformLogo,
  googleAuthEnabled,
  turnstileSiteKey,
}: {
  isMainDomain: boolean;
  tenantNameDisplay: string | null;
  platformLogo: string;
  googleAuthEnabled: boolean;
  turnstileSiteKey: string | null;
}) {
  const router = useRouter()
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [needs2FA, setNeeds2FA] = useState(false)
  
  // Turnstile token state
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors }, getValues } = useForm<LoginInput & { twoFactorCode?: string }>({
    resolver: zodResolver(loginSchema),
  })

  async function onSubmit(data: LoginInput & { twoFactorCode?: string }) {
    if (turnstileSiteKey && !turnstileToken) {
      setError("Silakan selesaikan verifikasi keamanan (CAPTCHA) terlebih dahulu.")
      return
    }

    setLoading(true)
    setError("")

    const result = await signIn("credentials", {
      email: data.email,
      password: data.password,
      twoFactorCode: data.twoFactorCode || "",
      turnstileToken: turnstileToken || "",
      hostname: window.location.hostname,
      redirect: false,
    })

    if (result?.error) {
      if (result.error.includes("2FA_REQUIRED")) {
        setNeeds2FA(true)
        setLoading(false)
        return
      }
      
      // NextAuth v5 maps custom credentials errors to "CredentialsSignin"
      if (result.error === "CredentialsSignin") {
        setError("Email atau password yang Anda masukkan salah.")
      } else if (result.error === "Configuration") {
        setError("Terjadi kesalahan pada konfigurasi server (Database belum tersinkronisasi).")
      } else {
        setError(result.error)
      }
      setLoading(false)
    } else {
      try {
        const res = await fetch("/api/auth/session")
        const text = await res.text()
        const session = text ? JSON.parse(text) : null
        
        if (isMainDomain) {
          if (session?.user?.isSuperAdmin) {
            router.push("/super-admin")
          } else if (session?.user?.isAffiliate) {
            router.push("/affiliate")
          } else {
            router.push("/admin")
          }
        } else {
          const role = session?.user?.tenants?.[0]?.role
          if (role === "guru") {
            router.push("/panel-gtk")
          } else if (role === "siswa") {
            router.push("/siswa")
          } else if (role === "orangtua") {
            router.push("/ortu")
          } else {
            router.push("/admin")
          }
        }
      } catch (err) {
        console.error("Gagal mendapatkan sesi:", err)
        setError("Gagal membaca sesi dari server. Silakan muat ulang halaman.")
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-mesh p-4 relative overflow-hidden">
      <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full orb-1 opacity-20 blur-3xl" />
      <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full orb-2 opacity-15 blur-3xl" />
      <div className="absolute top-1/2 left-1/4 h-64 w-64 rounded-full orb-3 opacity-10 blur-3xl" />

      <div className="relative w-full max-w-md">
        <div className="glass rounded-3xl p-8 md:p-10 shadow-2xl">
          <div className="flex flex-col items-center mb-8 text-center">
            {isMainDomain ? (
              <img src={normalizeImageUrl(platformLogo)} alt="SchoolPro Logo" className="h-20 w-auto mb-2 object-contain" / loading="lazy" decoding="async">
            ) : (
              platformLogo ? (
                <img src={normalizeImageUrl(platformLogo)} alt={tenantNameDisplay || "Logo Tenant"} className="h-20 w-auto mb-4 object-contain" / loading="lazy" decoding="async">
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl btn-gradient text-white font-bold text-xl shadow-lg glow-primary mb-4">
                  {tenantNameDisplay ? tenantNameDisplay.charAt(0) : "S"}
                </div>
              )
            )}
            <h1 className="text-2xl font-bold tracking-tight">Selamat datang</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {isMainDomain 
                ? "Masuk ke akun SchoolPro Anda" 
                : `Masuk ke sistem informasi ${tenantNameDisplay || 'sekolah'}`}
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {error && (
              <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive text-center">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="nama@email.com" className="h-11 rounded-xl bg-background/50" {...register("email")} />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link href="/forgot-password" className="text-xs text-primary hover:underline">Lupa password?</Link>
              </div>
              <Input id="password" type="password" placeholder="••••••••" className="h-11 rounded-xl bg-background/50" {...register("password")} />
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>

            {needs2FA && (
              <div className="space-y-2">
                <Label htmlFor="twoFactorCode">Kode 2FA</Label>
                <Input id="twoFactorCode" placeholder="000000" maxLength={6} className="h-11 rounded-xl bg-background/50 text-center tracking-widest text-lg" {...register("twoFactorCode")} />
                <p className="text-xs text-muted-foreground">Masukkan kode dari aplikasi authenticator Anda</p>
              </div>
            )}

            {turnstileSiteKey && (
              <div className="flex justify-center py-2">
                <Turnstile 
                  siteKey={turnstileSiteKey} 
                  onSuccess={(token) => setTurnstileToken(token)}
                  options={{ theme: 'light' }}
                />
              </div>
            )}

            <Button type="submit" className="w-full h-11 rounded-xl btn-gradient text-white shadow-lg glow-primary border-0 gap-2 flex items-center justify-center" disabled={loading}>
              {loading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <LogIn className="h-4 w-4" />
                  {needs2FA ? "Verifikasi" : "Masuk"}
                </>
              )}
            </Button>
          </form>

          {!isMainDomain && (
            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Belum punya akun?{" "}
                <Link href="/register" className="text-primary font-semibold hover:underline">Daftar sekarang</Link>
              </p>
            </div>
          )}

          {/* OAuth */}
          {googleAuthEnabled && (
            <div className="mt-5">
              <div className="relative mb-4">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">atau</span></div>
              </div>
              <Button
                type="button"
                variant="outline"
                className="w-full h-11 rounded-xl gap-2"
                onClick={() => signIn("google", { callbackUrl: "/admin" })}
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                Masuk dengan Google
              </Button>
            </div>
          )}
        </div>
        <p className="text-center text-xs text-muted-foreground mt-6">&copy; {new Date().getFullYear()} {tenantNameDisplay || (isMainDomain ? "SchoolPro" : "Sistem Informasi Sekolah")}</p>
      </div>
    </div>
  )
}
