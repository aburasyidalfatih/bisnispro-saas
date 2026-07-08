"use client"

import { useEffect, useRef, useState } from "react"
import { DynamicIcon } from "@/components/ui/icon-picker"

interface Stat { value: string; label: string; icon: string }

function AnimatedCounter({ value, label }: { value: string; label?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  
  // Extract number and suffix (e.g. "100+" -> num: 100, suffix: "+")
  const numericMatch = value.match(/(\d+)/)
  const numValue = numericMatch ? parseInt(numericMatch[0], 10) : 0
  const suffix = value.replace(/\d/g, "")
  
  // Use grouping: false as requested by user to remove dot separators
  const formatNum = (n: number) => Intl.NumberFormat("id-ID", { useGrouping: false }).format(n)

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
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-20 -mt-16 md:-mt-20 mb-4 md:mb-8">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 lg:gap-8">
        {stats.map((stat, i) => (
          <div
            key={i}
            className="group relative flex flex-row sm:flex-col items-center justify-start sm:justify-center p-3.5 sm:p-8 text-left sm:text-center rounded-2xl sm:rounded-[2rem] gap-3 sm:gap-0 transition-all duration-500 hover:-translate-y-2 shadow-md hover:shadow-2xl hover:shadow-primary/20 bg-background border border-border/50 dark:border-white/10"
          >
            {/* Ambient Background Glow */}
            <div className="absolute -inset-0.5 bg-gradient-to-br from-primary/30 to-primary/0 opacity-0 group-hover:opacity-100 blur-2xl transition-opacity duration-700 pointer-events-none" />
            
            {/* Card inner glass effect */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/80 to-white/40 dark:from-white/10 dark:to-white/0 rounded-2xl sm:rounded-[2rem] pointer-events-none" />
            
            {/* Crisp inner border for 3D feel */}
            <div className="absolute inset-px rounded-[15px] sm:rounded-[31px] bg-gradient-to-b from-white/60 to-transparent dark:from-white/20 dark:to-transparent pointer-events-none opacity-50" />
            
            {stat.icon && (
               <div className="flex h-11 w-11 sm:h-16 sm:w-16 items-center justify-center rounded-xl sm:rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground relative z-10 shadow-lg shadow-primary/30 transform group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500 overflow-hidden shrink-0 sm:mb-5">
                 <DynamicIcon name={stat.icon} className="h-5 w-5 sm:h-7 sm:w-7 relative z-10" />
                 {/* Diagonal shine across icon */}
                 <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] pointer-events-none" />
               </div>
             )}
             
             <div className="flex flex-col relative z-10 sm:items-center min-w-0">
               <p className="text-xl sm:text-5xl md:text-6xl font-black text-foreground sm:mb-2 flex items-center tracking-tighter bg-clip-text text-transparent bg-gradient-to-br from-foreground to-foreground/70 pb-0.5 sm:pb-2 pt-0.5 sm:pt-1">
                 <AnimatedCounter value={stat.value} label={stat.label} />
               </p>
               <p className="text-[9px] sm:text-xs md:text-sm font-bold text-muted-foreground uppercase tracking-wider sm:tracking-widest group-hover:text-primary transition-colors leading-tight truncate sm:normal-case">
                 {stat.label}
               </p>
             </div>
          </div>
        ))}
      </div>
    </div>
  )
}
