"use client"

import { useEffect, useState } from "react"
import { useTenantBranding } from "@/components/providers/tenant-branding-provider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Send, MessageSquare, Loader2, User } from "lucide-react"
import { toast } from "@/hooks/use-toast"
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

export default function GuruMessagesPage() {
  const { branding } = useTenantBranding()
  const tenantId = branding.id

  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"inbox" | "sent" | "compose">("inbox")

  // Form State
  const [body, setBody] = useState("")
  const [subject, setSubject] = useState("")
  const [sending, setSending] = useState(false)

  const fetchMessages = (type: "inbox" | "sent") => {
    if (!tenantId) return
    setLoading(true)
    fetch(`/api/tenant/messages?tenantId=${tenantId}&type=${type}`)
      .then(r => r.json())
      .then(d => {
        setMessages(Array.isArray(d) ? d : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    if (activeTab === "inbox" || activeTab === "sent") {
      fetchMessages(activeTab)
    }
  }, [activeTab, tenantId])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!body.trim()) {
      toast({ title: "Pesan kosong", description: "Silakan isi pesan Anda terlebih dahulu.", variant: "destructive" })
      return
    }

    setSending(true)
    try {
      const res = await fetch("/api/tenant/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId,
          receiverId: null, // Mengirim ke Admin
          subject,
          body
        })
      })

      if (res.ok) {
        toast({ title: "Pesan terkirim ke Admin" })
        setBody("")
        setSubject("")
        setActiveTab("sent")
      } else {
        const d = await res.json()
        toast({ title: "Gagal", description: d.error, variant: "destructive" })
      }
    } catch {
      toast({ title: "Gagal mengirim pesan", variant: "destructive" })
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pesan Internal</h1>
          <p className="text-muted-foreground mt-1 text-sm">Berkomunikasi langsung dengan Admin / Pihak Sekolah.</p>
        </div>
      </div>

      <div className="flex gap-2 p-1 bg-muted/50 rounded-xl w-fit">
        <Button 
          variant={activeTab === "inbox" ? "default" : "ghost"} 
          className={activeTab === "inbox" ? "shadow-sm rounded-lg" : "rounded-lg"}
          onClick={() => setActiveTab("inbox")}
        >
          Kotak Masuk
        </Button>
        <Button 
          variant={activeTab === "sent" ? "default" : "ghost"} 
          className={activeTab === "sent" ? "shadow-sm rounded-lg" : "rounded-lg"}
          onClick={() => setActiveTab("sent")}
        >
          Pesan Terkirim
        </Button>
        <Button 
          variant={activeTab === "compose" ? "default" : "ghost"} 
          className={activeTab === "compose" ? "shadow-sm rounded-lg btn-gradient text-white border-0" : "rounded-lg"}
          onClick={() => setActiveTab("compose")}
        >
          Tulis Pesan
        </Button>
      </div>

      <Card className="glass border-0 min-h-[400px]">
        <CardContent className="p-6">
          {activeTab === "compose" ? (
            <form onSubmit={handleSend} className="space-y-4 max-w-2xl">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Kepada</label>
                <div className="p-3 bg-muted/30 rounded-xl border border-border/50 text-sm flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-semibold text-foreground">Admin Sekolah</span> (Broadcast ke semua admin)
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Subjek (Opsional)</label>
                <Input 
                  value={subject} 
                  onChange={(e) => setSubject(e.target.value)} 
                  placeholder="Contoh: Pengajuan Cuti" 
                  className="rounded-xl"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Pesan</label>
                <Textarea 
                  value={body} 
                  onChange={(e) => setBody(e.target.value)} 
                  placeholder="Tulis pesan Anda di sini..." 
                  className="min-h-[150px] rounded-xl resize-y"
                  required
                />
              </div>
              <Button type="submit" disabled={sending || !body.trim()} className="rounded-xl gap-2 px-6">
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Kirim Pesan
              </Button>
            </form>
          ) : (
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
                  <p className="text-muted-foreground">Tidak ada pesan di {activeTab === "inbox" ? "kotak masuk" : "pesan terkirim"}.</p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div key={msg.id} className="p-4 rounded-xl border border-border/50 bg-background/50 hover:bg-muted/20 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                          {activeTab === "inbox" ? msg.sender.name.charAt(0) : "Anda".charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-sm">
                            {activeTab === "inbox" ? msg.sender.name : `Ke: ${msg.receiver ? msg.receiver.name : "Admin Sekolah"}`}
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
          )}
        </CardContent>
      </Card>
    </div>
  )
}
