"use client"

import { Quote, ChevronDown, ChevronUp } from "lucide-react"
import Image from "next/image"
import { useState } from "react"
import { cn, normalizeImageUrl } from "@/lib/utils"
import DOMPurify from "isomorphic-dompurify"

interface FounderWelcomeProps {
  tenantName: string
  settings?: any
  staff?: any[]
}

export function FounderWelcome({ tenantName, settings, staff = [] }: FounderWelcomeProps) {
  const principalStaff = staff.find((s: any) => s.role && (s.role.toLowerCase().includes("kepala") || s.role.toLowerCase().includes("pimpinan") || s.role.toLowerCase().includes("direktur") || s.role.toLowerCase().includes("ketua")))

  const principalName = settings?.principalName || (principalStaff ? principalStaff.name : "Nama Pimpinan")
  const principalTitle = settings?.principalTitle || (principalStaff ? principalStaff.role : "Pimpinan Bisnis")
  const rawPrincipalImage = settings?.principalImage || (principalStaff ? (principalStaff.imageUrl || "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=2076") : "/principal_portrait.png")
  const principalImage = normalizeImageUrl(rawPrincipalImage) || rawPrincipalImage
  const principalMessage = settings?.principalMessage || `Puji syukur ke hadirat Tuhan YME atas segala rahmat dan karunia-Nya. Selamat datang di website resmi ${tenantName}. Website ini kami hadirkan sebagai sarana informasi dan komunikasi antara perusahaan dengan orang tua, pelanggan, serta masyarakat luas.\n\nMelalui media ini, kami berharap seluruh informasi mengenai kegiatan, portofolio, serta program bisnis dapat tersampaikan secara transparan, cepat, dan akurat. Kami berkomitmen untuk terus meningkatkan kualitas layanan dan mencetak generasi penerus bangsa yang unggul dan berkarakter.`
  const principalBadgeYear = settings?.principalBadgeYear || "2015"

  const paragraphs = principalMessage.split("\n").filter((p: string) => p.trim() !== "")
  const [isExpanded, setIsExpanded] = useState(false)
  const isHtml = /<\/?[a-z][\s\S]*>/i.test(principalMessage)
  const isLongText = principalMessage.length > 300

  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-background to-secondary/10 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 rounded-full bg-primary/5 blur-3xl" />
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-accent/10 blur-3xl" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-[1fr_2fr] gap-12 lg:gap-16 items-center">
          
          {/* Left Column - Image & Profile */}
          <div className="relative mx-auto lg:mx-0 max-w-[280px] w-full flex flex-col items-center max-w-full">
            
            {/* Image Container */}
            <div className="relative w-full z-10">
              {/* Subtle decorative frame behind image */}
              <div className="absolute -inset-4 bg-gradient-to-tr from-primary/20 to-accent/20 rounded-[2.5rem] transform rotate-3 scale-105 opacity-50 blur-sm" />
              <div className="absolute inset-0 bg-gradient-to-tr from-primary to-accent rounded-3xl transform -rotate-2 scale-105 opacity-10" />
              
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-background bg-background aspect-[4/5] group">
                <Image 
                  src={principalImage} 
                  alt={principalName} 
                  fill
                  className="object-cover object-top group-hover:scale-110 transition-transform duration-700"
                  sizes="(max-width: 1024px) 280px, 320px"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60 group-hover:opacity-30 transition-opacity duration-500" />
              </div>
              
              {/* Floating badge */}
              <div className="absolute -bottom-5 -right-5 bg-background rounded-2xl p-3 shadow-xl border flex items-center gap-3 z-20 hover:-translate-y-1 transition-transform duration-300">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white shadow-inner">
                  <Quote size={18} className="fill-white/20" />
                </div>
                <div className="pr-2">
                  <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Berdedikasi</p>
                  <p className="text-xs font-bold text-foreground">Sejak {principalBadgeYear}</p>
                </div>
              </div>
            </div>

            {/* Premium Name & Title Plate */}
            <div className="mt-10 w-full relative z-0">
              <div className="bg-background/60 backdrop-blur-xl border border-border/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl p-5 relative overflow-hidden group hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300 text-center">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
                
                <h3 className="text-lg md:text-xl font-extrabold text-foreground tracking-tight mb-1.5">{principalName}</h3>
                
                <div className="flex items-center justify-center gap-3">
                  <div className="h-px w-8 bg-gradient-to-r from-transparent to-primary/50" />
                  <p className="text-primary font-semibold text-[11px] md:text-xs tracking-[0.15em] uppercase">{principalTitle}</p>
                  <div className="h-px w-8 bg-gradient-to-l from-transparent to-primary/50" />
                </div>
              </div>
            </div>

          </div>

          {/* Right Column - Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <span className="inline-block text-accent font-bold tracking-widest text-sm uppercase">
                Welcome Section
              </span>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-primary">
                Sambutan {principalTitle}
              </h2>
              {/* Decorative Line */}
              <div className="h-1.5 w-24 bg-gradient-to-r from-accent to-primary rounded-full" />
            </div>

            <div 
              className={cn(
                "relative transition-all duration-500 ease-in-out",
                !isExpanded && isLongText ? "max-h-[320px] overflow-hidden" : "max-h-[2000px]"
              )}
              style={!isExpanded && isLongText ? { maskImage: 'linear-gradient(to bottom, black 60%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to bottom, black 60%, transparent 100%)' } : {}}
            >
              <Quote size={64} className="absolute -top-6 -left-8 text-primary/5 -z-10 transform -scale-x-100" />
              
              <div className="pb-4 prose prose-p:leading-relaxed prose-headings:text-foreground prose-a:text-primary max-w-none text-muted-foreground text-base md:text-lg">
                {isHtml ? (
                  <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(principalMessage) }} />
                ) : (
                  <div className="space-y-6">
                    {paragraphs.map((p: string, idx: number) => (
                      <p key={idx}>{p}</p>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {isLongText && (
              <div className="pt-2">
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="inline-flex items-center gap-1.5 text-primary font-bold hover:text-primary/80 transition-colors"
                >
                  {isExpanded ? (
                    <>Sembunyikan <ChevronUp className="h-4 w-4" /></>
                  ) : (
                    <>Baca Selengkapnya <ChevronDown className="h-4 w-4" /></>
                  )}
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </section>
  )
}
