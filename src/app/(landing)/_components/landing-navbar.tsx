import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"

interface LandingNavbarProps {
  appLogo: string
  platformName: string
}

export function LandingNavbar({ appLogo, platformName }: LandingNavbarProps) {
  return (
    <nav className="glass sticky top-0 z-50 border-b">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <Image
            src={appLogo}
            alt={`${platformName} Logo`}
            width={120}
            height={32}
            className="h-8 w-auto object-contain"
          />
          <span className="font-bold text-base md:text-lg tracking-tight">{platformName}</span>
        </Link>

        {/* Desktop Nav Links */}
        <div className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
          <Link href="#fitur" className="hover:text-foreground transition-colors">
            Fitur
          </Link>
          <Link href="#solusi" className="hover:text-foreground transition-colors">
            Solusi
          </Link>
          <Link href="/direktori" className="hover:text-foreground transition-colors font-medium">
            Direktori Sekolah
          </Link>
        </div>

        {/* CTA + Mobile hint */}
        <div className="flex items-center gap-2">
          <Link href="/daftarkan-sekolah">
            <Button
              size="sm"
              className="rounded-xl btn-gradient text-white shadow-lg glow-primary border-0 text-xs md:text-sm flex items-center justify-center h-10 px-4"
            >
              Daftar Gratis
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  )
}
