import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import AiAssistantClient from "./ai-assistant-client"
import { getPaymentChannels } from "@/features/finance/services/payment.service"

export const metadata = {
  title: "Asisten AI Guru | SchoolPro",
  description: "Asisten AI untuk membantu tugas guru",
}

export default async function AiAssistantPage() {
  const session = await auth()
  if (!session?.user) {
    redirect("/login")
  }

  const tenantId = session.user.tenants?.[0]?.id

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { 
      aiTokens: true, 
    }
  })

  let tenantTokens = 0
  if (tenantId) {
    const tenant = await db.tenant.findUnique({
      where: { id: tenantId },
      select: { aiTokens: true, aiAddonTokens: true }
    })
    if (tenant) {
      tenantTokens = (tenant.aiTokens || 0) + (tenant.aiAddonTokens || 0)
    }
  }

  if (!user) redirect("/login")

  // For the Top-Up logic, we fetch the platform's payment channels.
  // Since we force PLATFORM for AI_TOKEN_USER, we pass 'PLATFORM' to get the default ones.
  // getPaymentChannels("NOT_FOUND") will fallback to platform tripay.
  const paymentChannels = await getPaymentChannels("NOT_FOUND")

  // Fetch AI Token Packages from DB
  const aiPackages = await db.aiTokenPackage.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" }
  })

  // Get chat history
  const chatSessions = await db.aiChatSession.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: 'desc' },
    take: 10
  })

  // Fetch Manual Payment Platform Settings
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Asisten AI Guru 🤖</h1>
        <p className="text-muted-foreground mt-1">
          Gunakan Asisten AI untuk membantu menyusun RPP, soal ujian, materi pelajaran, dan lain-lain.
        </p>
      </div>
      
      <AiAssistantClient 
        userTokens={user.aiTokens || 0} 
        tenantTokens={tenantTokens}
        paymentChannels={paymentChannels}
        aiPackages={aiPackages}
        manualPayment={manualPayment}
        chatSessions={chatSessions.map(s => ({
          ...s,
          messages: typeof s.messages === "string" ? JSON.parse(s.messages) : s.messages
        }))}
      />
    </div>
  )
}
