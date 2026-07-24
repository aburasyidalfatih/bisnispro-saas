import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Daftarkan Bisnis Anda - BisnisPro",
  description: "Bergabunglah dengan ratusan bisnis lain yang telah go-digital bersama BisnisPro. Daftarkan bisnis Anda sekarang dan nikmati fitur manajemen terpadu secara instan.",
  alternates: {
    canonical: "/daftarkan-bisnis",
  },
  openGraph: {
    title: "Daftarkan Bisnis Anda - BisnisPro",
    description: "Bergabunglah dengan ratusan bisnis lain yang telah go-digital bersama BisnisPro. Daftarkan bisnis Anda sekarang dan nikmati fitur manajemen terpadu secara instan.",
    url: "/daftarkan-bisnis",
    images: ["/logo-bisnispro.png"],
  },
  twitter: {
    title: "Daftarkan Bisnis Anda - BisnisPro",
    description: "Bergabunglah dengan ratusan bisnis lain yang telah go-digital bersama BisnisPro. Daftarkan bisnis Anda sekarang dan nikmati fitur manajemen terpadu secara instan.",
  }
}

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
