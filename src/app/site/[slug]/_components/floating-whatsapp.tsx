"use client"

import { useState, useEffect } from "react"
import { MessageCircle } from "lucide-react"

interface FloatingWhatsAppProps {
  whatsappNumber: string
  message?: string
}

export function FloatingWhatsApp({ whatsappNumber, message = "Halo, saya ingin bertanya tentang pendaftaran." }: FloatingWhatsAppProps) {
  const [isVisible, setIsVisible] = useState(false)

  // Munculkan widget setelah di-scroll sedikit untuk tidak menutupi hero
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setIsVisible(true)
      } else {
        setIsVisible(false)
      }
    }
    
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  if (!whatsappNumber) return null

  // Format the number to only include digits, ensuring country code +62 instead of leading 0
  let formattedNumber = whatsappNumber.replace(/\D/g, '')
  if (formattedNumber.startsWith('0')) {
    formattedNumber = '62' + formattedNumber.substring(1)
  }

  const encodedMessage = encodeURIComponent(message)
  const waUrl = `https://wa.me/${formattedNumber}?text=${encodedMessage}`

  return (
    <a
      href={waUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`fixed bottom-6 right-6 z-50 flex items-center justify-center p-3 rounded-full bg-[#25D366] text-white shadow-2xl transition-all duration-500 ease-out hover:scale-110 hover:shadow-[0_0_20px_rgba(37,211,102,0.5)] active:scale-95 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10 pointer-events-none"
      }`}
      aria-label="Chat WhatsApp"
    >
      <div className="absolute inset-0 rounded-full animate-ping bg-[#25D366] opacity-30" style={{ animationDuration: '3s' }} />
      <MessageCircle className="h-7 w-7 relative z-10" />
      <span className="absolute right-full mr-3 whitespace-nowrap bg-white text-gray-800 text-xs font-bold py-1.5 px-3 rounded-xl shadow-md opacity-0 group-hover:opacity-100 transition-opacity">
        Butuh bantuan?
      </span>
    </a>
  )
}
