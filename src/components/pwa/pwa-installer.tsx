"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Download, X } from "lucide-react"

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: Array<string>
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed"
    platform: string
  }>
  prompt(): Promise<void>
}

interface PwaInstallerProps {
  tenantName: string
  tenantLogo?: string | null
}

export function PwaInstaller({ tenantName, tenantLogo }: PwaInstallerProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstallable, setIsInstallable] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)

  useEffect(() => {
    // Register Service Worker
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => console.log("Service Worker registered!", reg))
        .catch((err) => console.error("Service Worker registration failed:", err))
    }

    // Check session storage if dismissed recently
    const dismissed = sessionStorage.getItem(`pwa-dismissed-${tenantName}`)
    if (dismissed) {
      setIsDismissed(true)
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault()
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setIsInstallable(true)
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)

    // Deteksi jika sudah diinstal
    window.addEventListener("appinstalled", () => {
      setIsInstallable(false)
      setDeferredPrompt(null)
    })

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    }
  }, [tenantName])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    // Show the install prompt
    deferredPrompt.prompt()

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice
    
    if (outcome === "accepted") {
      setIsInstallable(false)
    }
    
    setDeferredPrompt(null)
  }

  const handleDismiss = () => {
    setIsDismissed(true)
    sessionStorage.setItem(`pwa-dismissed-${tenantName}`, "true")
  }

  if (!isInstallable || isDismissed) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-white dark:bg-slate-900 border border-border shadow-2xl rounded-2xl p-4 z-50 flex items-center justify-between gap-4 animate-in slide-in-from-bottom-5 fade-in duration-500">
      <div className="flex items-center gap-3 overflow-hidden">
        <div className="h-10 w-10 shrink-0 rounded-xl bg-muted overflow-hidden flex items-center justify-center">
          {tenantLogo ? (
            <img src={tenantLogo} alt="Logo" className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg">
              {tenantName.charAt(0)}
            </div>
          )}
        </div>
        <div className="overflow-hidden">
          <p className="text-sm font-bold truncate">{tenantName}</p>
          <p className="text-[11px] text-muted-foreground leading-tight truncate">
            Instal aplikasi untuk akses lebih cepat
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Button size="sm" onClick={handleInstallClick} className="rounded-xl px-4 py-0 h-8 gap-1.5 shadow-sm text-xs">
          <Download className="h-3.5 w-3.5" /> Instal
        </Button>
        <button onClick={handleDismiss} className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
