import type { NextConfig } from "next"
import { withSentryConfig } from "@sentry/nextjs"

/**
 * Domain gambar yang diizinkan untuk Next.js Image Optimization.
 */
const ALLOWED_IMAGE_DOMAINS = [
  { protocol: "https" as const, hostname: "lh3.googleusercontent.com" },
  { protocol: "https" as const, hostname: "avatars.githubusercontent.com" },
  { protocol: "https" as const, hostname: "www.gravatar.com" },
  { protocol: "https" as const, hostname: "images.unsplash.com" },
  { protocol: "https" as const, hostname: "*.public.blob.vercel-storage.com" },
  { protocol: "https" as const, hostname: "*.r2.dev" },
  { protocol: "https" as const, hostname: "*.cloudflarestorage.com" },
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
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://static.cloudflareinsights.com https://challenges.cloudflare.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: blob: https:",
      "font-src 'self' https://fonts.gstatic.com",
      "connect-src 'self' ws: wss: https://cloudflareinsights.com https://static.cloudflareinsights.com https://*.ingest.sentry.io https://*.sentry.io",
      "frame-src 'self' https://challenges.cloudflare.com https://www.openstreetmap.org https://maps.google.com https://www.google.com https://www.youtube.com https://youtube.com https://youtu.be",
      "frame-ancestors 'none'",
    ].join("; "),
  },
]

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION || (() => {
      try {
        return require("child_process").execSync("git rev-parse --short HEAD").toString().trim()
      } catch (e) {
        return ""
      }
    })(),
  },
  output: "standalone",
  serverExternalPackages: ["@prisma/client", "bcryptjs"],
  productionBrowserSourceMaps: false, // Hemat RAM: jangan buat source maps
  typescript: {
    // Abaikan type checking saat build di production untuk mencegah OOM (Exit code 137)
    // Asumsinya type check sudah dilakukan di lokal saat development.
    ignoreBuildErrors: true,
  },
  eslint: {
    // Lint is enforced by the package prebuild script; Next's built-in lint step
    // currently conflicts with the repo's ESLint toolchain options.
    ignoreDuringBuilds: true,
  },
  images: {
    // Bypass Next.js Image Optimization secara global.
    // Alasan:
    // 1. Gambar sudah dioptimasi (WebP via Sharp) saat upload di upload.service.ts
    // 2. Domain CDN/R2 bersifat dinamis (diset Super Admin di settings), tidak bisa di-hardcode
    // 3. Mendukung custom domain apapun: cdn.schoolpro.id, cdn.schoolpro.my.id, dll
    unoptimized: true,
    remotePatterns: ALLOWED_IMAGE_DOMAINS,
  },
  experimental: {
    // Memaksimalkan penggunaan CPU VPS (4 Cores) dengan menyisakan 1 core
    cpus: process.env.CI ? 4 : 2, 
    workerThreads: true,
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

export default withSentryConfig(nextConfig, {
  // Sentry Options
  org: process.env.SENTRY_ORG || "",
  project: process.env.SENTRY_PROJECT || "",

  // Suppress source map upload in dev / when no auth token
  silent: !process.env.SENTRY_AUTH_TOKEN,

  // Upload source maps for better stack traces (only when auth token set)
  widenClientFileUpload: true,

  // Source maps configuration
  sourcemaps: {
    deleteSourcemapsAfterUpload: true,
  },

  // Webpack plugin configuration (replaces top-level deprecated options)
  webpack: {
    treeshake: {
      removeDebugLogging: true,
    },
    autoInstrumentServerFunctions: true,
    autoInstrumentMiddleware: true,
    autoInstrumentAppDirectory: true,
  }
})
