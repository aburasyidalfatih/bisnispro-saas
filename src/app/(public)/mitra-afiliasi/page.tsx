"use client"

import { signIn } from "next-auth/react"
import Link from "next/link"
import { Shield, Target, TrendingUp, Handshake } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function MitraAfiliasi() {
  return (
    <div className="min-h-screen bg-mesh flex flex-col">
      <nav className="glass sticky top-0 z-50 border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg btn-gradient text-white font-bold text-xs">S</div>
            <span className="font-bold tracking-tight">SchoolPro</span>
          </Link>
          <Link href="/">
            <Button variant="outline" size="sm" className="rounded-xl glass">Kembali ke Beranda</Button>
          </Link>
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
                { icon: Shield, title: "Pencairan Mudah & Aman", desc: "Tarik saldo komisi langsung ke rekening bank Anda dengan cepat." },
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

          {/* Right Side: Google Sign-in */}
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary to-indigo-600 rounded-[2rem] blur-lg opacity-20" />
            <div className="relative glass rounded-[2rem] p-8 md:p-10 border shadow-2xl">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold">Portal Mitra Afiliasi</h2>
                <p className="text-sm text-muted-foreground mt-2">
                  Gunakan akun Google Anda untuk masuk atau mendaftar sebagai mitra.
                </p>
              </div>

              <Button
                onClick={() => signIn("google", { callbackUrl: "/affiliate" })}
                type="button"
                className="w-full h-14 rounded-xl bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 shadow-md font-semibold gap-3 transition-all"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Lanjutkan dengan Google
              </Button>

              <p className="text-xs text-center text-muted-foreground mt-6">
                Dengan melanjutkan, Anda menyetujui{" "}
                <Link href="/syarat-ketentuan" className="underline hover:text-primary">
                  Syarat &amp; Ketentuan
                </Link>{" "}
                program Afiliasi SchoolPro.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
