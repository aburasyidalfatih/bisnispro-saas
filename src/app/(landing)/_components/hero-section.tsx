import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Bot, Database, Globe, Shield, Sparkles, Zap, ChevronRight } from "lucide-react"

export function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full orb-1 opacity-20 blur-3xl" />
      <div className="absolute -top-20 right-0 h-80 w-80 rounded-full orb-2 opacity-15 blur-3xl" />
      <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full orb-3 opacity-10 blur-3xl" />

      {/* Floating Technology Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[15%] left-[10%] animate-float-slow opacity-30 md:opacity-40">
          <div className="h-12 w-12 rounded-2xl bg-blue-500/10 flex items-center justify-center backdrop-blur-sm border border-blue-500/20 shadow-xl shadow-blue-500/5">
            <Database className="h-6 w-6 text-blue-500" />
          </div>
        </div>
        <div className="absolute top-[25%] right-[15%] animate-float-delayed opacity-30 md:opacity-40">
          <div className="h-16 w-16 rounded-3xl bg-indigo-500/10 flex items-center justify-center backdrop-blur-sm border border-indigo-500/20 shadow-xl shadow-indigo-500/5">
            <Globe className="h-8 w-8 text-indigo-500" />
          </div>
        </div>
        <div className="absolute bottom-[25%] left-[20%] animate-float opacity-30 md:opacity-40">
          <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center backdrop-blur-sm border border-emerald-500/20 shadow-xl shadow-emerald-500/5">
            <Bot className="h-7 w-7 text-emerald-500" />
          </div>
        </div>
        <div className="absolute bottom-[35%] right-[10%] animate-float-slow opacity-30 md:opacity-40">
          <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center backdrop-blur-sm border border-amber-500/20 shadow-xl shadow-amber-500/5">
            <Zap className="h-5 w-5 text-amber-500" />
          </div>
        </div>
        <div className="absolute top-[45%] left-[5%] animate-float opacity-20 md:opacity-30">
          <div className="h-10 w-10 rounded-xl bg-purple-500/10 flex items-center justify-center backdrop-blur-sm border border-purple-500/20 shadow-xl shadow-purple-500/5">
            <Shield className="h-5 w-5 text-purple-500" />
          </div>
        </div>
      </div>

      <div className="container relative mx-auto px-4 py-14 text-center lg:py-20">
        <div className="mx-auto max-w-4xl space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full glass px-4 py-2 text-xs md:text-sm">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span className="text-muted-foreground">Platform Web Sekolah Gratis & Manajemen Digital</span>
            <ChevronRight className="h-3 w-3 text-muted-foreground" />
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.15]">
            Solusi <span className="text-gradient">Website Sekolah Gratis</span> & Profesional
          </h1>

          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed px-2">
            Tingkatkan kredibilitas sekolah Anda dalam 5 menit. Dapatkan web sekolah gratis yang cepat, aman, dan
            mudah dikelola tanpa biaya server. Mulai dari website, tumbuh menjadi{" "}
            <em className="italic font-medium text-foreground">Smart School</em> dengan ekosistem PPDB dan Keuangan.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <Link href="/daftarkan-sekolah" className="w-full sm:w-auto">
              <Button
                size="lg"
                className="w-full gap-2 rounded-xl btn-gradient text-white shadow-xl glow-primary h-12 md:h-14 px-6 md:px-8 text-sm md:text-base border-0 flex items-center justify-center"
              >
                Buat Website Sekolah Gratis <ArrowRight className="h-4 w-4 md:h-5 md:w-5" />
              </Button>
            </Link>
            <Link href="#fitur" className="w-full sm:w-auto">
              <Button
                variant="outline"
                size="lg"
                className="w-full rounded-xl glass h-12 md:h-14 px-6 md:px-8 text-sm md:text-base"
              >
                Jelajahi Fitur
              </Button>
            </Link>
          </div>

          <p className="text-xs text-muted-foreground/60 pt-2">
            Tanpa kartu kredit &bull; Setup instan 5 menit &bull; Gratis selamanya
          </p>
        </div>
      </div>
    </section>
  )
}
