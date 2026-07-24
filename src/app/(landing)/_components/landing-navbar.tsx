import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Menu } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"

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
            Direktori Bisnis
          </Link>
          <Link href="/mitra-afiliasi" className="hover:text-foreground transition-colors font-medium">
            Mitra Afiliasi
          </Link>
        </div>

        {/* CTA + Mobile hint */}
        <div className="flex items-center gap-2">
          <Link href="/daftarkan-bisnis" className="hidden md:block">
            <Button
              size="sm"
              className="rounded-xl btn-gradient text-white shadow-lg glow-primary border-0 text-xs md:text-sm flex items-center justify-center h-10 px-4"
            >
              Buat Website Gratis
            </Button>
          </Link>
          
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <SheetTitle className="sr-only">Menu Navigasi</SheetTitle>
              <nav className="flex flex-col gap-4 mt-8">
                <Link href="/" className="block px-2 py-1 text-lg font-medium hover:text-primary transition-colors">
                  Beranda
                </Link>
                <Link href="/direktori" className="block px-2 py-1 text-lg font-medium hover:text-primary transition-colors">
                  Direktori Bisnis
                </Link>
                <Link href="/mitra-afiliasi" className="block px-2 py-1 text-lg font-medium hover:text-primary transition-colors">
                  Program Afiliasi
                </Link>
                <div className="mt-4 border-t pt-4">
                  <Link href="/daftarkan-bisnis" className="block w-full">
                    <Button className="w-full rounded-xl btn-gradient text-white shadow-lg border-0 h-12">
                      Buat Website Gratis
                    </Button>
                  </Link>
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  )
}
