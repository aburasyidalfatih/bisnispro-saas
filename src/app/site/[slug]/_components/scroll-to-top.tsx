"use client"

import { useState, useEffect } from "react"
import { ArrowUp } from "lucide-react"

export function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false)

  // Munculkan widget setelah di-scroll sedikit
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setIsVisible(true)
      } else {
        setIsVisible(false)
      }
    }
    
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    })
  }

  if (!isVisible) return null

  return (
    <button
      type="button"
      onClick={scrollToTop}
      className="fixed bottom-6 right-6 z-50 flex items-center justify-center p-3 rounded-full bg-primary text-primary-foreground shadow-lg transition-all duration-300 ease-out hover:scale-110 active:scale-95 opacity-100 translate-y-0"
      aria-label="Kembali ke atas"
    >
      <ArrowUp className="h-6 w-6" />
    </button>
  )
}
