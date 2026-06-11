import AiAnalystClient from "./_components/ai-analyst-client"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

export const metadata = {
  title: "AI Business Analyst | Super Admin",
}

export default async function AiAnalystPage() {
  const session = await auth()
  if (!session?.user?.id) return redirect("/login")
  if (!session.user.isSuperAdmin) return redirect("/admin")

  const chatSessions = await db.aiChatSession.findMany({
    where: { 
      userId: session.user.id,
      title: { startsWith: "[Analyst]" }
    },
    orderBy: { updatedAt: "desc" },
    take: 20
  })

  // Format messages properly
  const formattedSessions = chatSessions.map(s => {
    let msgs = []
    try {
      msgs = typeof s.messages === "string" ? JSON.parse(s.messages) : s.messages
    } catch (e) {}
    
    return {
      id: s.id,
      title: s.title.replace("[Analyst] ", ""),
      updatedAt: s.updatedAt,
      messages: msgs
    }
  })

  return <AiAnalystClient initialSessions={formattedSessions} />
}
