import type { Metadata, Viewport } from "next"
import { cookies } from "next/headers"
import "./globals.css"
import { ThemeProvider } from "@/components/providers/theme-provider"
import { SessionProvider } from "@/components/providers/session-provider"
import { ColorThemeProvider } from "@/components/providers/color-theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { ImpersonateBanner } from "@/components/shared/impersonate-banner"
import { MetaPixel } from "@/components/shared/meta-pixel"

import { ConfirmProvider } from "@/components/providers/confirm-provider"

import { Inter, Plus_Jakarta_Sans, Playfair_Display, Outfit } from "next/font/google"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" })
const plusJakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta", display: "swap" })
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair", display: "swap" })
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit", display: "swap" })

import { getCachedPlatformSettings } from "@/lib/platform-settings-cache"
import { normalizeImageUrl } from "@/lib/utils"

export async function generateMetadata(): Promise<Metadata> {
  let blockIndexing = false
  let platformLogo = "/logo-bisnispro.png"

  try {
    const settings = await getCachedPlatformSettings(["block_search_indexing", "app_logo"])
    if (settings["block_search_indexing"] === "true") {
      blockIndexing = true
    }
    if (settings["app_logo"]) {
      platformLogo = normalizeImageUrl(settings["app_logo"]) || settings["app_logo"]
    }
  } catch (error) {
    // Abaikan error DB
  }

  return {
    metadataBase: new URL("https://bisnispro.id"),
    title: "BisnisPro - Platform Manajemen & Website Perusahaan Terpadu",
    description: "BisnisPro adalah platform SaaS terbaik untuk digitalisasi perusahaan. Tersedia fitur pembuatan website perusahaan otomatis, manajemen data master, layanan & portofolio, hingga tagihan klien.",
    keywords: ["aplikasi perusahaan", "website perusahaan", "sistem informasi perusahaan", "saas bisnis", "platform manajemen bisnis", "software administrasi perusahaan", "website perusahaan gratis", "web perusahaan gratis"],
    authors: [{ name: "BisnisPro Team" }],
    robots: blockIndexing ? { index: false, follow: false } : undefined,
    openGraph: {
      type: "website",
      locale: "id_ID",
      url: "https://bisnispro.id",
      title: "BisnisPro - Platform Manajemen & Website Perusahaan Terpadu",
      description: "Digitalisasi perusahaan menjadi sangat mudah dengan BisnisPro. Buat website perusahaan, kelola tim, layanan, tagihan, dan operasional bisnis dalam satu portal cerdas.",
      siteName: "BisnisPro",
    },
    twitter: {
      card: "summary_large_image",
      title: "BisnisPro - Digitalisasi Perusahaan Tanpa Ribet",
      description: "Satu platform untuk seluruh kebutuhan administrasi, pendaftaran, dan operasional bisnis Anda.",
    },
    icons: {
      icon: platformLogo,
      apple: platformLogo,
    },
    manifest: "/manifest.json",
  }
}

export const viewport: Viewport = {
  themeColor: "#0ea5e9",
}

import { ReferralCapture } from "@/components/shared/referral-capture"

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Baca tema dari cookie untuk SSR — hanya berlaku untuk dashboard/tenant pages
  // Landing page dan super admin selalu pakai aurora (override di masing-masing layout)
  const cookieStore = await cookies()
  const colorTheme = cookieStore.get("color-theme")?.value || "aurora"

  let metaPixelId = ""
  let cdnUrl = ""
  try {
    const settings = await getCachedPlatformSettings(["META_PIXEL_ID", "S3_PUBLIC_URL"])
    if (settings["META_PIXEL_ID"]) metaPixelId = settings["META_PIXEL_ID"]
    if (settings["S3_PUBLIC_URL"]) {
      try {
        const url = new URL(settings["S3_PUBLIC_URL"])
        cdnUrl = `${url.protocol}//${url.hostname}`
      } catch (e) {
        // ignore invalid url
      }
    }
  } catch (e) {
    // Abaikan error DB
  }

  return (
    <html lang="id" data-theme={colorTheme} suppressHydrationWarning>
      <head>
        {cdnUrl ? (
          <>
            <link rel="preconnect" href={cdnUrl} crossOrigin="anonymous" />
            <link rel="dns-prefetch" href={cdnUrl} />
          </>
        ) : null}
      </head>
      <body className={`${plusJakarta.className} ${inter.variable} ${plusJakarta.variable} ${playfair.variable} ${outfit.variable} overflow-x-clip w-full`} suppressHydrationWarning>
        <SessionProvider>
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
            <ColorThemeProvider>
              <ConfirmProvider>
                <ImpersonateBanner />
                <MetaPixel pixelId={metaPixelId} />
                <ReferralCapture />
                {children}
                <Toaster />
              </ConfirmProvider>
            </ColorThemeProvider>
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  )
}
