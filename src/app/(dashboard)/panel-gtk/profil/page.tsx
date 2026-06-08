import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { User, UserCircle, Wallet } from "lucide-react"
import { ProfilGTKForm } from "./_components/profil-gtk-form"
import { GtkLogoutButton } from "./_components/gtk-logout-button"
import { GtkTokenManager } from "./_components/gtk-token-manager"
import { getPaymentChannels } from "@/features/finance/services/payment.service"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default async function ProfilGTKPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const currentTenant = session.user.tenants?.[0]
  if (!currentTenant) redirect("/dashboard")

  // Ambil data staff berdasarkan userId
  const staff = await db.staff.findFirst({
    where: {
      tenantId: currentTenant.id,
      userId: session.user.id
    }
  })

  if (!staff) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-center px-4">
        <div className="h-20 w-20 bg-muted/50 rounded-full flex items-center justify-center mb-6">
          <User className="h-10 w-10 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Profil Belum Ditautkan</h2>
        <p className="text-muted-foreground max-w-md mb-8">
          Akun Anda belum ditautkan dengan data Guru/Tenaga Kependidikan oleh Admin Sekolah. Silakan hubungi Admin untuk sinkronisasi data pertama kali.
        </p>
        <GtkLogoutButton />
      </div>
    )
  }

  // Fetch AI Tokens logic
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { aiTokens: true }
  })
  
  let tenantTokens = 0
  const tenant = await db.tenant.findUnique({
    where: { id: currentTenant.id },
    select: { aiTokens: true, aiAddonTokens: true }
  })
  if (tenant) {
    tenantTokens = (tenant.aiTokens || 0) + (tenant.aiAddonTokens || 0)
  }

  const paymentChannels = await getPaymentChannels("NOT_FOUND")
  const aiPackages = await db.aiTokenPackage.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" }
  })

  const platformSettings = await db.platformSetting.findMany({
    where: { key: { in: ["MANUAL_PAYMENT_BANK", "MANUAL_PAYMENT_NUMBER", "MANUAL_PAYMENT_NAME", "MANUAL_PAYMENT_WA"] } },
    select: { key: true, value: true }
  })
  
  const manualPayment = {
    bank: platformSettings.find(s => s.key === "MANUAL_PAYMENT_BANK")?.value || "Bank BCA",
    number: platformSettings.find(s => s.key === "MANUAL_PAYMENT_NUMBER")?.value || "1234 5678 90",
    name: platformSettings.find(s => s.key === "MANUAL_PAYMENT_NAME")?.value || "PT SchoolPro Indonesia",
    waNumber: platformSettings.find(s => s.key === "MANUAL_PAYMENT_WA")?.value || "6281234567890",
  }

  return (
    <div className="max-w-4xl mx-auto w-full pb-8 space-y-6">
      <Tabs defaultValue="profil" className="w-full">
        <TabsList className="mb-6 bg-muted/50 p-1 w-full justify-start h-auto rounded-xl">
          <TabsTrigger value="profil" className="flex items-center gap-2 py-2.5 px-5 rounded-lg data-[state=active]:shadow-sm">
            <UserCircle className="h-4 w-4" />
            Profil Saya
          </TabsTrigger>
          <TabsTrigger value="token" className="flex items-center gap-2 py-2.5 px-5 rounded-lg data-[state=active]:shadow-sm">
            <Wallet className="h-4 w-4" />
            Top-Up & Token AI
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profil" className="space-y-6 outline-none m-0">
          <ProfilGTKForm 
            staff={staff} 
            sessionImage={session.user.image || undefined}
            sessionEmail={session.user.email || undefined} 
          />
          <div className="flex justify-center mt-8">
            <GtkLogoutButton />
          </div>
        </TabsContent>

        <TabsContent value="token" className="outline-none m-0">
          <GtkTokenManager 
            userTokens={user?.aiTokens || 0}
            tenantTokens={tenantTokens}
            paymentChannels={paymentChannels}
            aiPackages={aiPackages}
            manualPayment={manualPayment}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
