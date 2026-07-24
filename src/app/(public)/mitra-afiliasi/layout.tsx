import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Program Kemitraan & Afiliasi - BisnisPro",
  description: "Jadilah Mitra Afiliasi BisnisPro dan dapatkan komisi menarik untuk setiap perusahaan yang berhasil Anda ajak bergabung. Peluang penghasilan tambahan tanpa batas!",
  alternates: {
    canonical: "/mitra-afiliasi",
  },
  openGraph: {
    title: "Program Kemitraan & Afiliasi - BisnisPro",
    description: "Jadilah Mitra Afiliasi BisnisPro dan dapatkan komisi menarik untuk setiap perusahaan yang berhasil Anda ajak bergabung. Peluang penghasilan tambahan tanpa batas!",
    url: "/mitra-afiliasi",
    images: ["/logo-bisnispro.png"],
  },
  twitter: {
    title: "Program Kemitraan & Afiliasi - BisnisPro",
    description: "Jadilah Mitra Afiliasi BisnisPro dan dapatkan komisi menarik untuk setiap perusahaan yang berhasil Anda ajak bergabung. Peluang penghasilan tambahan tanpa batas!",
  }
}

export default function AffiliateLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
