"use client"

import { useEffect, useRef } from "react"
import { useInView, useMotionValue, useSpring } from "framer-motion"

interface Stat { value: string; label: string; icon: string }

function AnimatedCounter({ value }: { value: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  
  // Extract number and suffix (e.g. "100+" -> num: 100, suffix: "+")
  const numericMatch = value.match(/(\d+)/)
  const numValue = numericMatch ? parseInt(numericMatch[0], 10) : 0
  const suffix = value.replace(/\d/g, "")
  
  const inView = useInView(ref, { once: true, margin: "-50px" })
  const motionValue = useMotionValue(0)
  const springValue = useSpring(motionValue, {
    damping: 50,
    stiffness: 100,
    duration: 2000, // 2 seconds
  })
  
  useEffect(() => {
    if (inView && numValue > 0) {
      motionValue.set(numValue)
    }
  }, [motionValue, inView, numValue])
  
  useEffect(() => {
    if (numValue === 0) return
    return springValue.on("change", (latest) => {
      if (ref.current) {
        ref.current.textContent = Intl.NumberFormat("id-ID").format(Math.floor(latest)) + suffix
      }
    })
  }, [springValue, numValue, suffix])

  if (numValue === 0) {
    return <span>{value}</span>
  }

  return <span ref={ref}>0{suffix}</span>
}

export function StatsBar({ stats }: { stats: Stat[] }) {
  if (!stats || stats.length === 0) return null

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 relative z-20 -mt-20 md:-mt-24 mb-16">
      <div 
        className="grid grid-cols-2 md:grid-cols-4 overflow-hidden rounded-2xl border border-white/20 backdrop-blur-xl shadow-2xl relative"
        style={{ background: "linear-gradient(135deg, hsl(var(--primary)/0.95) 0%, hsl(var(--primary)/0.8) 100%)" }}
      >
        {/* Subtle inner glow */}
        <div className="absolute inset-0 bg-gradient-to-t from-white/5 to-transparent pointer-events-none" />

        {stats.map((stat, i) => (
          <div
            key={i}
            className={`flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 text-center relative group overflow-hidden ${
              i < stats.length - 1 ? "md:border-r border-white/10" : ""
            } ${i % 2 === 0 ? "border-r md:border-r-0 border-white/10" : ""} ${
              i < 2 ? "border-b md:border-b-0 border-white/10" : ""
            }`}
          >
             {/* Hover shine effect */}
             <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-500" />
             
             <p className="text-4xl md:text-5xl font-black text-white mb-2 drop-shadow-md relative z-10 flex items-center justify-center">
               <AnimatedCounter value={stat.value} />
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
