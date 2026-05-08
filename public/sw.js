const CACHE_NAME = "schoolpro-pwa-cache-v2"
const OFFLINE_URL = "/"

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Kita hanya mencache halaman utama sebagai fallback offline sederhana
      return cache.add(OFFLINE_URL).catch(() => {})
    })
  )
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
  self.clients.claim()
})

self.addEventListener("fetch", (event) => {
  // Hanya proses request GET
  if (event.request.method !== "GET") return

  // Abaikan request API dan resource external tertentu untuk diserahkan ke browser
  const url = new URL(event.request.url)
  // Abaikan request ke domain eksternal, API, dan Next.js assets
  if (url.origin !== self.location.origin || url.pathname.startsWith('/api/') || url.pathname.startsWith('/_next/')) {
    return
  }

  event.respondWith(
    fetch(event.request).catch(async () => {
      // Jika gagal fetch (offline), coba ambil dari cache
      const cache = await caches.open(CACHE_NAME)
      const cachedResponse = await cache.match(event.request)
      if (cachedResponse) return cachedResponse
      
      // Fallback ke halaman utama jika navigasi
      if (event.request.mode === 'navigate') {
        return cache.match(OFFLINE_URL)
      }
      
      return Response.error()
    })
  )
})
