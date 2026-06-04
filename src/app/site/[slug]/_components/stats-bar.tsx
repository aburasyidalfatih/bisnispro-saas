"use client"

import { useEffect, useRef, useState } from "react"

interface Stat { value: string; label: string; icon: string }

function AnimatedCounter({ value, label }: { value: string; label?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  
  // Extract number and suffix (e.g. "100+" -> num: 100, suffix: "+")
  const numericMatch = value.match(/(\d+)/)
  const numValue = numericMatch ? parseInt(numericMatch[0], 10) : 0
  const suffix = value.replace(/\d/g, "")
  
  const isYear = label?.toLowerCase().includes("tahun")
  const formatNum = (n: number) => Intl.NumberFormat("id-ID", { useGrouping: !isYear }).format(n)

  const [displayValue, setDisplayValue] = useState(numValue === 0 ? value : `0${suffix}`)

  useEffect(() => {
    if (numValue === 0 || !ref.current) return

    const element = ref.current
    let hasAnimated = false

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated) {
          hasAnimated = true
          let startTimestamp: number | null = null
          const duration = 2000 // 2 seconds

          const step = (timestamp: number) => {
            if (!startTimestamp) startTimestamp = timestamp
            const progress = Math.min((timestamp - startTimestamp) / duration, 1)
            
            // Ease-out cubic function for smooth deceleration
            const easeOutProgress = 1 - Math.pow(1 - progress, 3)
            const currentCount = Math.floor(easeOutProgress * numValue)
            
            setDisplayValue(`${formatNum(currentCount)}${suffix}`)

            if (progress < 1) {
              window.requestAnimationFrame(step)
            } else {
              setDisplayValue(`${formatNum(numValue)}${suffix}`)
            }
          }

          window.requestAnimationFrame(step)
          observer.unobserve(element)
        }
      },
      { threshold: 0.1, rootMargin: "-50px" }
    )

    observer.observe(element)

    return () => observer.disconnect()
  }, [numValue, suffix])

  return <span ref={ref}>{displayValue}</span>
}

export function StatsBar({ stats }: { stats: Stat[] }) {
  if (!stats || stats.length === 0) return null

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 relative z-20 -mt-20 md:-mt-24 mb-16">
      <div 
        className="grid grid-cols-2 lg:grid-cols-4 overflow-hidden rounded-2xl border border-white/20 backdrop-blur-xl shadow-2xl relative"
        style={{ background: "linear-gradient(135deg, hsl(var(--primary)/0.95) 0%, hsl(var(--primary)/0.8) 100%)" }}
      >
        {/* Subtle inner glow */}
        <div className="absolute inset-0 bg-gradient-to-t from-white/5 to-transparent pointer-events-none" />

        {stats.map((stat, i) => (
          <div
            key={i}
            className={`flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 text-center relative group overflow-hidden ${
              i < stats.length - 1 ? "lg:border-r border-white/10" : ""
            } ${i % 2 === 0 ? "border-r lg:border-r-0 border-white/10" : ""} ${
              i < 2 ? "border-b lg:border-b-0 border-white/10" : ""
            }`}
          >
             {/* Hover shine effect */}
             <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-500" />
             
             <p className="text-4xl md:text-5xl font-black text-white mb-2 drop-shadow-md relative z-10 flex items-center justify-center">
               <AnimatedCounter value={stat.value} label={stat.label} />
             </p>
             <p className="text-[10px] sm:text-xs md:text-sm font-bold text-white/80 uppercase tracking-widest relative z-10">
               {stat.label}
             </p>
          </div>
        ))}
      </div>
    </div>
  )
}
