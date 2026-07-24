import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen, Infinity, Landmark, Sparkles, TrendingUp, Users } from "lucide-react"
import { CommissionSimulator } from "./_components/commission-simulator"
import { getPricingConfig } from "@/features/finance/services/billing.service"
import { db } from "@/lib/db"

export default async function AffiliateGuidePage() {
  const pricing = await getPricingConfig()
  const pricePerStudent = pricing.PRICE_PER_STUDENT

  const litePlan = await db.subscriptionPlan.findUnique({ where: { slug: "lite" } })
  const priceLite = litePlan?.price || 1000000


  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Panduan Program Afiliasi</h1>
        <p className="text-muted-foreground mt-1 text-sm">Pelajari cara kerja, skema komisi, dan tips sukses mereferensikan perusahaan.</p>
      </div>

      {/* Skema Komisi Hero */}
      <Card className="glass border-0 shadow-lg relative overflow-hidden bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Infinity className="w-64 h-64 text-emerald-500 rotate-12" />
        </div>
        <CardHeader>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/20 text-emerald-700 w-fit text-sm font-semibold mb-2">
            <Sparkles className="w-4 h-4" /> Komisi Lifetime (Seumur Hidup)
          </div>
          <CardTitle className="text-3xl text-emerald-900">20% Komisi Berulang</CardTitle>
          <CardDescription className="text-base text-emerald-800/80 max-w-xl">
            Dapatkan passive income terus-menerus selama perusahaan yang Anda ajak tetap berlangganan paket berbayar di BisnisPro.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6 mt-2">
            <CommissionSimulator pricePerStudent={pricePerStudent} priceLite={priceLite} />
          </div>
        </CardContent>
      </Card>

      {/* Cara Kerja */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="glass shadow-sm">
          <CardHeader className="pb-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg mb-2">1</div>
            <CardTitle className="text-lg">Sebar Link / Kode</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Bagikan link afiliasi Anda ke kepala perusahaan, yayasan, atau operator perusahaan. Mereka bisa daftar gratis dulu.
          </CardContent>
        </Card>
        <Card className="glass shadow-sm">
          <CardHeader className="pb-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg mb-2">2</div>
            <CardTitle className="text-lg">Perusahaan Daftar</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Setiap pendaftaran yang menggunakan link/kode Anda akan otomatis tercatat permanen (terikat dengan akun Anda).
          </CardContent>
        </Card>
        <Card className="glass shadow-sm">
          <CardHeader className="pb-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg mb-2">3</div>
            <CardTitle className="text-lg">Terima Komisi</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Saat perusahaan tersebut Upgrade ke paket berbayar (Lite atau Pro), 20% komisi masuk ke dashboard Anda secara otomatis — berulang di setiap pembayaran, selamanya.
          </CardContent>
        </Card>
      </div>

      {/* FAQ */}
      <Card className="glass shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-muted-foreground" /> Pertanyaan Sering Ditanya
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <details className="group border-b pb-4 last:border-0 last:pb-0">
            <summary className="flex cursor-pointer list-none items-center justify-between font-semibold">
              Apakah mendaftar Afiliasi dipungut biaya?
              <span className="transition group-open:rotate-180">
                <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
              </span>
            </summary>
            <p className="text-muted-foreground mt-3 group-open:animate-in group-open:fade-in group-open:slide-in-from-top-1">
              Tidak, program afiliasi BisnisPro 100% gratis. Anda cukup mendaftar, melengkapi profil, dan langsung bisa menyebarkan link Anda.
            </p>
          </details>

          <details className="group border-b pb-4 last:border-0 last:pb-0">
            <summary className="flex cursor-pointer list-none items-center justify-between font-semibold">
              Bagaimana jika perusahaan hanya memakai paket Gratis?
              <span className="transition group-open:rotate-180">
                <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
              </span>
            </summary>
            <p className="text-muted-foreground mt-3 group-open:animate-in group-open:fade-in group-open:slide-in-from-top-1">
              Status perusahaan akan tetap tercatat sebagai referral Anda ("Leads & Perusahaan"). Namun komisi dalam bentuk saldo uang baru akan didapatkan ketika perusahaan memutuskan untuk meningkatkan (Upgrade) layanannya ke paket berbayar (Lite atau Pro). Setiap kali perusahaan tersebut membayar (termasuk perpanjangan), Anda otomatis mendapat 20% komisi — selamanya!
            </p>
          </details>

          <details className="group border-b pb-4 last:border-0 last:pb-0">
            <summary className="flex cursor-pointer list-none items-center justify-between font-semibold">
              Berapa minimal saldo yang bisa ditarik?
              <span className="transition group-open:rotate-180">
                <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
              </span>
            </summary>
            <p className="text-muted-foreground mt-3 group-open:animate-in group-open:fade-in group-open:slide-in-from-top-1">
              Pencairan komisi minimal adalah Rp 100.000. Anda bisa mengajukan penarikan kapan saja melalui menu "Komisi & Penarikan". Proses transfer biasanya memakan waktu 1-2 hari kerja.
            </p>
          </details>

          <details className="group border-b pb-4 last:border-0 last:pb-0">
            <summary className="flex cursor-pointer list-none items-center justify-between font-semibold">
              Tips promosi yang paling efektif?
              <span className="transition group-open:rotate-180">
                <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
              </span>
            </summary>
            <div className="text-muted-foreground mt-3 group-open:animate-in group-open:fade-in group-open:slide-in-from-top-1 space-y-2">
              <p>1. <strong>Edukasi Dulu:</strong> Jangan langsung jualan paket berbayar. Ajak mereka daftar Paket Gratis dulu karena fiturnya sudah sangat membantu perusahaan.</p>
              <p>2. <strong>Fokus pada Otomatisasi:</strong> Jelaskan bahwa BisnisPro bisa membuat tagihan SPP otomatis dan integrasi WhatsApp (fitur yang paling dicari bendahara).</p>
              <p>3. <strong>Gunakan Network:</strong> Hubungi grup-grup Kepala Perusahaan, MGMP, atau jaringan mitra perusahaan Anda.</p>
            </div>
          </details>
        </CardContent>
      </Card>
    </div>
  )
}
