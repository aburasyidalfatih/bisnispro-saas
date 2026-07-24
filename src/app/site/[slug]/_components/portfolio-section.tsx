import Link from "next/link"
import { ArrowRight, Trophy, ExternalLink, Briefcase, ChevronRight } from "lucide-react"
import { format } from "date-fns"
import { id as idLocale } from "date-fns/locale"
import Image from "next/image"
import { normalizeImageUrl } from "@/lib/utils"

interface PortfolioItem {
  id: string
  title: string
  slug?: string
  description?: string | null
  date: string | Date
  clientName?: string
  category?: string
  imageUrl?: string | null
}

interface PortfolioSectionProps {
  achievements: PortfolioItem[]
  basePath?: string
  labels?: any
}

export function PortfolioSection({ achievements, labels, basePath = "" }: PortfolioSectionProps) {
  if (!achievements || achievements.length === 0) return null

  const displayed = achievements.slice(0, 6)
  const l = labels?.widget || {}

  return (
    <section className="py-20 md:py-32 bg-secondary/30 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-primary/5 blur-[80px] pointer-events-none translate-x-1/3 -translate-y-1/3" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] rounded-full bg-accent/5 blur-[100px] pointer-events-none -translate-x-1/3 translate-y-1/3" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-16">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-background border border-primary/20 text-primary text-xs font-bold tracking-widest uppercase mb-6 shadow-sm">
              <Briefcase className="h-4 w-4" />
              <span>{l.achievements || "Portofolio & Studi Kasus"}</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-foreground via-foreground/90 to-foreground/60">
              Karya Terbaik Kami
            </h2>
            <p className="text-muted-foreground text-base md:text-lg">
              Temukan bagaimana kami membantu klien mencapai target mereka melalui solusi inovatif dan eksekusi presisi tinggi.
            </p>
          </div>
          <Link href={`${basePath}/portofolio`} className="hidden md:inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/50 hover:bg-white border shadow-sm text-sm font-semibold text-foreground transition-all duration-300 group">
            Eksplorasi Karya <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Portfolio Masonry-like Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {displayed.map((item, idx) => {
            const isFeatured = idx === 0 || idx === 3;
            
            return (
              <Link
                key={item.id}
                href={`${basePath}/portofolio/${item.slug || item.id}`}
                className={`group relative rounded-[2rem] bg-background border shadow-sm hover:shadow-2xl overflow-hidden transition-all duration-500 hover:-translate-y-2 flex flex-col ${isFeatured ? 'md:col-span-2 lg:col-span-2' : ''}`}
              >
                <div className={`relative w-full ${isFeatured ? 'h-64 md:h-80' : 'h-64'} overflow-hidden bg-muted`}>
                  {item.imageUrl ? (
                    <>
                      <Image 
                        src={normalizeImageUrl(item.imageUrl)!} 
                        alt={item.title} 
                        fill 
                        className="object-cover group-hover:scale-105 transition-transform duration-700 ease-in-out" 
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-500" />
                    </>
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center relative">
                      <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-foreground via-background to-background" />
                      <Briefcase className="h-16 w-16 text-muted-foreground/30 group-hover:scale-110 transition-transform duration-500" />
                    </div>
                  )}
                  
                  {/* Category Badge */}
                  {item.category && (
                    <div className="absolute top-6 left-6 px-4 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-white text-xs font-semibold tracking-wide">
                      {item.category}
                    </div>
                  )}
                  
                  {/* Title overlay for non-featured items */}
                  <div className="absolute bottom-6 left-6 right-6">
                    <h3 className="font-bold text-xl md:text-2xl text-white mb-2 line-clamp-2">
                      {item.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-white/80">
                      {item.clientName && (
                        <span className="font-medium">{item.clientName}</span>
                      )}
                      {item.clientName && <span className="w-1 h-1 rounded-full bg-white/50" />}
                      <span>{format(new Date(item.date), "MMM yyyy", { locale: idLocale })}</span>
                    </div>
                  </div>
                </div>
                
                {/* Extra content area for featured items to balance grid */}
                {isFeatured && item.description && (
                  <div className="p-8 bg-background flex-1 flex flex-col justify-between">
                    <p className="text-muted-foreground line-clamp-3 mb-6 leading-relaxed">
                      {item.description.replace(/<[^>]*>?/gm, '')}
                    </p>
                    <div className="inline-flex items-center gap-2 text-sm font-semibold text-primary group-hover:translate-x-2 transition-transform duration-300">
                      Baca Studi Kasus <ArrowRight className="h-4 w-4" />
                    </div>
                  </div>
                )}
                
                {/* Floating Action Button */}
                <div className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                  <ExternalLink className="h-4 w-4 text-white" />
                </div>
              </Link>
            )
          })}
        </div>

        <div className="mt-12 text-center md:hidden">
          <Link href={`${basePath}/portofolio`} className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-white border shadow-sm hover:shadow-md text-sm font-bold text-foreground transition-all">
            Lihat Semua Karya <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}
