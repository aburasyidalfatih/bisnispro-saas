import Link from "next/link"

interface LandingFooterProps {
  platformName: string
}

export function LandingFooter({ platformName }: LandingFooterProps) {
  return (
    <footer className="border-t glass bg-background/50">
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12">
          {/* Brand & Description */}
          <div className="md:col-span-1 space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg btn-gradient text-white font-bold text-xs">
                S
              </div>
              <span className="font-bold text-lg tracking-tight">{platformName}</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Platform manajemen sekolah digital terlengkap. Kelola akademik, keuangan, dan komunikasi dalam satu atap dengan mudah.
            </p>
          </div>

          {/* Navigasi */}
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">Menu Utama</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/direktori" className="hover:text-primary transition-colors">Direktori Sekolah</Link></li>
              <li><Link href="/mitra-afiliasi" className="hover:text-primary transition-colors">Program Kemitraan</Link></li>
              <li><Link href="/blog" className="hover:text-primary transition-colors">Blog & Artikel</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">Legal & Ketentuan</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/syarat-ketentuan" className="hover:text-primary transition-colors">Syarat & Ketentuan</Link></li>
              <li><Link href="/kebijakan-privasi" className="hover:text-primary transition-colors">Kebijakan Privasi</Link></li>
            </ul>
          </div>

          {/* Kontak & Socials */}
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">Hubungi Kami</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>cs@schoolpro.id</li>
              <li>Senin - Jumat, 08:00 - 17:00 WIB</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border/50 text-center">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} <span className="font-medium text-foreground">SchoolPro</span>. Seluruh Hak Cipta Dilindungi.
          </p>
        </div>
      </div>
    </footer>
  )
}
