"use client"

import Image from "next/image"
import Link from "next/link"

interface Partnership {
  id: string
  name: string
  imageUrl: string
  websiteUrl?: string | null
}

export function PartnershipsSection({ partnerships }: { partnerships: Partnership[] }) {
  if (!partnerships || partnerships.length === 0) return null

  // Duplicate the array if it's too short to create a seamless infinite scroll effect
  const displayPartners = [...partnerships, ...partnerships, ...partnerships].slice(0, 12)

  return (
    <section className="py-12 md:py-20 bg-muted/20 border-y border-border/50 overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mb-10 text-center">
        <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-3 text-foreground">
          Kerjasama Lembaga
        </h2>
        <p className="text-muted-foreground text-sm md:text-base max-w-2xl mx-auto">
          Kami bangga dapat bekerja sama dengan berbagai institusi dan perusahaan terkemuka.
        </p>
      </div>

      <div className="relative flex overflow-x-hidden group">
        <div className="flex animate-marquee gap-8 md:gap-16 px-4 py-4 min-w-full justify-around items-center">
          {displayPartners.map((partner, i) => (
            <div key={`${partner.id}-${i}`} className="flex-shrink-0 w-[120px] md:w-[160px] grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all duration-300">
              {partner.websiteUrl ? (
                <Link href={partner.websiteUrl} target="_blank" rel="noopener noreferrer">
                  <div className="relative aspect-video w-full">
                    <Image src={partner.imageUrl} alt={partner.name} fill className="object-contain" />
                  </div>
                </Link>
              ) : (
                <div className="relative aspect-video w-full">
                  <Image src={partner.imageUrl} alt={partner.name} fill className="object-contain" />
                </div>
              )}
            </div>
          ))}
        </div>
        
        <div className="flex absolute top-0 animate-marquee2 gap-8 md:gap-16 px-4 py-4 min-w-full justify-around items-center">
          {displayPartners.map((partner, i) => (
            <div key={`${partner.id}-clone-${i}`} className="flex-shrink-0 w-[120px] md:w-[160px] grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all duration-300">
              {partner.websiteUrl ? (
                <Link href={partner.websiteUrl} target="_blank" rel="noopener noreferrer">
                  <div className="relative aspect-video w-full">
                    <Image src={partner.imageUrl} alt={partner.name} fill className="object-contain" />
                  </div>
                </Link>
              ) : (
                <div className="relative aspect-video w-full">
                  <Image src={partner.imageUrl} alt={partner.name} fill className="object-contain" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Gradient fades for the edges */}
        <div className="absolute inset-y-0 left-0 w-16 md:w-32 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none"></div>
        <div className="absolute inset-y-0 right-0 w-16 md:w-32 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none"></div>
      </div>
    </section>
  )
}
