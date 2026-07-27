import Link from "next/link"
import { ArrowRight, BadgeCheck, MessageCircle, ShieldCheck } from "lucide-react"
import type { PublicTenant } from "../_themes/types"

function waUrl(number: string, businessName: string) {
  const normalized = number.replace(/\D/g, "").replace(/^0/, "62")
  return `https://wa.me/${normalized}?text=${encodeURIComponent(`Halo ${businessName}, saya ingin berkonsultasi mengenai layanan Anda.`)}`
}

/** Shared conversion block: keeps the premium CTA and trust signals identical across system themes. */
export function BusinessCta({ tenant, base }: { tenant: PublicTenant; base: string }) {
  const industryPreset = tenant.settings?.industryPreset || "corporate"
  const hasDirectContact = Boolean(tenant.whatsapp || tenant.phone || tenant.email)
  if (!hasDirectContact) return null

  return (
    <section className="bg-muted/30 py-14 md:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div data-industry={industryPreset} className="relative overflow-hidden rounded-[2rem] bg-slate-950 px-6 py-10 text-white shadow-2xl sm:px-10 md:px-14 md:py-14 data-[industry=agency]:bg-violet-950 data-[industry=property]:bg-stone-900 data-[industry=fnb]:bg-orange-950 data-[industry=healthcare]:bg-teal-950">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,hsl(var(--primary)/.55),transparent_42%)]" />
          <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <div className="max-w-2xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-bold tracking-wide text-white/85">
                <BadgeCheck className="h-4 w-4 text-emerald-300" />
                RESPONS CEPAT & PROFESIONAL
              </div>
              <h2 className="text-3xl font-black tracking-tight sm:text-4xl">Mari wujudkan kebutuhan bisnis Anda.</h2>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-white/70">Ceritakan kebutuhan Anda. Tim {tenant.name} akan membantu menyiapkan solusi yang paling sesuai.</p>
              <div className="mt-6 flex flex-wrap gap-x-5 gap-y-3 text-sm text-white/75">
                <span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-300" />Konsultasi tanpa komitmen</span>
                <span className="inline-flex items-center gap-2"><BadgeCheck className="h-4 w-4 text-emerald-300" />Informasi langsung dari tim</span>
              </div>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              {tenant.whatsapp && <a href={waUrl(tenant.whatsapp, tenant.name)} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#25D366] px-6 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-[#20bd5a]"><MessageCircle className="h-5 w-5" />Konsultasi via WhatsApp</a>}
              <Link href={`${base}/contact`} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/10 px-6 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-white/20">Kirim pesan <ArrowRight className="h-4 w-4" /></Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
