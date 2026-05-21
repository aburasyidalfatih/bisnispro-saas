"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { normalizeImageUrl } from "@/lib/utils"

interface Partnership {
  id: string
  name: string
  imageUrl: string
  websiteUrl?: string | null
}

const PartnerImage = ({ src, alt }: { src: string | null | undefined, alt: string }) => {
  const [error, setError] = useState(false)
  
  const finalSrc = error || !src ? "https://schoolpro.id/logo-schoolpro.png" : src

  return (
    <img 
      src={finalSrc}
      alt={alt}
      className="absolute inset-0 w-full h-full object-contain"
      onError={() => setError(true)}
    />
  )
}

export function PartnershipsSection({ partnerships }: { partnerships: Partnership[] }) {
  if (!partnerships || partnerships.length === 0) return null

  // Duplicate the array enough times to guarantee the track width is larger than any screen width
  // This is critical for the seamless CSS marquee math to work (Track Width >= Screen Width)
  const displayPartners = Array.from({ length: Math.max(10, Math.ceil(24 / partnerships.length)) }).flatMap(() => partnerships)

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

      <div className="relative flex overflow-hidden group">
        <div className="flex animate-marquee gap-8 md:gap-16 shrink-0 items-center pr-8 md:pr-16 py-4">
          {displayPartners.map((partner, i) => (
            <div key={`${partner.id}-${i}`} className="flex-shrink-0 w-[120px] md:w-[160px] grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all duration-300">
              {partner.websiteUrl ? (
                <Link href={partner.websiteUrl} target="_blank" rel="noopener noreferrer" className="block w-full h-full">
                  <div className="relative aspect-video w-full">
                    <PartnerImage src={normalizeImageUrl(partner.imageUrl) || partner.imageUrl} alt={partner.name} />
                  </div>
                </Link>
              ) : (
                <div className="relative aspect-video w-full">
                  <PartnerImage src={normalizeImageUrl(partner.imageUrl) || partner.imageUrl} alt={partner.name} />
                </div>
              )}
            </div>
          ))}
        </div>
        
        <div aria-hidden="true" className="flex animate-marquee gap-8 md:gap-16 shrink-0 items-center pr-8 md:pr-16 py-4">
          {displayPartners.map((partner, i) => (
            <div key={`${partner.id}-clone-${i}`} className="flex-shrink-0 w-[120px] md:w-[160px] grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all duration-300">
              {partner.websiteUrl ? (
                <Link href={partner.websiteUrl} target="_blank" rel="noopener noreferrer" className="block w-full h-full">
                  <div className="relative aspect-video w-full">
                    <PartnerImage src={normalizeImageUrl(partner.imageUrl) || partner.imageUrl} alt={partner.name} />
                  </div>
                </Link>
              ) : (
                <div className="relative aspect-video w-full">
                  <PartnerImage src={normalizeImageUrl(partner.imageUrl) || partner.imageUrl} alt={partner.name} />
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
