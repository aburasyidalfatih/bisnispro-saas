"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { toast } from "@/hooks/use-toast"
import { Save, Phone, MapPin, Mail, Globe, MessageCircle, ExternalLink, Inbox, Check, Trash2, ChevronDown, ChevronUp } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatDateTime } from "@/lib/utils"

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

export default function WebsiteContactPage() {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [tenantId, setTenantId] = useState<string | null>(null)
  const [slug, setSlug] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"info" | "submissions">("info")
  const [form, setForm] = useState({
    address: "", phone: "", email: "", website: "",
    whatsapp: "", instagram: "", facebook: "", youtube: "",
  })

  // Submissions state
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [unread, setUnread] = useState(0)
  const [subLoading, setSubLoading] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    const id = session?.user?.tenants?.[0]?.id
    const s = session?.user?.tenants?.[0]?.slug
    if (id) { setTenantId(id); setSlug(s || null); return }
    const match = document.cookie.match(/impersonate-tenant=([^;]+)/)
    const impSlug = match?.[1]
    if (impSlug) {
      setSlug(impSlug)
      fetch(`/api/tenant/by-slug?slug=${impSlug}`).then(r => r.json()).then(d => { if (d.id) setTenantId(d.id) })
    }
  }, [session?.user?.tenants])

  useEffect(() => {
    if (!tenantId) return
    fetch(`/api/tenant/website?tenantId=${tenantId}`)
      .then(r => r.json())
      .then(d => {
        setForm({
          address: d.address || "", phone: d.phone || "", email: d.email || "",
          website: d.website || "", whatsapp: d.whatsapp || "", instagram: d.instagram || "",
          facebook: d.facebook || "", youtube: d.youtube || "",
        })
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [tenantId])

  const loadSubmissions = async () => {
    if (!tenantId) return
    setSubLoading(true)
    const res = await fetch(`/api/tenant/contact-submissions?tenantId=${tenantId}`)
    const d = await res.json()
    setSubmissions(d.data || [])
    setUnread(d.unread || 0)
    setSubLoading(false)
  }

  useEffect(() => {
    if (activeTab === "submissions" && tenantId) loadSubmissions()
  }, [activeTab, tenantId])

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [field]: e.target.value }))

  const handleSave = async () => {
    if (!tenantId) return
    setSaving(true)
    const res = await fetch("/api/tenant/website", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tenantId, ...form }),
    })
    setSaving(false)
    if (res.ok) toast({ title: "Disimpan", description: "Informasi kontak berhasil diperbarui." })
    else toast({ title: "Gagal", description: "Terjadi kesalahan.", variant: "destructive" })
  }

  const markRead = async (id: string) => {
    setSubmissions(prev => prev.map(s => s.id === id ? { ...s, isRead: true } : s))
    setUnread(prev => Math.max(0, prev - 1))
    await fetch("/api/tenant/contact-submissions", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tenantId, id }),
    })
  }

  const markAllRead = async () => {
    setSubmissions(prev => prev.map(s => ({ ...s, isRead: true })))
    setUnread(0)
    await fetch("/api/tenant/contact-submissions", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tenantId, all: true }),
    })
  }

  const deleteSubmission = async (id: string) => {
    setSubmissions(prev => prev.filter(s => s.id !== id))
    await fetch("/api/tenant/contact-submissions", {
      method: "DELETE", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tenantId, id }),
    })
    toast({ title: "Pesan dihapus" })
  }

  const toggleExpand = (id: string) => {
    if (expandedId === id) { setExpandedId(null); return }
    setExpandedId(id)
    const sub = submissions.find(s => s.id === id)
    if (sub && !sub.isRead) markRead(id)
  }

  if (loading) return <div className="space-y-4">{[1,2].map(i => <div key={i} className="skeleton h-48 rounded-2xl" />)}</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Kontak & Pesan Masuk</h1>
          <p className="text-muted-foreground mt-1">Kelola informasi kontak dan lihat pesan dari pengunjung website.</p>
        </div>
        <div className="flex items-center gap-2">
          {slug && (
            <a href={`/site/${slug}/contact`} target="_blank" rel="noopener"
              className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
              <ExternalLink className="h-3.5 w-3.5" /> Lihat Halaman
            </a>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl border p-1 w-fit">
        <button onClick={() => setActiveTab("info")}
          className={cn("px-4 py-2 rounded-lg text-sm font-medium transition-colors",
            activeTab === "info" ? "bg-primary text-white" : "hover:bg-muted")}>
          Informasi Kontak
        </button>
        <button onClick={() => setActiveTab("submissions")}
          className={cn("px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2",
            activeTab === "submissions" ? "bg-primary text-white" : "hover:bg-muted")}>
          <Inbox className="h-4 w-4" />
          Pesan Masuk
          {unread > 0 && (
            <span className={cn("rounded-full px-1.5 py-0.5 text-[10px] font-bold",
              activeTab === "submissions" ? "bg-white text-primary" : "bg-primary text-white")}>
              {unread}
            </span>
          )}
        </button>
      </div>

      {activeTab === "info" && (
        <>
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Kontak Utama */}
            <Card className="glass border-0">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                    <Phone className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Kontak Utama</CardTitle>
                    <CardDescription>Alamat, telepon, dan email</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> Alamat</Label>
                  <textarea value={form.address} onChange={set("address")}
                    placeholder="Jl. Contoh No. 123, Kota, Provinsi" rows={3}
                    className="flex w-full rounded-xl border border-input bg-background px-3 py-2 text-sm resize-none" />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /> Nomor Telepon</Label>
                  <Input value={form.phone} onChange={set("phone")} placeholder="021-12345678" className="rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> Email</Label>
                  <Input type="email" value={form.email} onChange={set("email")} placeholder="info@organisasi.com" className="rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5"><Globe className="h-3.5 w-3.5" /> Website</Label>
                  <Input value={form.website} onChange={set("website")} placeholder="https://www.organisasi.com" className="rounded-xl" />
                </div>
              </CardContent>
            </Card>

            {/* Media Sosial */}
            <Card className="glass border-0">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                    <MessageCircle className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Media Sosial</CardTitle>
                    <CardDescription>WhatsApp, Instagram, Facebook, YouTube</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>💬 WhatsApp</Label>
                  <Input value={form.whatsapp} onChange={set("whatsapp")} placeholder="6281234567890" className="rounded-xl" />
                  <p className="text-xs text-muted-foreground">Format internasional tanpa + (contoh: 6281234567890)</p>
                </div>
                <div className="space-y-2">
                  <Label>📷 Instagram</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground shrink-0">@</span>
                    <Input value={form.instagram} onChange={set("instagram")} placeholder="username" className="rounded-xl" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>📘 Facebook</Label>
                  <Input value={form.facebook} onChange={set("facebook")} placeholder="nama-halaman" className="rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label>▶️ YouTube</Label>
                  <Input value={form.youtube} onChange={set("youtube")} placeholder="@channel" className="rounded-xl" />
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="flex justify-end">
            <Button className="gap-2 btn-gradient text-white border-0 rounded-xl" onClick={handleSave} disabled={saving}>
              {saving ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <Save className="h-4 w-4" />}
              Simpan Kontak
            </Button>
          </div>
        </>
      )}

      {activeTab === "submissions" && (
        <Card className="glass border-0">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                  <Inbox className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Pesan Masuk</CardTitle>
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
            {subLoading ? (
              <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="skeleton h-16 rounded-xl" />)}</div>
            ) : submissions.length === 0 ? (
              <div className="text-center py-12">
                <Inbox className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">Belum ada pesan masuk</p>
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
        </Card>
      )}
    </div>
  )
}
