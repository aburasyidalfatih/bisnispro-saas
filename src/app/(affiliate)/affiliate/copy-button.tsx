"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Copy, Check } from "lucide-react"
import { toast } from "@/hooks/use-toast"

export function CopyLinkButton({ link }: { link: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      toast({
        title: "Tautan Disalin!",
        description: "Tautan referral berhasil disalin ke clipboard.",
      })
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      toast({
        title: "Gagal Menyalin",
        description: "Terjadi kesalahan saat menyalin tautan.",
        variant: "destructive"
      })
    }
  }

  return (
    <Button 
      size="sm" 
      onClick={handleCopy}
      className="shrink-0 bg-emerald-500 hover:bg-emerald-600 text-white transition-all"
    >
      {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
      {copied ? "Tersalin!" : "Salin Link"}
    </Button>
  )
}
