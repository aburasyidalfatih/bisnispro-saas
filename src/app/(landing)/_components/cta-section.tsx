import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

export function CtaSection() {
  return (
    <section className="container mx-auto px-4 py-12 md:py-20">
      <div className="glass rounded-[1.75rem] md:rounded-[2.5rem] p-8 md:p-20 text-center relative overflow-hidden border">
        <div className="absolute -top-20 -right-20 h-80 w-80 rounded-full orb-1 opacity-20 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-80 w-80 rounded-full orb-2 opacity-20 blur-3xl" />
        <div className="relative space-y-6 md:space-y-8 max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight leading-tight">
            Wujudkan <span className="text-gradient">Website Bisnis Anda</span>
            <br className="hidden sm:block" />
            Dalam Genggaman
          </h2>
          <p className="text-muted-foreground text-sm md:text-lg">
            Tidak perlu membuang jutaan rupiah untuk menyewa web developer. Dapatkan web profil perusahaan dengan fitur canggih sekarang juga.
          </p>
          <div className="pt-2 flex justify-center">
            <Link href="/daftarkan-bisnis" className="w-full sm:w-auto">
              <Button
                size="lg"
                className="rounded-xl md:rounded-2xl btn-gradient text-white shadow-2xl glow-primary h-12 md:h-14 px-7 md:px-10 text-sm md:text-lg font-semibold gap-3 border-0 w-full flex items-center justify-center"
              >
                Buat Web Bisnis Gratis Sekarang <ArrowRight className="h-4 w-4 md:h-5 md:w-5" />
              </Button>
            </Link>
          </div>
          <p className="text-xs text-muted-foreground/60">Tanpa kartu kredit &bull; Setup instan 5 menit</p>
        </div>
      </div>
    </section>
  )
}
