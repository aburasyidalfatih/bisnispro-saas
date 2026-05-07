"use client"

import Link from "next/link"
import { ArrowRight, Palette } from "lucide-react"
import { useRouting } from "@/components/providers/routing-provider"

interface Extracurricular {
  id: string
  name: string
  description?: string | null
  schedule?: string | null
  imageUrl?: string | null
}

interface ExtracurricularsSectionProps {
  extracurriculars: Extracurricular[]
}

const EMOJI_FALLBACKS = ["⚽", "🎨", "🎵", "🏸", "📚", "🤖", "🎭", "🏊", "🎯", "🌿", "💻", "📷"]

export function ExtracurricularsSection({ extracurriculars }: ExtracurricularsSectionProps) {
  const { resolveHref } = useRouting()

  if (!extracurriculars || extracurriculars.length === 0) return null

  const displayed = extracurriculars.slice(0, 8)

  return (
    <section className="py-16 md:py-20 bg-background relative overflow-hidden">
      <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-purple-400/5 blur-3xl pointer-events-none" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-12">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 text-purple-600 text-xs font-bold tracking-wider uppercase mb-4">
              <Palette className="h-3.5 w-3.5" />
              Ekstrakurikuler
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2 bg-clip-text text-transparent bg-gradient-to-r from-foreground to-primary">Kegiatan Ekstrakurikuler</h2>
            <p className="text-muted-foreground text-sm md:text-base max-w-xl">
              Wadah pengembangan minat, bakat, dan kreativitas siswa di luar kegiatan akademik.
            </p>
          </div>
          <Link href={resolveHref("/ekstrakurikuler")} className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline whitespace-nowrap">
            Lihat Semua <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
          {displayed.map((ekskul, idx) => (
            <Link
              key={ekskul.id}
              href={resolveHref(`/ekstrakurikuler/${ekskul.id}`)}
              className="group relative bg-background rounded-2xl border p-5 text-center transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-purple-200"
            >
              <div className="mx-auto w-16 h-16 rounded-2xl overflow-hidden mb-4 shadow-sm border bg-muted/50 flex items-center justify-center">
                {ekskul.imageUrl ? (
                  <img src={ekskul.imageUrl} alt={ekskul.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                ) : (
                  <span className="text-3xl">{EMOJI_FALLBACKS[idx % EMOJI_FALLBACKS.length]}</span>
                )}
              </div>
              <h3 className="font-bold text-sm mb-1 line-clamp-1 group-hover:text-purple-600 transition-colors">{ekskul.name}</h3>
              {ekskul.schedule && (
                <p className="text-[10px] text-muted-foreground font-medium mt-1">{ekskul.schedule}</p>
              )}
              {ekskul.description && (
                <p className="text-[11px] text-muted-foreground mt-2 line-clamp-2 opacity-60 group-hover:opacity-100 transition-opacity">{ekskul.description}</p>
              )}
            </Link>
          ))}
        </div>


      </div>
    </section>
  )
}
