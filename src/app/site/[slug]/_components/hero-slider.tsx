"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import Link from "next/link"
import { ChevronLeft, ChevronRight, Play } from "lucide-react"
import { useRouting } from "@/components/providers/routing-provider"
import Image from "next/image"
import { normalizeImageUrl } from "@/lib/utils"

interface Slide {
  title: string
  subtitle: string
  description: string
  image?: string
  cta?: { label: string; href: string } | null
  ctaSecondary?: { label: string; href: string } | null
}

interface HeroSliderProps {
  slides: Slide[]
}

const AUTO_INTERVAL = 6000
const TRANSITION_MS = 600

export function HeroSlider({ slides }: HeroSliderProps) {
  const { resolveHref } = useRouting()
  const [current, setCurrent] = useState(0)
  const [prev, setPrev]       = useState<number | null>(null)
  const [animating, setAnimating] = useState(false)
  const [direction, setDirection] = useState<"next" | "prev">("next")
  const [textKey, setTextKey] = useState(0) // forces text re-mount → re-animation

  // Swipe handlers
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)

  const transitionTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const autoTimer       = useRef<ReturnType<typeof setInterval> | null>(null)
  const isSingle        = slides.length <= 1

  const goTo = useCallback(
    (index: number, dir: "next" | "prev") => {
      if (animating) return
      setDirection(dir)
      setPrev(current)
      setAnimating(true)
      setCurrent(index)
      setTextKey((k) => k + 1)

      if (transitionTimer.current) clearTimeout(transitionTimer.current)
      transitionTimer.current = setTimeout(() => {
        setPrev(null)
        setAnimating(false)
      }, TRANSITION_MS)
    },
    [animating, current]
  )

  // Auto-slide — restart whenever `current` changes so timing is fresh
  useEffect(() => {
    if (isSingle) return
    if (autoTimer.current) clearInterval(autoTimer.current)
    autoTimer.current = setInterval(() => {
      setCurrent((c) => {
        const next = (c + 1) % slides.length
        setDirection("next")
        setPrev(c)
        setAnimating(true)
        setTextKey((k) => k + 1)
        if (transitionTimer.current) clearTimeout(transitionTimer.current)
        transitionTimer.current = setTimeout(() => {
          setPrev(null)
          setAnimating(false)
        }, TRANSITION_MS)
        return next
      })
    }, AUTO_INTERVAL)
    return () => { if (autoTimer.current) clearInterval(autoTimer.current) }
  }, [slides.length, isSingle])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autoTimer.current) clearInterval(autoTimer.current)
      if (transitionTimer.current) clearTimeout(transitionTimer.current)
    }
  }, [])

  const slide     = slides[current]
  const prevSlide = prev !== null ? slides[prev] : null

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const onTouchEndHandler = () => {
    if (!touchStart || !touchEnd) return
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > 50
    const isRightSwipe = distance < -50

    if (isLeftSwipe) {
      goTo((current + 1) % slides.length, "next")
    } else if (isRightSwipe) {
      goTo((current - 1 + slides.length) % slides.length, "prev")
    }
  }

  return (
    <section 
      className="relative w-full overflow-hidden min-h-[55vh] sm:min-h-[80vh]"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEndHandler}
    >

      {/* ── Background layers ── */}
      {prevSlide && (
        <div
          key={`bg-prev-${prev}`}
          className="absolute inset-0 z-10"
          style={{
            animation: `${direction === "next" ? "bgExitLeft" : "bgExitRight"} ${TRANSITION_MS}ms ease forwards`,
          }}
        >
          <SlideBackground slide={prevSlide} isPriority={prev === 0} />
        </div>
      )}
      <div
        key={`bg-curr-${current}`}
        className="absolute inset-0 z-20"
        style={{
          animation: animating
            ? `${direction === "next" ? "bgEnterRight" : "bgEnterLeft"} ${TRANSITION_MS}ms ease forwards`
            : "none",
        }}
      >
        <SlideBackground slide={slide} isPriority={current === 0} />
      </div>

      {/* ── Text + CTA content ── */}
      <div className="relative z-30 flex items-center min-h-[55vh] sm:min-h-[80vh] pb-12 sm:pb-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full py-20">
          {/* key forces remount → re-trigger CSS animations */}
          <div key={textKey}>

            {/* Subtitle */}
            {slide.subtitle && (
              <div className="flex items-center gap-3 mb-3" style={{ animation: "textFadeUp 0.5s 0.1s ease both" }}>
                <div className="h-[2px] w-8 bg-amber-400 shrink-0" />
                <p className="text-[10px] sm:text-sm font-bold uppercase tracking-[0.2em] sm:tracking-[0.25em] text-amber-400 drop-shadow-md break-words">
                  {slide.subtitle}
                </p>
              </div>
            )}

            {/* Title */}
            {slide.title && (
              <h1
                className="font-black leading-[1.2] text-white mb-3 sm:mb-4 drop-shadow-lg tracking-tight break-words"
                style={{
                  fontSize: "clamp(1.4rem, 5vw, 3.5rem)",
                  animation: "textFadeUp 0.55s 0.2s ease both",
                }}
              >
                {slide.title.split("\\n").map((line, i, arr) =>
                  i === arr.length - 1 ? (
                    <span key={i} className="block text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-500">
                      {line}
                    </span>
                  ) : (
                    <span key={i} className="block">{line}</span>
                  )
                )}
              </h1>
            )}

            {/* Description */}
            {slide.description && (
              <p
                className="text-[11px] sm:text-base text-white/80 leading-relaxed mb-6 sm:mb-8 max-w-lg font-medium drop-shadow"
                style={{ animation: "textFadeUp 0.6s 0.3s ease both" }}
              >
                {slide.description}
              </p>
            )}

            {/* CTAs */}
            {(slide.cta || slide.ctaSecondary) && (
              <div className="flex flex-wrap gap-4" style={{ animation: "textFadeUp 0.65s 0.4s ease both" }}>
                {slide.cta && (
                  <Link
                    href={slide.cta.href.startsWith("http") ? slide.cta.href : resolveHref(slide.cta.href)}
                    className="group/btn relative inline-flex items-center gap-2 px-5 py-2.5 sm:px-7 sm:py-3.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold text-white overflow-hidden transition-all hover:scale-105"
                    style={{ background: "hsl(var(--primary))", boxShadow: "0 10px 25px -5px hsl(var(--primary)/0.5)" }}
                  >
                    <span className="absolute inset-0 rounded-lg opacity-30 bg-gradient-to-b from-transparent via-transparent to-black" />
                    <span className="relative">{slide.cta.label}</span>
                    <ChevronRight className="relative h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                  </Link>
                )}
                {slide.ctaSecondary && (
                  <Link
                    href={slide.ctaSecondary.href.startsWith("http") ? slide.ctaSecondary.href : resolveHref(slide.ctaSecondary.href)}
                    className="inline-flex items-center gap-3 px-5 py-2.5 sm:px-7 sm:py-3.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold border border-white/30 bg-white/5 backdrop-blur-md text-white hover:bg-white/20 hover:border-white/50 transition-all shadow-xl"
                  >
                    <div className="flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-full bg-white text-black">
                      <Play className="h-2 w-2 sm:h-3 sm:w-3 fill-black" />
                    </div>
                    {slide.ctaSecondary.label}
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Navigation Arrows ── */}
      {!isSingle && (
        <>
          <button
            onClick={() => goTo((current - 1 + slides.length) % slides.length, "prev")}
            className="hidden md:flex absolute left-16 top-1/2 -translate-y-1/2 z-40 h-12 w-12 items-center justify-center rounded-full border border-white/25 bg-black/30 backdrop-blur-md text-white hover:bg-white hover:text-black transition-all duration-300 hover:scale-110 shadow-lg"
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={() => goTo((current + 1) % slides.length, "next")}
            className="hidden md:flex absolute right-16 top-1/2 -translate-y-1/2 z-40 h-12 w-12 items-center justify-center rounded-full border border-white/25 bg-black/30 backdrop-blur-md text-white hover:bg-white hover:text-black transition-all duration-300 hover:scale-110 shadow-lg"
            aria-label="Next slide"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}

      {/* ── Dot Indicators ── */}
      {!isSingle && (
        <div className="absolute bottom-36 md:bottom-28 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2.5">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i, i > current ? "next" : "prev")}
              aria-label={`Go to slide ${i + 1}`}
              style={{ width: 36, height: 16, display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              <span
                style={{
                  display: "block",
                  borderRadius: 9999,
                  width: i === current ? 32 : 10,
                  height: 10,
                  background: i === current ? "hsl(45, 95%, 60%)" : "rgba(255,255,255,0.4)",
                  boxShadow: i === current ? "0 0 12px 3px rgba(251,191,36,0.7)" : "none",
                  transition: "all 0.4s ease",
                }}
              />
            </button>
          ))}
        </div>
      )}

      {/* ── Keyframes ── */}
      <style>{`
        @keyframes bgEnterRight {
          from { opacity: 0; transform: translateX(60px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes bgEnterLeft {
          from { opacity: 0; transform: translateX(-60px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes bgExitLeft {
          from { opacity: 1; transform: translateX(0); }
          to   { opacity: 0; transform: translateX(-60px); }
        }
        @keyframes bgExitRight {
          from { opacity: 1; transform: translateX(0); }
          to   { opacity: 0; transform: translateX(60px); }
        }
        @keyframes textFadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes kenburns {
          from { transform: scale(1.04) translate(0, 0); }
          to   { transform: scale(1.10) translate(-1%, -1%); }
        }
      `}</style>
    </section>
  )
}

function SlideBackground({ slide, isPriority }: { slide: Slide, isPriority?: boolean }) {
  const imageUrl = normalizeImageUrl(slide.image) || slide.image
  return (
    <div className="absolute inset-0">
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={slide.title || "Hero Image"}
          fill
          priority={isPriority}
          sizes="100vw"
          quality={85}
          className="object-cover object-center"
          style={{ animation: "kenburns 20s ease-in-out infinite alternate" }}
        />
      ) : (
        <div
          className="w-full h-full"
          style={{
            background:
              "linear-gradient(135deg, hsl(var(--primary)/0.9) 0%, hsl(var(--primary)/0.6) 40%, hsl(var(--primary)/0.3) 100%)",
          }}
        />
      )}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to right, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.5) 50%, rgba(0,0,0,0.15) 100%)",
        }}
      />
    </div>
  )
}
