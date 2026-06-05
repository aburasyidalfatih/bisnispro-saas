import Link from "next/link"

interface LandingFooterProps {
  platformName: string
}

export function LandingFooter({ platformName }: LandingFooterProps) {
  return (
    <footer className="border-t glass">
      <div className="container mx-auto px-4 py-6 md:py-8 text-sm text-muted-foreground">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md btn-gradient text-white font-bold text-[10px]">
              S
            </div>
            <span className="font-semibold text-foreground">{platformName}</span>
          </div>

          <p className="text-center text-xs">
            &copy; {new Date().getFullYear()}{" "}
            <a href="https://schoolpro.id" className="hover:underline text-foreground">
              SchoolPro.id
            </a>
            . Hak cipta dilindungi.
          </p>

          <div className="flex gap-4 text-xs">
            <Link href="/kebijakan-privasi" className="hover:text-foreground transition-colors">
              Kebijakan Privasi
            </Link>
            <Link href="/syarat-ketentuan" className="hover:text-foreground transition-colors">
              Syarat & Ketentuan
            </Link>
            <Link href="/mitra-afiliasi" className="hover:text-foreground transition-colors font-medium text-primary">
              Program Afiliasi
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
