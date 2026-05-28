"use client"

import { MobileBottomNav } from "./mobile-bottom-nav"
import { Header } from "./header"
import { useRealtimeNotification } from "@/hooks/use-realtime-notification"

export function MobileAppLayout({ children }: { children: React.ReactNode }) {
  useRealtimeNotification()
  
  return (
    <div className="min-h-screen flex justify-center w-full font-sans bg-muted/20">
      {/* Mobile Device Simulator Container */}
      <div className="w-full max-w-[480px] bg-background min-h-screen relative shadow-2xl flex flex-col overflow-hidden lg:my-0 ring-1 ring-border/50">
        
        {/* Main Content Area (Scrollable) */}
        <main className="flex-1 overflow-y-auto pb-28 scrollbar-hide relative">
          {children}
        </main>

        {/* Bottom Navigation */}
        <div className="absolute bottom-0 left-0 right-0 z-50">
          <MobileBottomNav />
        </div>
        
      </div>
    </div>
  )
}
