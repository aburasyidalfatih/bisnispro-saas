import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import AffiliateSidebar from "./_components/affiliate-sidebar"
import { ThemeProvider } from "@/components/providers/theme-provider"

export default async function AffiliateLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  if (!session.user.isAffiliate && !session.user.isSuperAdmin) {
    redirect("/dashboard")
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <div className="flex min-h-screen bg-mesh">
        <AffiliateSidebar />
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            <div className="container mx-auto p-6 max-w-6xl">
              {children}
            </div>
          </div>
        </main>
      </div>
    </ThemeProvider>
  )
}
