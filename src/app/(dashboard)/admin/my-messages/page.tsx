"use client"

import { useEffect, useState } from "react"
import { useTenantBranding } from "@/components/providers/tenant-branding-provider"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { MessageSquare, Loader2, Inbox, Mail, Check, Trash2, ChevronDown, ChevronUp, Users, Globe } from "lucide-react"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { toast } from "@/hooks/use-toast"

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

interface Submission {
  id: string
  name: string
  email: string
  phone: string | null
  subject: string | null
  message: string
  isRead: boolean
  createdAt: string
}

export default function AdminMessagesPage() {
  const { branding } = useTenantBranding()
  const tenantId = branding.id

  const [activeTab, setActiveTab] = useState<"internal" | "website" | "pengumuman">("internal")
  
  // Internal Messages State
  const [messages, setMessages] = useState<Message[]>([])
  const [loadingInternal, setLoadingInternal] = useState(true)

  // Website Submissions State
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loadingWebsite, setLoadingWebsite] = useState(true)
  const [unread, setUnread] = useState(0)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // Pengumuman State
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(true)

  useEffect(() => {
    if (!tenantId) return

    // Fetch Internal
    if (activeTab === "internal") {
      setLoadingInternal(true)
      fetch(`/api/tenant/messages?tenantId=${tenantId}&type=inbox`)
        .then(r => r.json())
        .then(d => {
          setMessages(Array.isArray(d) ? d : [])
          setLoadingInternal(false)
        })
        .catch(() => setLoadingInternal(false))
    }

    // Fetch Website
    if (activeTab === "website") {
      setLoadingWebsite(true)
      fetch(`/api/tenant/contact-submissions?tenantId=${tenantId}`)
        .then(r => r.json())
        .then(d => {
          setSubmissions(d.data || [])
          setUnread(d.unread || 0)
          setLoadingWebsite(false)
        })
        .catch(() => setLoadingWebsite(false))
    }

    // Fetch Pengumuman
    if (activeTab === "pengumuman") {
      setLoadingAnnouncements(true)
      fetch(`/api/tenant/posts?tenantId=${tenantId}&type=PENGUMUMAN`)
        .then(r => {
           if(!r.ok) throw new Error("Failed to fetch")
           return r.json()
        })
        .then(d => {
          setAnnouncements(d.data || [])
          setLoadingAnnouncements(false)
        })
        .catch(() => setLoadingAnnouncements(false))
    }
  }, [tenantId, activeTab])

  // Website Messages Actions
  const markRead = async (id: string) => {
    if (!tenantId) return
    setSubmissions(p => p.map(s => s.id === id ? { ...s, isRead: true } : s))
    setUnread(p => Math.max(0, p - 1))
    await fetch(`/api/tenant/contact-submissions?id=${id}&tenantId=${tenantId}`, { method: "PUT" })
  }

  const markAllRead = async () => {
    if (!tenantId) return
    setSubmissions(p => p.map(s => ({ ...s, isRead: true })))
    setUnread(0)
    await fetch(`/api/tenant/contact-submissions?tenantId=${tenantId}&action=markAllRead`, { method: "PUT" })
  }

  const deleteSubmission = async (id: string) => {
    if (!tenantId) return
    const s = submissions.find(s => s.id === id)
    setSubmissions(p => p.filter(s => s.id !== id))
    if (s && !s.isRead) setUnread(p => Math.max(0, p - 1))
    const res = await fetch(`/api/tenant/contact-submissions?id=${id}&tenantId=${tenantId}`, { method: "DELETE" })
    if (res.ok) toast({ title: "Berhasil", description: "Pesan dihapus." })
  }

  const toggleExpand = (id: string) => {
    if (expandedId === id) { setExpandedId(null); return }
    setExpandedId(id)
    const sub = submissions.find(s => s.id === id)
    if (sub && !sub.isRead) markRead(id)
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Kotak Masuk & Pengumuman</h1>
          <p className="text-muted-foreground mt-1 text-sm">Kelola pesan masuk internal, pengunjung website, dan papan pengumuman.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 rounded-xl border p-1 w-fit">
        <button onClick={() => setActiveTab("internal")}
          className={cn("px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2",
            activeTab === "internal" ? "bg-primary text-white" : "hover:bg-muted")}>
          <Users className="h-4 w-4" />
          Pesan Internal (GTK)
        </button>
        <button onClick={() => setActiveTab("website")}
          className={cn("px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2",
            activeTab === "website" ? "bg-primary text-white" : "hover:bg-muted")}>
          <Globe className="h-4 w-4" />
          Pesan Website Publik
          {unread > 0 && (
            <span className={cn("rounded-full px-1.5 py-0.5 text-[10px] font-bold",
              activeTab === "website" ? "bg-white text-primary" : "bg-primary text-white")}>
              {unread}
            </span>
          )}
        </button>
        <button onClick={() => setActiveTab("pengumuman")}
          className={cn("px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2",
            activeTab === "pengumuman" ? "bg-primary text-white" : "hover:bg-muted")}>
          <MessageSquare className="h-4 w-4" />
          Pengumuman
        </button>
      </div>

      {activeTab === "internal" && (
        <Card className="glass border-0 min-h-[400px]">
          <CardContent className="p-6">
            <div className="space-y-4">
              {loadingInternal ? (
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
      )}

      {activeTab === "website" && (
        <Card className="glass border-0">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                  <Inbox className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Pesan Website Publik</CardTitle>
                  <CardDescription>
                    {unread > 0 ? `${unread} pesan belum dibaca` : "Semua pesan sudah dibaca"}
                  </CardDescription>
                </div>
              </div>
              {unread > 0 && (
                <Button variant="outline" size="sm" className="gap-2 rounded-xl" onClick={markAllRead}>
                  <Check className="h-3.5 w-3.5" /> Tandai Semua Dibaca
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {loadingWebsite ? (
              <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />)}</div>
            ) : submissions.length === 0 ? (
              <div className="text-center py-12">
                <Inbox className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">Belum ada pesan dari pengunjung website</p>
              </div>
            ) : (
              <div className="space-y-2">
                {submissions.map(sub => (
                  <div key={sub.id}
                    className={cn("rounded-xl border transition-colors",
                      !sub.isRead ? "border-primary/30 bg-primary/5" : "border-border")}>
                    <button
                      onClick={() => toggleExpand(sub.id)}
                      className="flex w-full items-center gap-3 p-4 text-left">
                      <div className={cn("h-2 w-2 rounded-full shrink-0", !sub.isRead ? "bg-primary" : "bg-transparent")} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={cn("text-sm truncate", !sub.isRead && "font-semibold")}>{sub.name}</p>
                          <span className="text-xs text-muted-foreground shrink-0">{sub.email}</span>
                        </div>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {sub.subject ? `${sub.subject}: ` : ""}{sub.message}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-muted-foreground">
                          {new Date(sub.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                        </span>
                        {expandedId === sub.id ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                      </div>
                    </button>

                    {expandedId === sub.id && (
                      <div className="px-4 pb-4 border-t pt-3 space-y-3">
                        <div className="grid sm:grid-cols-3 gap-3 text-sm">
                          <div>
                            <p className="text-xs text-muted-foreground">Nama</p>
                            <p className="font-medium">{sub.name}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Email</p>
                            <a href={`mailto:${sub.email}`} className="font-medium text-primary hover:underline">{sub.email}</a>
                          </div>
                          {sub.phone && (
                            <div>
                              <p className="text-xs text-muted-foreground">Telepon</p>
                              <a href={`tel:${sub.phone}`} className="font-medium text-primary hover:underline">{sub.phone}</a>
                            </div>
                          )}
                        </div>
                        {sub.subject && (
                          <div>
                            <p className="text-xs text-muted-foreground">Subjek</p>
                            <p className="text-sm font-medium">{sub.subject}</p>
                          </div>
                        )}
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Pesan</p>
                          <p className="text-sm bg-muted/40 rounded-xl p-3 whitespace-pre-wrap">{sub.message}</p>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-muted-foreground">
                            Diterima: {new Date(sub.createdAt).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                          </p>
                          <div className="flex gap-2">
                            <a href={`mailto:${sub.email}?subject=Re: ${sub.subject || "Pesan Anda"}`}
                              className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline">
                              <Mail className="h-3.5 w-3.5" /> Balas via Email
                            </a>
                            <ConfirmDialog
                              trigger={
                                <Button variant="ghost" size="sm" className="h-7 text-xs text-destructive hover:text-destructive gap-1">
                                  <Trash2 className="h-3.5 w-3.5" /> Hapus
                                </Button>
                              }
                              title="Hapus pesan ini?"
                              description="Pesan akan dihapus secara permanen."
                              confirmText="Ya, hapus"
                              onConfirm={() => deleteSubmission(sub.id)}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
      {activeTab === "pengumuman" && (
        <Card className="glass border-0">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                  <MessageSquare className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Papan Pengumuman</CardTitle>
                  <CardDescription>
                    Pesan siaran untuk dibaca oleh seluruh civitas akademika
                  </CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loadingAnnouncements ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : announcements.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">Belum ada pengumuman yang diterbitkan.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {announcements.map((post) => (
                  <div key={post.id} className="p-4 rounded-xl border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                          A
                        </div>
                        <div>
                          <p className="font-semibold text-sm">Admin Sekolah</p>
                          <p className="text-[11px] text-muted-foreground">
                            {format(new Date(post.createdAt), "dd MMM yyyy, HH:mm", { locale: id })}
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold bg-primary text-primary-foreground px-2 py-0.5 rounded-full">PENGUMUMAN</span>
                    </div>
                    <h3 className="font-bold text-lg mb-2 mt-3 text-primary">{post.title}</h3>
                    <div className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed" dangerouslySetInnerHTML={{ __html: post.content }} />
                  </div>
                ))
              }
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
