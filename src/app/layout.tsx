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

import { db } from "@/lib/db"
import { normalizeImageUrl } from "@/lib/utils"

export async function generateMetadata(): Promise<Metadata> {
  let blockIndexing = false
  let platformLogo = "/logo-schoolpro.png"

  try {
    const settings = await db.platformSetting.findMany({
      where: { key: { in: ["block_search_indexing", "app_logo"] } }
    })
    
    settings.forEach(setting => {
      if (setting.key === "block_search_indexing" && setting.value === "true") {
        blockIndexing = true
      }
      if (setting.key === "app_logo" && setting.value) {
        platformLogo = normalizeImageUrl(setting.value) || setting.value
      }
    })
  } catch (error) {
    // Abaikan error DB
  }

  return {
    title: "SchoolPro - Platform Manajemen & Website Sekolah Terpadu",
    description: "SchoolPro adalah platform SaaS terbaik untuk digitalisasi sekolah. Tersedia fitur pembuatan website sekolah otomatis, PPDB Online, manajemen data master, hingga tagihan siswa.",
    keywords: ["aplikasi sekolah", "website sekolah", "sistem informasi sekolah", "ppdb online", "saas pendidikan", "software administrasi sekolah", "website sekolah gratis", "web sekolah gratis"],
    authors: [{ name: "SchoolPro Team" }],
    robots: blockIndexing ? { index: false, follow: false } : undefined,
    openGraph: {
      type: "website",
      locale: "id_ID",
      url: "https://schoolpro.id",
      title: "SchoolPro - Platform Manajemen & Website Sekolah Terpadu",
      description: "Digitalisasi sekolah menjadi sangat mudah dengan SchoolPro. Buat website sekolah, kelola PPDB, tagihan, dan data akademik dalam satu portal cerdas.",
      siteName: "SchoolPro",
    },
    twitter: {
      card: "summary_large_image",
      title: "SchoolPro - Digitalisasi Sekolah Tanpa Ribet",
      description: "Satu platform untuk seluruh kebutuhan administrasi, pendaftaran, dan operasional lembaga pendidikan Anda.",
    },
    icons: {
      icon: platformLogo,
      apple: platformLogo,
    },
    manifest: "/manifest.json",
  }
}

export const viewport: Viewport = {
  themeColor: "#6c47ff",
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
    const settings = await db.platformSetting.findMany({
      where: { key: { in: ["META_PIXEL_ID", "S3_PUBLIC_URL"] } }
    })
    
    settings.forEach(s => {
      if (s.key === "META_PIXEL_ID") metaPixelId = s.value
      if (s.key === "S3_PUBLIC_URL") {
        try {
          const url = new URL(s.value)
          cdnUrl = `${url.protocol}//${url.hostname}`
        } catch (e) {
          // ignore invalid url
        }
      }
    })
  } catch (e) {
    // Abaikan error DB
  }

  return (
    <html lang="id" data-theme={colorTheme} suppressHydrationWarning>
      <head>
        {cdnUrl && (
          <>
            <link rel="preconnect" href={cdnUrl} crossOrigin="anonymous" />
            <link rel="dns-prefetch" href={cdnUrl} />
          </>
        )}
      </head>
      <body className={`${inter.className} ${inter.variable} ${plusJakarta.variable} ${playfair.variable} ${outfit.variable} overflow-x-clip w-full`} suppressHydrationWarning>
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
