import { NextRequest } from "next/server"
import { auth } from "@/lib/auth"
import { getSubscriber } from "@/lib/realtime"
import { logger } from "@/lib/logger"

// Edge runtime tidak mendukung ioredis dengan mudah karena ioredis mengandalkan Node.js TCP sockets.
// Oleh karena itu, kita biarkan di Node.js runtime standar (default).
export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const session = await auth()
  const userId = session?.user?.id
  const tenantId = session?.user?.tenants?.[0]?.id

  if (!userId) {
    return new Response("Unauthorized", { status: 401 })
  }

  const subscriber = getSubscriber()
  if (!subscriber) {
    // Fallback: Jika redis tidak berjalan, biarkan koneksi terputus dengan wajar
    return new Response("Real-time not available", { status: 503 })
  }

  // Pisahkan channel yang didengarkan
  const userChannel = `user-notif:${userId}`
  const tenantChannel = tenantId ? `tenant-notif:${tenantId}` : null

  // Pastikan kita membuat koneksi duplikat untuk subscribe, 
  // karena koneksi subscriber tidak bisa dibagi untuk subscribe yang berbeda-beda
  // secara simultan jika tidak ditangani dengan benar. 
  // Namun ioredis merekomendasikan `duplicate()` untuk koneksi subscriber aman.
  const streamSubscriber = subscriber.duplicate()

  const stream = new ReadableStream({
    async start(controller) {
      // Kirim initial connection heartbeat
      controller.enqueue(`data: ${JSON.stringify({ type: "CONNECTED" })}\n\n`)

      try {
        await streamSubscriber.subscribe(userChannel)
        if (tenantChannel) {
          await streamSubscriber.subscribe(tenantChannel)
        }

        streamSubscriber.on("message", (channel, message) => {
          // Format Server-Sent Events (SSE)
          controller.enqueue(`data: ${message}\n\n`)
        })

        // Heartbeat untuk mencegah koneksi ditutup oleh Nginx / Load Balancer
        const intervalId = setInterval(() => {
          controller.enqueue(`:\n\n`) // SSE comment as keep-alive
        }, 15000)

        // Bersihkan saat koneksi ditutup
        req.signal.addEventListener("abort", () => {
          clearInterval(intervalId)
          streamSubscriber.unsubscribe(userChannel, tenantChannel || "")
          streamSubscriber.quit()
          controller.close()
        })
      } catch (error) {
        logger.error("Error setting up Redis subscriber for SSE", error)
        controller.close()
      }
    },
    cancel() {
      streamSubscriber.unsubscribe(userChannel, tenantChannel || "")
      streamSubscriber.quit()
    }
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      // Penting agar Nginx tidak nge-buffer SSE
      "X-Accel-Buffering": "no",
    },
  })
}
