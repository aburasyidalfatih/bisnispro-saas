import { auth } from "@/lib/auth"
import ClientLayout from "./client-layout"

export async function generateMetadata() {
  const session = await auth()
  const tenantLogo = session?.user?.tenants?.[0]?.logo
  if (tenantLogo) {
    return {
      icons: {
        icon: tenantLogo,
        apple: tenantLogo,
      }
    }
  }
  return {}
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <ClientLayout>{children}</ClientLayout>
}
