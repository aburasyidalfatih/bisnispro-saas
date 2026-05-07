import { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Wallet, Users, Share2, CheckCircle2 } from "lucide-react"

export const metadata: Metadata = {
  title: "Program Afiliasi | SchoolPro",
  description: "Dapatkan penghasilan tambahan dengan mengajak sekolah menggunakan SchoolPro.",
}

export default function AffiliateProgramPage() {
  const steps = [
    {
      title: "1. Daftar Menjadi Mitra",
      description: "Buat akun SchoolPro dan dapatkan tautan referral unik Anda di dashboard super admin.",
      icon: Users
    },
    {
      title: "2. Bagikan Tautan",
      description: "Sebarkan tautan referral Anda ke kepala sekolah, yayasan, atau kenalan Anda di dunia pendidikan.",
      icon: Share2
    },
    {
      title: "3. Dapatkan Komisi",
      description: "Nikmati komisi menarik untuk setiap sekolah yang mendaftar dan berlangganan menggunakan tautan Anda.",
      icon: Wallet
    }
  ]

  return (
    <div className="bg-background min-h-screen pt-24 pb-16">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold tracking-wider uppercase mb-6">
            Peluang Penghasilan Tambahan
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-6 text-foreground tracking-tight">
            Program Afiliasi <span className="text-gradient">SchoolPro</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Bantu digitalisasi sekolah di seluruh Indonesia sekaligus dapatkan penghasilan tak terbatas. Semakin banyak yang bergabung, semakin besar komisi Anda.
          </p>
          <div className="mt-10">
            <Link href="/register">
              <Button size="lg" className="rounded-xl btn-gradient text-white h-14 px-8 text-lg font-bold shadow-xl glow-primary">
                Gabung Sekarang <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>

        {/* How it Works */}
        <div className="grid md:grid-cols-3 gap-8 mb-20">
          {steps.map((step, i) => (
            <div key={i} className="bg-muted/30 border rounded-3xl p-8 relative overflow-hidden group hover:border-primary/50 transition-colors">
              <div className="h-14 w-14 rounded-2xl bg-background border flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform">
                <step.icon className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">{step.title}</h3>
              <p className="text-muted-foreground">{step.description}</p>
            </div>
          ))}
        </div>

        {/* Benefits */}
        <div className="bg-primary/5 border border-primary/10 rounded-3xl p-8 md:p-12">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">Kenapa Bergabung?</h2>
              <ul className="space-y-4">
                {[
                  "Komisi berulang (recurring) setiap bulan selama sekolah berlangganan.",
                  "Pencairan komisi cepat dan transparan via transfer bank.",
                  "Produk sangat dibutuhkan (SaaS Manajemen Sekolah) dengan konversi tinggi.",
                  "Dashboard khusus untuk melacak klik, pendaftar, dan komisi."
                ].map((benefit, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="h-6 w-6 text-primary shrink-0" />
                    <span className="text-muted-foreground font-medium">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-accent/20 rounded-[2rem] transform rotate-3 scale-105 blur-xl opacity-50" />
              <div className="relative bg-background border rounded-3xl p-8 shadow-2xl">
                <h3 className="text-2xl font-bold mb-2">Simulasi Potensi</h3>
                <p className="text-muted-foreground mb-6">Jika Anda berhasil mereferensikan 10 sekolah Paket Pro.</p>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 rounded-xl bg-muted/50">
                    <span className="font-medium">Komisi per sekolah</span>
                    <span className="font-bold text-primary">Rp 50.000 /bln</span>
                  </div>
                  <div className="flex justify-between items-center p-4 rounded-xl bg-primary/10 border border-primary/20">
                    <span className="font-bold">Total Pasif Income</span>
                    <span className="font-extrabold text-xl text-primary">Rp 500.000 /bln</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
