"use client"

import { useEffect, useState } from "react"
import { formatDistanceToNow } from "date-fns"
import { id as idLocale } from "date-fns/locale"
import { Building2, X } from "lucide-react"
import { normalizeImageUrl } from "@/lib/utils"
import Image from "next/image"
import { AnimatePresence, motion } from "framer-motion"
import { Button } from "@/components/ui/button"

interface Registration {
  schoolName: string
  regency: string | null
  logo: string | null
  createdAt: string
}

export function SocialProofPopup() {
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    let timer: NodeJS.Timeout;
    let isMounted = true;

    fetch("/api/public/recent-registrations")
      .then(res => res.json())
      .then(data => {
        if (!isMounted) return;
        if (Array.isArray(data) && data.length > 0) {
          setRegistrations(data)
          timer = setTimeout(() => setIsVisible(true), 3000)
        }
      })
      .catch(console.error)
      
    return () => {
      isMounted = false;
      if (timer) clearTimeout(timer);
    }
  }, [])

  useEffect(() => {
    if (!isVisible || registrations.length === 0) return

    let nextTimer: NodeJS.Timeout;
    
    const hideTimer = setTimeout(() => {
      setIsVisible(false)
      const nextDelay = Math.floor(Math.random() * 10000) + 5000
      
      nextTimer = setTimeout(() => {
        setCurrentIndex(prev => (prev + 1) % registrations.length)
        setIsVisible(true)
      }, nextDelay)
      
    }, 5000)

    return () => {
      clearTimeout(hideTimer)
      if (nextTimer) clearTimeout(nextTimer)
    }
  }, [isVisible, registrations.length])

  if (registrations.length === 0) return null

  const current = registrations[currentIndex]
  const normalizedLogo = normalizeImageUrl(current.logo)
  const hasLogo = !!normalizedLogo

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, x: -20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, x: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
          className="fixed bottom-6 left-6 z-50 max-w-sm w-[calc(100%-3rem)] sm:w-80 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-2xl border border-primary/10 rounded-2xl p-4 overflow-hidden"
        >
          {/* Subtle gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
          
          <Button 
            variant="ghost"
            size="icon"
            onClick={() => setIsVisible(false)}
            className="absolute top-2 right-2 h-6 w-6 text-muted-foreground hover:bg-black/5 hover:text-foreground transition-colors rounded-full"
            aria-label="Tutup"
          >
            <X className="h-3 w-3" />
          </Button>

          <div className="flex items-start gap-3 relative z-10">
            <div className="flex-shrink-0 relative h-10 w-10 rounded-full overflow-hidden bg-primary/10 border border-primary/20 flex items-center justify-center">
              {hasLogo ? (
                <Image src={normalizedLogo!} alt={current.schoolName} fill sizes="40px" className="object-cover" />
              ) : (
                <Building2 className="h-5 w-5 text-primary/60" />
              )}
            </div>
            <div className="flex-1 min-w-0 pr-4">
              <p className="text-sm font-semibold text-foreground leading-tight truncate">
                {current.schoolName}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                {current.regency ? `${current.regency}` : "Indonesia"}
              </p>
              <div className="flex items-center gap-1.5 mt-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <p className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                  Mendaftar {formatDistanceToNow(new Date(current.createdAt), { addSuffix: true, locale: idLocale })}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
