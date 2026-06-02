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
  if (!session?.user || session.user.role !== "TEACHER") {
    redirect("/login")
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { 
      aiTokens: true, 
      tenant: {
        select: { aiTokens: true, aiAddonTokens: true }
      }
    }
  })

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
        tenantTokens={(user.tenant?.aiTokens || 0) + (user.tenant?.aiAddonTokens || 0)}
        paymentChannels={paymentChannels}
        aiPackages={aiPackages}
        chatSessions={chatSessions.map(s => ({
          ...s,
          messages: typeof s.messages === "string" ? JSON.parse(s.messages) : s.messages
        }))}
      />
    </div>
  )
}
