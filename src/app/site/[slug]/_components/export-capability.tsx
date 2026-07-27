import Link from "next/link"
import { BadgeCheck, Clock3, Download, Factory, Globe2, PackageCheck, ShieldCheck } from "lucide-react"
import type { ExportProfile, PublicTenant } from "../_themes/types"

const asList = (value: string[] | undefined) => (value || []).filter(Boolean)

export function ExportCapability({ tenant, base, compact = false }: { tenant: PublicTenant; base: string; compact?: boolean }) {
  const profile = tenant.settings?.exportProfile as ExportProfile | undefined
  if (!profile?.enabled) return null

  const certifications = asList(profile.certifications)
  const markets = asList(profile.exportCountries).length ? asList(profile.exportCountries) : asList(profile.targetMarkets)

  if (compact) {
    return (
      <section className="border-y bg-slate-950 py-4 text-white" aria-label="International business capability">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3"><Globe2 className="h-5 w-5 text-cyan-300" /><span className="text-sm font-bold">Ready for international business inquiries</span></div>
          <Link href={`${base}/export`} className="text-sm font-bold text-cyan-200 underline-offset-4 hover:underline">View export capability</Link>
        </div>
      </section>
    )
  }

  const facts = [
    profile.minimumOrder && { label: "Minimum order", value: profile.minimumOrder, icon: PackageCheck },
    profile.productionCapacity && { label: "Production capacity", value: profile.productionCapacity, icon: Factory },
    profile.leadTime && { label: "Lead time", value: profile.leadTime, icon: Clock3 },
    profile.incoterms && { label: "Incoterms", value: profile.incoterms, icon: Globe2 },
  ].filter(Boolean) as { label: string; value: string; icon: typeof Globe2 }[]

  return (
    <section className="bg-slate-950 py-14 text-white md:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_.9fr] lg:items-end">
          <div>
            <p className="mb-3 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[.18em] text-cyan-300"><Globe2 className="h-4 w-4" /> International capability</p>
            <h2 className="max-w-2xl text-3xl font-black tracking-tight sm:text-4xl">A dependable partner for cross-border business.</h2>
            <p className="mt-4 max-w-2xl leading-relaxed text-slate-300">{tenant.name} is prepared to discuss commercial requirements, documentation, and fulfilment for international buyers.</p>
            {markets.length > 0 && <p className="mt-5 text-sm font-semibold text-slate-200">Markets served: <span className="font-normal text-slate-300">{markets.join(" · ")}</span></p>}
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href={`${base}/rfq`} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-cyan-400 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-300"><PackageCheck className="h-4 w-4" /> Request a quotation</Link>
              {profile.catalogueUrl && <a href={profile.catalogueUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/20 px-5 py-3 text-sm font-bold transition hover:bg-white/10"><Download className="h-4 w-4" /> Download catalogue</a>}
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {facts.map(({ label, value, icon: Icon }) => <div key={label} className="rounded-2xl border border-white/10 bg-white/5 p-5"><Icon className="h-5 w-5 text-cyan-300" /><p className="mt-4 text-xs font-bold uppercase tracking-wider text-slate-400">{label}</p><p className="mt-1 text-base font-bold">{value}</p></div>)}
            {certifications.length > 0 && <div className="rounded-2xl border border-white/10 bg-white/5 p-5 sm:col-span-2"><ShieldCheck className="h-5 w-5 text-cyan-300" /><p className="mt-4 text-xs font-bold uppercase tracking-wider text-slate-400">Certifications & compliance</p><div className="mt-3 flex flex-wrap gap-2">{certifications.map(item => <span key={item} className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold"><BadgeCheck className="h-3.5 w-3.5 text-cyan-300" />{item}</span>)}</div></div>}
          </div>
        </div>
      </div>
    </section>
  )
}
