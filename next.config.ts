import type { NextConfig } from "next"
import { withSentryConfig } from "@sentry/nextjs"

/**
 * Domain gambar yang diizinkan untuk Next.js Image Optimization.
 */
const ALLOWED_IMAGE_DOMAINS = [
  { protocol: "https" as const, hostname: "**" },
  { protocol: "http" as const, hostname: "**" },
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
  outputFileTracingExcludes: {
    // Exclude large or unnecessary files from being copied to the standalone output
    "/(.*)": [
      "node_modules/@swc/core-linux-x64-gnu",
      "node_modules/@swc/core-linux-x64-musl",
      "node_modules/@esbuild/linux-x64",
    ],
  },
  serverExternalPackages: ["@prisma/client", "bcryptjs", "pdfkit"],
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
    // Next.js Image Optimization diaktifkan untuk meningkatkan skor LCP & Speed Index.
    // Cache TTL diset 1 minggu untuk meminimalkan load CPU VPS (4 Cores).
    minimumCacheTTL: 604800,
    remotePatterns: ALLOWED_IMAGE_DOMAINS,
  },
  experimental: {
    // Kurangi penggunaan CPU/Thread menjadi 1 untuk mencegah Out of Memory saat build di VPS
    cpus: 1, 
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

  // Disable all telemetry
  telemetry: false,

  // Source maps configuration
  sourcemaps: {
    // Only generate sourcemaps if auth token is present (saves MASSIVE build time)
    disable: !process.env.SENTRY_AUTH_TOKEN,
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
