"use client"

import Link from "next/link"
import { ArrowRight, Building2 } from "lucide-react"
import { useRouting } from "@/components/providers/routing-provider"

interface Facility {
  id: string
  name: string
  description?: string | null
  imageUrl?: string | null
}

interface FacilitiesSectionProps {
  facilities: Facility[]
}

export function FacilitiesSection({ facilities }: FacilitiesSectionProps) {
  const { resolveHref } = useRouting()

  if (!facilities || facilities.length === 0) return null

  const displayed = facilities.slice(0, 8)

  return (
    <section className="py-16 md:py-20 bg-background relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-12">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 text-xs font-bold tracking-wider uppercase mb-4">
              <Building2 className="h-3.5 w-3.5" />
              Fasilitas
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2">Fasilitas Sekolah</h2>
            <p className="text-muted-foreground text-sm md:text-base max-w-xl">
              Fasilitas modern dan lengkap untuk mendukung proses belajar mengajar yang optimal.
            </p>
          </div>
          <Link href={resolveHref("/fasilitas")} className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline whitespace-nowrap">
            Lihat Semua <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {displayed.map((facility, idx) => {
            const isLarge = idx < 2
            return (
              <Link
                key={facility.id}
                href={resolveHref("/fasilitas")}
                className={`group relative rounded-2xl overflow-hidden border bg-muted/30 transition-all duration-500 hover:shadow-xl ${
                  isLarge ? "md:col-span-1 lg:col-span-2 aspect-[16/10]" : "aspect-square"
                }`}
              >
                {facility.imageUrl ? (
                  <img src={facility.imageUrl} alt={facility.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center">
                    <Building2 className="h-12 w-12 text-emerald-200" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4 pt-12">
                  <h3 className="text-white font-bold text-sm md:text-base drop-shadow-lg line-clamp-1">{facility.name}</h3>
                  {facility.description && (
                    <p className="text-white/70 text-xs mt-1 line-clamp-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">{facility.description}</p>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
