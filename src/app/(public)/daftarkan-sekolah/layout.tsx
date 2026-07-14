import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Daftarkan Sekolah Anda - SchoolPro",
  description: "Bergabunglah dengan ratusan sekolah lain yang telah go-digital bersama SchoolPro. Daftarkan sekolah Anda sekarang dan nikmati fitur manajemen terpadu secara instan.",
}

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
