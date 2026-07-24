"use client"
import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { ChevronLeft, ChevronRight, Quote, GraduationCap, ArrowRight } from "lucide-react"
import Image from "next/image"
import { normalizeImageUrl } from "@/lib/utils"

interface KlienMember {
  id: string
  name: string
  graduationYear: number
  currentStatus: string
  institutionName?: string | null
  testimonial?: string | null
  imageUrl?: string | null
  instagram?: string | null
  facebook?: string | null
  tiktok?: string | null
  youtube?: string | null
  linkedin?: string | null
  twitter?: string | null
  pinterest?: string | null
}

interface ClientTestimonialsProps {
  klien: KlienMember[]
  basePath?: string
  labels?: Record<string, string>
}

const STATUS_LABELS: Record<string, string> = {
  KULIAH: "Kuliah",
  KERJA: "Bekerja",
  WIRAUSAHA: "Wirausaha",
  LAINNYA: "Lainnya",
}

export function ClientTestimonials({ klien, labels, basePath = "" }: ClientTestimonialsProps) {
  // Only show klien who have testimonials
  const withTestimonials = klien.filter((a) => a.testimonial && a.testimonial.trim().length > 0)
  
  const statusLabels = { ...STATUS_LABELS, ...labels }

  const [current, setCurrent] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)

  const goTo = useCallback((index: number) => {
    if (isAnimating) return
    setIsAnimating(true)
    setCurrent(index)
    setTimeout(() => setIsAnimating(false), 400)
  }, [isAnimating])

  const next = useCallback(() => {
    goTo((current + 1) % withTestimonials.length)
  }, [current, withTestimonials.length, goTo])

  const prev = useCallback(() => {
    goTo((current - 1 + withTestimonials.length) % withTestimonials.length)
  }, [current, withTestimonials.length, goTo])

  // Auto-advance every 8 seconds
  useEffect(() => {
    if (withTestimonials.length <= 1) return
    const timer = setInterval(next, 8000)
    return () => clearInterval(timer)
  }, [next, withTestimonials.length])

  const person = withTestimonials[current]



  if (withTestimonials.length === 0) return null

  return (
    <section className="py-16 md:py-20 bg-primary/5 relative overflow-hidden">
      {/* Decorative */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-primary/3 blur-3xl pointer-events-none max-w-full" />

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-12">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 text-indigo-600 text-xs font-bold tracking-wider uppercase mb-4">
              <GraduationCap className="h-3.5 w-3.5" />
              Klien
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2 bg-clip-text text-transparent bg-gradient-to-r from-foreground to-primary">
              Kata Mereka Tentang Kami
            </h2>
            <p className="text-muted-foreground text-sm md:text-base max-w-xl">
              Cerita dan pengalaman klien kami setelah menempuh pendidikan di sini.
            </p>
          </div>
          <Link href={`${basePath}/klien`} className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline whitespace-nowrap">
            Lihat Semua <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Testimonial Card */}
        <div className="relative bg-background rounded-3xl border shadow-lg p-8 md:p-12 overflow-hidden">
          {/* Large quote decoration */}
          <Quote
            className="absolute top-6 right-8 h-32 w-32 text-primary/5 -scale-x-100 pointer-events-none"
          />

          <div className="relative flex flex-col md:flex-row items-center gap-8">
            {/* Photo */}
            <div className="shrink-0">
              <div className="relative">
                <div className="absolute -inset-2 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full blur-md" />
                <div className="relative w-24 h-24 md:w-28 md:h-28 rounded-full overflow-hidden border-4 border-background shadow-xl bg-muted">
                  {person.imageUrl ? (
                    <Image
                      src={normalizeImageUrl(person.imageUrl)!}
                      alt={person.name}
                      fill
                      sizes="112px"
                      className="object-cover object-top"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                      <span className="text-3xl font-bold text-indigo-400">
                        {person.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 text-center md:text-left">
              <blockquote className="text-base md:text-lg text-foreground leading-relaxed mb-6 italic">
                &ldquo;{person.testimonial}&rdquo;
              </blockquote>

              <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                <div>
                  <h4 className="font-bold text-foreground">{person.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    Klien {person.graduationYear}
                    {person.institutionName && ` • ${person.institutionName}`}
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-[11px] font-bold w-fit mx-auto md:mx-0">
                  {STATUS_LABELS[person.currentStatus] || person.currentStatus}
                </span>
                
                <div className="flex items-center justify-center md:justify-start gap-3 w-full md:w-auto mt-4 md:mt-0 md:ml-4 border-t border-border/50 md:border-t-0 pt-4 md:pt-0">
                  {person.instagram && (
                    <a href={person.instagram} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-primary transition-colors" title="Instagram">
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
                    </a>
                  )}
                  {person.facebook && (
                    <a href={person.facebook} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-primary transition-colors" title="Facebook">
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
                    </a>
                  )}
                  {person.youtube && (
                    <a href={person.youtube} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-primary transition-colors" title="YouTube">
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"/><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"/></svg>
                    </a>
                  )}
                  {person.tiktok && (
                    <a href={person.tiktok} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-primary transition-colors" title="TikTok">
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/></svg>
                    </a>
                  )}
                  {person.linkedin && (
                    <a href={person.linkedin} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-primary transition-colors" title="LinkedIn">
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>
                    </a>
                  )}
                  {person.twitter && (
                    <a href={person.twitter} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-primary transition-colors" title="Twitter / X">
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>
                    </a>
                  )}
                  {person.pinterest && (
                    <a href={person.pinterest} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-primary transition-colors" title="Pinterest">
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 22s-2-5.5-2-9c0-1.6 1.4-3 3-3s3 1.4 3 3c0 2.2-1.7 4-3.5 4-2 0-3.5-1.5-3.5-3.5C9 10 10.5 8 12.5 8 15 8 17 10 17 12.5 17 16 15 19.5 12 22z"/></svg>
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Navigation (only if multiple) */}
          {withTestimonials.length > 1 && (
            <div className="flex items-center justify-center gap-3 mt-8 pt-6 border-t border-border/50">
              <button
                onClick={prev}
                className="h-9 w-9 rounded-full border flex items-center justify-center hover:bg-muted transition-colors"
                aria-label="Previous testimonial"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <div className="flex items-center gap-2">
                {withTestimonials.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => goTo(i)}
                    aria-label={`Go to testimonial ${i + 1}`}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      i === current
                        ? "w-8 bg-primary"
                        : "w-2 bg-border hover:bg-muted-foreground/40"
                    }`}
                  />
                ))}
              </div>

              <button
                onClick={next}
                className="h-9 w-9 rounded-full border flex items-center justify-center hover:bg-muted transition-colors"
                aria-label="Next testimonial"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
