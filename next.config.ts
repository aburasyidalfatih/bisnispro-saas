import type { NextConfig } from "next"

/**
 * Domain gambar yang diizinkan untuk Next.js Image Optimization.
 */
const ALLOWED_IMAGE_DOMAINS = [
  { protocol: "https" as const, hostname: "lh3.googleusercontent.com" },
  { protocol: "https" as const, hostname: "avatars.githubusercontent.com" },
  { protocol: "https" as const, hostname: "www.gravatar.com" },
  { protocol: "https" as const, hostname: "images.unsplash.com" },
]

/**
 * Security headers dasar.
 */
const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self'",
      "connect-src 'self' ws: wss:",
      "frame-ancestors 'none'",
    ].join("; "),
  },
]

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["@prisma/client", "bcryptjs"],
  productionBrowserSourceMaps: false, // Hemat RAM: jangan buat source maps
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  images: {
    remotePatterns: ALLOWED_IMAGE_DOMAINS,
  },
  experimental: {
    // Membatasi penggunaan memori saat kompilasi
    cpus: 1, 
    workerThreads: false,
    reactCompiler: false,
    optimizePackageImports: [
      "lucide-react",
      "recharts",
      "date-fns",
      "exceljs",
      "@radix-ui/react-icons",
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-select",
      "@radix-ui/react-tabs",
      "@radix-ui/react-tooltip",
      "@radix-ui/react-popover",
      "@radix-ui/react-alert-dialog",
      "@radix-ui/react-toast",
      "@tanstack/react-table",
      "zod",
    ],
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ]
  },
}

export default nextConfig
