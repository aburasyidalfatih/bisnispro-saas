import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import { cookies } from "next/headers"
import "./globals.css"
import { ThemeProvider } from "@/components/providers/theme-provider"
import { SessionProvider } from "@/components/providers/session-provider"
import { ColorThemeProvider } from "@/components/providers/color-theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { ImpersonateBanner } from "@/components/shared/impersonate-banner"
import { MetaPixel } from "@/components/shared/meta-pixel"

import { ConfirmProvider } from "@/components/providers/confirm-provider"

const inter = Inter({ subsets: ["latin"] })

import { db } from "@/lib/db"

export async function generateMetadata(): Promise<Metadata> {
  // Periksa apakah Super Admin memblokir indexing (Dev Mode)
  let blockIndexing = false
  try {
    const setting = await db.platformSetting.findUnique({
      where: { key: "block_search_indexing" }
    })
    if (setting && setting.value === "true") {
      blockIndexing = true
    }
  } catch (error) {
    // Abaikan error DB
  }

  let platformLogo = "/logo-schoolpro.png"
  try {
    const logoSetting = await db.platformSetting.findUnique({
      where: { key: "app_logo" }
    })
    if (logoSetting && logoSetting.value) {
      platformLogo = logoSetting.value
    }
  } catch (error) {
    // Abaikan error DB
  }

  return {
    title: "SchoolPro - Platform Manajemen & Website Sekolah Terpadu",
    description: "SchoolPro adalah platform SaaS terbaik untuk digitalisasi sekolah. Tersedia fitur pembuatan website sekolah otomatis, PPDB Online, manajemen data master, hingga tagihan siswa.",
    keywords: ["aplikasi sekolah", "website sekolah", "sistem informasi sekolah", "ppdb online", "saas pendidikan", "software administrasi sekolah"],
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

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Baca tema dari cookie untuk SSR — hanya berlaku untuk dashboard/tenant pages
  // Landing page dan super admin selalu pakai aurora (override di masing-masing layout)
  const cookieStore = await cookies()
  const colorTheme = cookieStore.get("color-theme")?.value || "aurora"

  let metaPixelId = ""
  try {
    const pixelSetting = await db.platformSetting.findUnique({
      where: { key: "META_PIXEL_ID" }
    })
    if (pixelSetting && pixelSetting.value) {
      metaPixelId = pixelSetting.value
    }
  } catch (e) {
    // Abaikan error DB
  }

  return (
    <html lang="id" data-theme={colorTheme} suppressHydrationWarning>
      <head />
      <body className={inter.className} suppressHydrationWarning>
        <SessionProvider>
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
            <ColorThemeProvider>
              <ConfirmProvider>
                <ImpersonateBanner />
                <MetaPixel pixelId={metaPixelId} />
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
