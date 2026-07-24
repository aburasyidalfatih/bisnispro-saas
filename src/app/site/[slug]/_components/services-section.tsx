import Link from "next/link"
import { ArrowRight, Briefcase, Star, TrendingUp, Zap, Target, BarChart, ShieldCheck } from "lucide-react"
import Image from "next/image"
import { normalizeImageUrl } from "@/lib/utils"

interface ServiceItem {
  id: string
  name: string
  slug?: string
  description?: string | null
  imageUrl?: string | null
}

interface ServicesSectionProps {
  programs: ServiceItem[]
  basePath?: string
  labels?: any
}

const BUSINESS_ICONS = [Star, Briefcase, TrendingUp, Zap, Target, BarChart, ShieldCheck]

export function ServicesSection({ programs, labels, basePath = "" }: ServicesSectionProps) {
  if (!programs || programs.length === 0) return null

  const displayed = programs.slice(0, 6)
  const l = labels?.programs || {}

  return (
    <section className="py-20 md:py-32 bg-background relative overflow-hidden">
      {/* Premium Ambient Background */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-primary/10 blur-[100px] pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-[600px] h-[600px] rounded-full bg-accent/10 blur-[100px] pointer-events-none" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header - Centered Premium Look */}
        <div className="text-center max-w-3xl mx-auto mb-16 md:mb-24">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-primary/20 text-primary text-xs font-bold tracking-widest uppercase mb-6 shadow-sm backdrop-blur-md">
            <Star className="h-4 w-4" />
            <span>{l.sectionTitle || "Layanan Profesional"}</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-foreground via-foreground/80 to-primary">
            {l.sectionTitle || "Solusi Bisnis Untuk Anda"}
          </h2>
          <p className="text-muted-foreground text-base md:text-lg">
            {l.sectionSubtitle || "Kami menghadirkan rangkaian layanan terintegrasi yang dirancang khusus untuk meningkatkan efisiensi dan mempercepat pertumbuhan bisnis Anda."}
          </p>
        </div>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {displayed.map((service, idx) => {
            const Icon = BUSINESS_ICONS[idx % BUSINESS_ICONS.length]

            return (
              <Link
                key={service.id}
                href={`${basePath}/layanan/${service.slug || service.id}`}
                className="group relative rounded-[2rem] border border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-primary/20 hover:-translate-y-2"
              >
                {/* Image / Gradient Header */}
                <div className="relative h-48 md:h-56 overflow-hidden bg-muted/30">
                  {service.imageUrl ? (
                    <>
                      <Image
                        src={normalizeImageUrl(service.imageUrl)!}
                        alt={`Service: ${service.name}`}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-60 transition-opacity duration-500" />
                    </>
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/10 via-background to-accent/10 flex items-center justify-center relative overflow-hidden">
                      {/* Decorative grid pattern */}
                      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:20px_20px]" />
                      <Icon className="h-20 w-20 text-primary/40 group-hover:scale-110 group-hover:text-primary transition-all duration-500 relative z-10" />
                    </div>
                  )}
                  
                  {/* Floating Icon Badge */}
                  <div className="absolute top-6 left-6 h-12 w-12 rounded-2xl bg-background/50 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform duration-500 z-20">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                </div>

                {/* Content */}
                <div className="p-8 relative">
                  <h3 className="font-bold text-xl md:text-2xl mb-3 text-foreground group-hover:text-primary transition-colors">
                    {service.name}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed line-clamp-3 mb-6">
                    {service.description?.replace(/<[^>]*>?/gm, '') || "Layanan profesional terbaik untuk mendukung pertumbuhan dan kesuksesan bisnis Anda."}
                  </p>
                  
                  <div className="inline-flex items-center gap-2 text-sm font-semibold text-primary group-hover:translate-x-2 transition-transform duration-300">
                    Pelajari Lebih Lanjut <ArrowRight className="h-4 w-4" />
                  </div>
                </div>
              </Link>
            )
          })}
        </div>


      </div>
    </section>
  )
}
