import Image from "next/image"
import { School } from "lucide-react"
import { normalizeImageUrl } from "@/lib/utils"

interface SchoolsMarqueeProps {
  activeTenants: any[]
}

export function SchoolsMarquee({ activeTenants }: SchoolsMarqueeProps) {
  if (activeTenants.length === 0) return null

  return (
    <section className="py-8 md:py-10 border-y bg-muted/30 overflow-hidden">
      <div className="container mx-auto px-4 mb-6 text-center">
        <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Dipercaya oleh inovator pendidikan di seluruh Indonesia
        </p>
      </div>
      {/* Marquee Container */}
      <div className="relative w-full overflow-hidden flex">
        <div className="absolute left-0 top-0 bottom-0 w-16 md:w-32 z-10 bg-gradient-to-r from-background to-transparent" />
        <div className="absolute right-0 top-0 bottom-0 w-16 md:w-32 z-10 bg-gradient-to-l from-background to-transparent" />
        <div
          className="animate-marquee flex gap-8 md:gap-12 pl-8 md:pl-12 items-center"
          style={{ animationDuration: `${Math.max(activeTenants.length * 2, 10)}s` }}
        >
          {/* Render items 4 times to ensure seamless loop for marquee */}
          {[...activeTenants, ...activeTenants, ...activeTenants, ...activeTenants].map((tenant, idx) => {
            let city = "Indonesia"
            if (tenant.address) {
              const kabMatch = tenant.address.match(/(Kota|Kabupaten|Kab\.)\s+([A-Za-z\- ]+)/i)
              if (kabMatch) {
                city = kabMatch[0].trim()
              } else {
                const kecMatch = tenant.address.match(/(Kecamatan|Kec\.)\s+([A-Za-z\- ]+)/i)
                if (kecMatch) {
                  city = kecMatch[0].trim()
                } else {
                  const parts = tenant.address.split(",")
                  const last = parts[parts.length - 1].trim()
                  city = last.length > 25 ? last.substring(0, 25) + "..." : last
                }
              }
            }
            return (
              <div
                key={`${tenant.id}-${idx}`}
                className="flex items-center gap-3 shrink-0 opacity-70 hover:opacity-100 transition-opacity grayscale hover:grayscale-0 cursor-default"
              >
                {tenant.logo ? (
                  <Image
                    src={normalizeImageUrl(tenant.logo) || tenant.logo}
                    alt={tenant.name}
                    width={48}
                    height={48}
                    className="h-10 w-10 md:h-12 md:w-12 object-contain rounded-full border bg-white p-1"
                  />
                ) : (
                  <div className="h-10 w-10 md:h-12 md:w-12 rounded-full border bg-muted flex items-center justify-center shrink-0">
                    <School className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}
                <div className="flex flex-col text-left">
                  <span className="text-sm md:text-base font-semibold leading-tight">{tenant.name}</span>
                  <span className="text-[10px] md:text-xs text-muted-foreground font-medium">{city}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
