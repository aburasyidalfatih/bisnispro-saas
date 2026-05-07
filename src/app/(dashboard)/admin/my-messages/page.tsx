"use client"

import { useEffect, useState } from "react"
import { useTenantBranding } from "@/components/providers/tenant-branding-provider"
import { Card, CardContent } from "@/components/ui/card"
import { MessageSquare, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { id } from "date-fns/locale"

interface Message {
  id: string
  subject: string | null
  body: string
  createdAt: string
  senderId: string
  receiverId: string | null
  sender: { name: string; avatar: string | null }
  receiver?: { name: string; avatar: string | null }
}

export default function AdminMessagesPage() {
  const { branding } = useTenantBranding()
  const tenantId = branding.id

  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)

  const fetchMessages = () => {
    if (!tenantId) return
    setLoading(true)
    fetch(`/api/tenant/messages?tenantId=${tenantId}&type=inbox`)
      .then(r => r.json())
      .then(d => {
        setMessages(Array.isArray(d) ? d : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    fetchMessages()
  }, [tenantId])

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Kotak Masuk (Admin)</h1>
          <p className="text-muted-foreground mt-1 text-sm">Pesan internal dari para guru dan staf.</p>
        </div>
      </div>

      <Card className="glass border-0 min-h-[400px]">
        <CardContent className="p-6">
          <div className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-16 flex flex-col items-center">
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                  <MessageSquare className="h-6 w-6 text-muted-foreground/50" />
                </div>
                <p className="text-muted-foreground">Kotak masuk Anda kosong.</p>
              </div>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className="p-4 rounded-xl border border-border/50 bg-background/50 hover:bg-muted/20 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                        {msg.sender.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-sm">
                          {msg.sender.name}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {format(new Date(msg.createdAt), "dd MMM yyyy, HH:mm", { locale: id })}
                        </p>
                      </div>
                    </div>
                  </div>
                  {msg.subject && (
                    <p className="font-semibold text-sm mb-1 mt-3">{msg.subject}</p>
                  )}
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{msg.body}</p>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
