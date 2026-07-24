import { BellRing, Check } from "lucide-react"

export function SolutionsSection() {
  return (
    <section id="solusi" className="container mx-auto px-4 py-10 md:py-16">
      <div className="glass rounded-2xl md:rounded-3xl p-6 md:p-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 h-40 w-40 rounded-full orb-1 opacity-10 blur-3xl" />

        <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
          {/* Left */}
          <div className="space-y-5">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
              Langkah Pertama Menuju Digitalisasi Bisnis Anda
            </h2>
            <p className="text-muted-foreground leading-relaxed text-sm md:text-base">
              Banyak pemilik bisnis kesulitan membuat website karena biaya yang mahal dan perlunya keahlian coding.
              Kami hadir menyelesaikan masalah tersebut sepenuhnya, cocok untuk Restoran & Cafe, Properti & Real Estate, Jasa Profesional, Konsultan & Agensi, Toko & UMKM, serta Freelancer & Personal Brand.
            </p>
            <ul className="space-y-3 pt-1">
              {[
                "Tanpa Biaya Hosting: Server super cepat & aman dari kami.",
                "Tanpa Coding: Desain siap pakai, tinggal upload logo dan konten.",
                "SEO Friendly: Mudah ditemukan pelanggan di Google.",
                "Tingkatkan Konversi: Integrasi WhatsApp dan formulir kontak otomatis.",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary">
                    <Check className="h-3 w-3" />
                  </div>
                  <span className="text-sm md:text-base text-foreground">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Right — WA notification mockup */}
          <div className="relative rounded-xl md:rounded-2xl border bg-background/50 p-5 md:p-6 shadow-2xl backdrop-blur-sm">
            <div className="flex items-center gap-3 md:gap-4 border-b pb-4 mb-4">
              <div className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                <BellRing className="h-5 w-5 md:h-6 md:w-6 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold text-sm md:text-base">Notifikasi Pintar AI-Powered</h4>
                <p className="text-xs md:text-sm text-muted-foreground">Otomatisasi pengiriman pesan proaktif</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="rounded-xl bg-muted/50 p-3 md:p-4 text-xs md:text-sm border">
                &quot;Halo! Ada calon klien baru yang mengirim pesan dari website Anda mengenai jasa desain interior...&quot;
              </div>
              <div className="rounded-xl bg-muted/50 p-3 md:p-4 text-xs md:text-sm border">
                &quot;Trafik website Anda minggu ini naik 120%. Artikel terbaru Anda masuk halaman pertama Google!&quot;
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
