"use client"

import { useState } from "react"
import { MessageCircle, X } from "lucide-react"
import { Button } from "@/components/ui/button"

export function FloatingWhatsApp({ 
  supportNumbers 
}: { 
  supportNumbers: { id: string, name: string, number: string }[] 
}) {
  const [isOpen, setIsOpen] = useState(false)

  if (!supportNumbers || supportNumbers.length === 0) return null

  // If only 1 number, open directly
  const handleSingleClick = () => {
    let num = supportNumbers[0].number
    if (num.startsWith("08")) num = "628" + num.slice(2)
    window.open(`https://wa.me/${num}`, "_blank")
  }

  if (supportNumbers.length === 1) {
    return (
      <Button 
        onClick={handleSingleClick}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg hover:scale-110 transition-transform"
      >
        <MessageCircle className="h-7 w-7" />
      </Button>
    )
  }

  // Multiple numbers
  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen && (
        <div className="absolute bottom-16 right-0 mb-4 w-64 rounded-2xl border bg-background p-4 shadow-xl animate-in slide-in-from-bottom-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold text-sm">Hubungi Support</h3>
            <Button onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="space-y-2">
            {supportNumbers.map((wa) => {
              let num = wa.number
              if (num.startsWith("08")) num = "628" + num.slice(2)
              return (
                <a 
                  key={wa.id}
                  href={`https://wa.me/${num}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-xl border p-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#25D366]/10 text-[#25D366]">
                    <MessageCircle className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-medium">{wa.name}</span>
                </a>
              )
            })}
          </div>
        </div>
      )}
      <Button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg hover:scale-110 transition-transform ml-auto"
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-7 w-7" />}
      </Button>
    </div>
  )
}
