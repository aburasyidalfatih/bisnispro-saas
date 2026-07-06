"use client"
import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { ChevronLeft, ChevronRight, Quote, GraduationCap, ArrowRight } from "lucide-react"
import Image from "next/image"
import { normalizeImageUrl } from "@/lib/utils"

interface AlumniMember {
  id: string
  name: string
  graduationYear: number
  currentStatus: string
  institutionName?: string | null
  testimonial?: string | null
  imageUrl?: string | null
}

interface AlumniTestimonialsProps {
  alumni: AlumniMember[]
  basePath?: string
  labels?: Record<string, string>
}

const STATUS_LABELS: Record<string, string> = {
  KULIAH: "Kuliah",
  KERJA: "Bekerja",
  WIRAUSAHA: "Wirausaha",
  LAINNYA: "Lainnya",
}

export function AlumniTestimonials({ alumni, labels, basePath = "" }: AlumniTestimonialsProps) {
  // Only show alumni who have testimonials
  const withTestimonials = alumni.filter((a) => a.testimonial && a.testimonial.trim().length > 0)
  
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
              Alumni
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2 bg-clip-text text-transparent bg-gradient-to-r from-foreground to-primary">
              Kata Mereka Tentang Kami
            </h2>
            <p className="text-muted-foreground text-sm md:text-base max-w-xl">
              Cerita dan pengalaman alumni kami setelah menempuh pendidikan di sini.
            </p>
          </div>
          <Link href={`${basePath}/alumni`} className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline whitespace-nowrap">
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
                    Alumni {person.graduationYear}
                    {person.institutionName && ` • ${person.institutionName}`}
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-[11px] font-bold w-fit mx-auto md:mx-0">
                  {STATUS_LABELS[person.currentStatus] || person.currentStatus}
                </span>
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
