"use client"

import { useState } from "react"
import { useFormStatus } from "react-dom"
import Link from "next/link"
import { Shield, Target, TrendingUp, Handshake, ChevronRight, UserPlus, Loader2, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { registerAffiliate } from "./actions"

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button disabled={pending} className="w-full h-12 rounded-xl btn-gradient text-white text-base font-semibold mt-6 shadow-xl glow-primary border-0 gap-2">
      {pending ? <Loader2 className="h-5 w-5 animate-spin" /> : <UserPlus className="h-5 w-5" />}
      {pending ? "Memproses..." : "Buat Akun Afiliasi"}
    </Button>
  )
}

export default function AffiliateRegistrationPage() {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<boolean>(false)

  async function action(formData: FormData) {
    setError(null)
    const result = await registerAffiliate(formData)
    if (result.error) {
      setError(result.error)
    } else if (result.success) {
      setSuccess(true)
    }
  }

  return (
    <div className="min-h-screen bg-mesh flex flex-col">
      <nav className="glass sticky top-0 z-50 border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg btn-gradient text-white font-bold text-xs">S</div>
            <span className="font-bold tracking-tight">SchoolPro</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium hover:text-primary transition-colors">
              Masuk
            </Link>
            <Link href="/">
              <Button variant="outline" size="sm" className="rounded-xl glass">Kembali ke Beranda</Button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="flex-1 container mx-auto px-4 py-12 md:py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
          {/* Left Side: Copywriting */}
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full glass px-4 py-2 text-sm">
              <Handshake className="h-4 w-4 text-primary" />
              <span className="text-muted-foreground font-medium">Program Kemitraan Resmi</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight">
              Bantu Sekolah Go Digital, <br />
              <span className="text-gradient">Dapatkan Penghasilan Tambahan</span>
            </h1>
            
            <p className="text-lg text-muted-foreground leading-relaxed">
              Bergabunglah dengan program Afiliasi SchoolPro. Bagikan link referral Anda, bantu sekolah beralih ke manajemen digital modern, dan dapatkan komisi <strong className="text-foreground">20%</strong> dari setiap pembayaran mereka.
            </p>
            
            <div className="space-y-4 pt-4">
              {[
                { icon: TrendingUp, title: "Komisi 20% Berulang", desc: "Dapatkan komisi tidak hanya di awal, tapi selama sekolah tersebut berlangganan." },
                { icon: Target, title: "Dashboard Transparan", desc: "Pantau jumlah klik, calon sekolah mendaftar, dan saldo yang siap ditarik secara real-time." },
                { icon: Shield, title: "Pencairan Mudah & Aman", desc: "Tarik saldo komisi langsung ke rekening bank Anda dengan cepat." }
              ].map((feature, i) => (
                <div key={i} className="flex gap-4 p-4 rounded-2xl glass border hover:border-primary/30 transition-colors">
                  <div className="h-12 w-12 shrink-0 rounded-xl bg-primary/10 flex items-center justify-center">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Side: Registration Form */}
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary to-indigo-600 rounded-[2rem] blur-lg opacity-20" />
            <div className="relative glass rounded-[2rem] p-8 md:p-10 border shadow-2xl">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold">Daftar Akun Afiliasi</h2>
                <p className="text-sm text-muted-foreground mt-2">Isi formulir di bawah ini untuk mendapatkan kode referral Anda.</p>
              </div>

              {success ? (
                <div className="text-center py-8 space-y-4">
                  <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20 text-green-600 mb-4">
                    <CheckCircle2 className="h-8 w-8" />
                  </div>
                  <h3 className="text-xl font-bold">Pendaftaran Berhasil!</h3>
                  <p className="text-muted-foreground">Akun kemitraan Anda telah dibuat. Anda bisa masuk ke Dashboard Afiliasi sekarang.</p>
                  <Link href="/login" className="inline-block w-full pt-4">
                    <Button className="w-full h-12 rounded-xl btn-gradient text-white shadow-xl glow-primary border-0">
                      Login ke Dashboard
                    </Button>
                  </Link>
                </div>
              ) : (
                <form action={action} className="space-y-4">
                  {error && (
                    <div className="p-3 text-sm text-red-600 bg-red-500/10 border border-red-500/20 rounded-xl">
                      {error}
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Nama Lengkap</label>
                    <input type="text" name="name" required className="w-full flex h-11 rounded-xl border border-input bg-background/50 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-transparent transition-all" placeholder="Masukkan nama lengkap" />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Email</label>
                    <input type="email" name="email" required className="w-full flex h-11 rounded-xl border border-input bg-background/50 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-transparent transition-all" placeholder="email@contoh.com" />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Nomor WhatsApp</label>
                    <input type="tel" name="phone" required className="w-full flex h-11 rounded-xl border border-input bg-background/50 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-transparent transition-all" placeholder="081234567890" />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Password</label>
                    <input type="password" name="password" required minLength={8} className="w-full flex h-11 rounded-xl border border-input bg-background/50 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-transparent transition-all" placeholder="Minimal 8 karakter" />
                  </div>

                  <SubmitButton />
                  
                  <p className="text-xs text-center text-muted-foreground mt-4">
                    Dengan mendaftar, Anda menyetujui Syarat & Ketentuan program Afiliasi SchoolPro.
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
