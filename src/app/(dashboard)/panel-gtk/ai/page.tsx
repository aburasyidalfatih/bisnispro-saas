import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import AiAssistantClient from "./ai-assistant-client"

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

  // Get chat history
  const chatSessions = await db.aiChatSession.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: 'desc' },
    take: 15
  })

  return (
    <AiAssistantClient 
      userTokens={user.aiTokens || 0} 
      tenantTokens={tenantTokens}
      chatSessions={chatSessions.map(s => ({
        ...s,
        messages: typeof s.messages === "string" ? JSON.parse(s.messages) : s.messages
      }))}
    />
  )
}
