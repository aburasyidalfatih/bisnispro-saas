import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Program Kemitraan & Afiliasi - SchoolPro",
  description: "Jadilah Mitra Afiliasi SchoolPro dan dapatkan komisi menarik untuk setiap sekolah yang berhasil Anda ajak bergabung. Peluang penghasilan tambahan tanpa batas!",
}

export default function AffiliateLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
