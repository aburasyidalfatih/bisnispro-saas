"use client"
import { MessageSquareQuote, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react"
import { useRef } from "react"


export function TestimonialsSection({ testimonials }: { testimonials: any[] }) {
  const scrollRef = useRef<HTMLDivElement>(null)

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -400, behavior: 'smooth' })
    }
  }

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 400, behavior: 'smooth' })
    }
  }

  if (!testimonials || testimonials.length === 0) return null

  return (
    <section className="container mx-auto px-4 py-16">
      <div className="flex flex-col md:flex-row items-end justify-between mb-12 gap-6">
        <div className="space-y-3 max-w-3xl text-center md:text-left mx-auto md:mx-0">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm text-primary font-medium">
            <MessageSquareQuote className="h-4 w-4" />
            Kata Mereka
          </div>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            Testimoni Mitra Kami
          </h2>
          <p className="text-muted-foreground text-lg">
            Apa kata mereka yang telah merasakan langsung kemudahan menggunakan platform kami.
          </p>
        </div>
        
        {/* Navigation Buttons */}
        <div className="hidden md:flex gap-3 shrink-0">
          <button 
            onClick={scrollLeft}
            className="h-12 w-12 rounded-full border bg-white flex items-center justify-center text-gray-500 hover:text-primary hover:border-primary transition-colors hover:shadow-md"
            aria-label="Previous testimonial"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button 
            onClick={scrollRight}
            className="h-12 w-12 rounded-full border bg-white flex items-center justify-center text-gray-500 hover:text-primary hover:border-primary transition-colors hover:shadow-md"
            aria-label="Next testimonial"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </div>
      </div>

      <div 
        ref={scrollRef}
        className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide gap-6 pb-8 -mx-4 px-4 sm:mx-0 sm:px-0"
      >
        {testimonials.map((t) => {
          const tenantUrl = t.tenant?.domain ? `https://${t.tenant.domain}` : `https://${t.tenant?.slug}.schoolpro.id`;
          
          return (
            <div 
              key={t.id} 
              className="relative p-6 bg-white rounded-2xl border shadow-sm hover:shadow-md transition-shadow shrink-0 snap-center w-[85vw] sm:w-[400px] md:w-[450px] flex flex-col"
            >
              <MessageSquareQuote className="absolute top-6 right-6 h-8 w-8 text-primary/10" />
              <div className="flex items-center gap-4 mb-5">
                {t.tenant?.logo ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={t.tenant.logo} alt="Logo" className="w-12 h-12 rounded-full object-cover border shrink-0" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0">
                    {t.tenant?.name?.[0]?.toUpperCase() || t.user?.name?.[0]?.toUpperCase()}
                  </div>
                )}
                <div>
                  <h4 className="font-semibold text-gray-900 line-clamp-1">{t.user?.name}</h4>
                  <div className="text-sm text-gray-500 flex flex-wrap items-center gap-1">
                    <span className="capitalize">{t.user?.tenants?.[0]?.role ? t.user.tenants[0].role : "Admin"}</span>
                    <span>•</span>
                    <a 
                      href={tenantUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline font-medium inline-flex items-center gap-1 line-clamp-1"
                      title="Kunjungi Website Sekolah"
                    >
                      {t.tenant?.name}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              </div>
              <p className="text-gray-700 leading-relaxed italic line-clamp-6 flex-1">"{t.message}"</p>
            </div>
          )
        })}
      </div>
      
      {/* Mobile Navigation Buttons */}
      <div className="flex md:hidden justify-center gap-4 mt-2">
        <button 
          onClick={scrollLeft}
          className="h-10 w-10 rounded-full border bg-white flex items-center justify-center text-gray-500 hover:text-primary hover:border-primary transition-colors shadow-sm"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button 
          onClick={scrollRight}
          className="h-10 w-10 rounded-full border bg-white flex items-center justify-center text-gray-500 hover:text-primary hover:border-primary transition-colors shadow-sm"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </section>
  )
}
