"use client"

import { useEffect } from "react"
import { toast } from "@/hooks/use-toast"
import { useSWRConfig } from "swr"

export function useRealtimeNotification() {
  const { mutate } = useSWRConfig()

  useEffect(() => {
    // EventSource otomatis menangani reconnections
    const eventSource = new EventSource("/api/realtime/stream")

    eventSource.onmessage = (event) => {
      // Abaikan keep-alive comments yang kosong
      if (!event.data) return

      try {
        const data = JSON.parse(event.data)

        if (data.type === "CONNECTED") {
          console.log("[Realtime SSE] Connected to server stream")
        }

        if (data.type === "NEW_NOTIFICATION") {
          // 1. Tampilkan toast
          toast({
            title: data.notification.title || "Notifikasi Baru",
            description: data.notification.message || "Anda mendapatkan pesan baru",
          })

          // 2. Optimistic update / Re-fetch SWR cache untuk badge bell
          mutate("/api/notifications")
          mutate("/api/tenant/score") // Opsional, jika ada SWR untuk skor
        }

        if (data.type === "POINTS_UPDATED") {
          // Notifikasi untuk Admin Panel
          toast({
            title: `+${data.points} Poin (Aktivitas Tenant)`,
            description: data.description,
          })
          
          mutate("/api/notifications")
        }

      } catch (error) {
        // Bukan JSON, mungkin data format lain
      }
    }

    eventSource.onerror = (error) => {
      console.error("[Realtime SSE] Connection error", error)
      // EventSource akan otomatis mencoba reconnect
    }

    return () => {
      eventSource.close()
    }
  }, [mutate])
}
