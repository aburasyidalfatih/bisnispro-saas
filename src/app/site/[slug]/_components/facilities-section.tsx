"use client"

import Link from "next/link"
import { ArrowRight, Building2 } from "lucide-react"
import { useRouting } from "@/components/providers/routing-provider"
import Image from "next/image"
import { normalizeImageUrl } from "@/lib/utils"

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

  const displayed = facilities.slice(0, 6)

  return (
    <section className="py-16 md:py-20 bg-secondary/10 relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-12">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 text-xs font-bold tracking-wider uppercase mb-4">
              <Building2 className="h-3.5 w-3.5" />
              Fasilitas
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2 bg-clip-text text-transparent bg-gradient-to-r from-foreground to-primary">Fasilitas Sekolah</h2>
            <p className="text-muted-foreground text-sm md:text-base max-w-xl">
              Fasilitas modern dan lengkap untuk mendukung proses belajar mengajar yang optimal.
            </p>
          </div>
          <Link href={resolveHref("/fasilitas")} className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline whitespace-nowrap">
            Lihat Semua <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
          {displayed.map((facility, idx) => {
            // Asymmetric spans that sum to exactly 6 per row:
            // Item 0: span 4
            // Item 1: span 2
            // Row 1 = 4 + 2 = 6 (Full)
            // Item 2: span 2
            // Item 3: span 2
            // Item 4: span 2
            // Row 2 = 2 + 2 + 2 = 6 (Full)
            // Item 5: span 6 (Full width footer banner card)
            // Row 3 = 6 (Full)
            
            const spanClass = idx === 0
              ? "md:col-span-4 aspect-[16/10]"
              : idx === 1
                ? "md:col-span-2 aspect-[16/20] md:row-span-1"
                : idx === 5
                  ? "md:col-span-6 aspect-[21/6]"
                  : "md:col-span-2 aspect-square"

            return (
              <Link
                key={facility.id}
                href={resolveHref(`/fasilitas/${facility.id}`)}
                className={`group relative rounded-[2rem] overflow-hidden border border-border/40 bg-muted/30 transition-all duration-700 hover:shadow-2xl hover:-translate-y-1.5 ${spanClass}`}
              >
                {facility.imageUrl ? (
                  <Image 
                    src={normalizeImageUrl(facility.imageUrl)!} 
                    alt={`Fasilitas: ${facility.name}`} 
                    fill 
                    className="object-cover group-hover:scale-110 transition-transform duration-1000" 
                    sizes="(max-width: 768px) 100vw, 50vw" 
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center">
                    <Building2 className="h-16 w-16 text-indigo-200" />
                  </div>
                )}
                {/* Premium Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/30 to-transparent opacity-80 group-hover:opacity-95 transition-all duration-500" />
                <div className="absolute inset-0 bg-primary/5 mix-blend-overlay opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <div className="absolute inset-x-0 bottom-0 p-6 md:p-8 pt-16 flex flex-col justify-end text-white">
                  <span className="self-start px-2.5 py-1 mb-3 backdrop-blur-md bg-white/10 text-white rounded-full text-[8px] font-bold uppercase tracking-widest border border-white/15 shadow-sm">
                    Fasilitas Sekolah
                  </span>
                  <h3 className="text-lg md:text-xl lg:text-2xl font-black drop-shadow-md leading-tight group-hover:text-primary-foreground transition-colors">{facility.name}</h3>
                  {facility.description && (
                    <p className="text-white/80 text-xs mt-2 line-clamp-1 opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-2 group-hover:translate-y-0">
                      {facility.description.replace(/<[^>]*>?/gm, '')}
                    </p>
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
