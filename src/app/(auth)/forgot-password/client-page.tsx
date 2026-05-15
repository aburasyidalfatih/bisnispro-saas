"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Mail } from "lucide-react"
import { getRootDomain } from "@/lib/utils"

export default function ForgotPasswordPage({
  isMainDomain,
  tenantNameDisplay,
  platformLogo,
}: {
  isMainDomain: boolean;
  tenantNameDisplay: string | null;
  platformLogo: string;
}) {
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: formData.get("email") }),
    })
    setSent(true)
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-mesh p-4 relative overflow-hidden">
      <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full orb-1 opacity-20 blur-3xl" />
      <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full orb-2 opacity-15 blur-3xl" />
      <div className="relative w-full max-w-md">
        <div className="glass rounded-3xl p-8 md:p-10 shadow-2xl">
          <div className="flex flex-col items-center mb-8 text-center">
            {isMainDomain ? (
              <img src={platformLogo} alt="SchoolPro Logo" className="h-20 w-auto mb-2 object-contain" />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl btn-gradient text-white font-bold text-xl shadow-lg glow-primary mb-4">
                {tenantNameDisplay ? tenantNameDisplay.charAt(0) : <Mail className="h-6 w-6" />}
              </div>
            )}
            <h1 className="text-2xl font-bold tracking-tight">Lupa Password</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {isMainDomain 
                ? "Masukkan email Anda untuk menerima link reset akun SchoolPro" 
                : `Masukkan email Anda untuk menerima link reset ${tenantNameDisplay || 'sekolah'}`}
            </p>
          </div>

          {sent ? (
            <div className="text-center space-y-4">
              <div className="rounded-xl bg-primary/10 p-4 text-sm text-primary">
                Jika email terdaftar, link reset password telah dikirim. Silakan cek inbox Anda.
              </div>
              <Link href="/login">
                <Button variant="outline" className="gap-2 rounded-xl">
                  <ArrowLeft className="h-4 w-4" /> Kembali ke Login
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" placeholder="nama@email.com" required className="h-11 rounded-xl bg-background/50" />
              </div>
              <Button type="submit" className="w-full h-11 rounded-xl btn-gradient text-white shadow-lg glow-primary border-0" disabled={loading}>
                {loading ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : "Kirim Link Reset"}
              </Button>
              <div className="text-center">
                <Link href="/login" className="text-sm text-muted-foreground hover:text-primary">
                  <span className="inline-flex items-center gap-1"><ArrowLeft className="h-3 w-3" /> Kembali ke Login</span>
                </Link>
              </div>
            </form>
          )}
        </div>
        <p className="text-center text-xs text-muted-foreground mt-6">&copy; {new Date().getFullYear()} {tenantNameDisplay || (isMainDomain ? "SchoolPro" : "Sistem Informasi Sekolah")}</p>
      </div>
    </div>
  )
}
