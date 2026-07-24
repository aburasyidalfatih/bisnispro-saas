"use client"

import { useEffect, useState } from"react"
import { useTenantBranding } from"@/components/providers/tenant-branding-provider"
import { MessageSquare, Users, Globe } from"lucide-react"
import { cn } from"@/lib/utils"
import { toast } from"@/hooks/use-toast"

import { Message, Submission } from"./_components/types"
import { InternalMessages } from"./_components/internal-messages"
import { WebsiteMessages } from"./_components/website-messages"
import { Announcements } from"./_components/announcements"
import { Button } from "@/components/ui/button"

export default function AdminMessagesPage() {
  const { branding } = useTenantBranding()
  const tenantId = branding.id

  const [activeTab, setActiveTab] = useState<"internal" |"website" |"pengumuman">("pengumuman")
  
  // Pengumuman Form State
  const [showAddModal, setShowAddModal] = useState(false)
  const [addForm, setAddForm] = useState({ title:"", content:"", target:"PENGUMUMAN_SEMUA" })
  const [submittingAnnounce, setSubmittingAnnounce] = useState(false)
  
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

  // Edit Pengumuman State
  const [showEditModal, setShowEditModal] = useState(false)
  const [editForm, setEditForm] = useState({ id:"", title:"", content:"", target:"PENGUMUMAN_SEMUA" })
  const [submittingEdit, setSubmittingEdit] = useState(false)

  // Compose Internal Message State
  const [showComposeModal, setShowComposeModal] = useState(false)
  const [composeForm, setComposeForm] = useState({ receiverId:"", subject:"", body:"" })
  const [submittingCompose, setSubmittingCompose] = useState(false)
  const [tenantUsers, setTenantUsers] = useState<any[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)

  useEffect(() => {
    if (!tenantId) return

    // Fetch Internal
    if (activeTab ==="internal") {
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
    if (activeTab ==="website") {
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
    if (activeTab ==="pengumuman") {
      setLoadingAnnouncements(true)
      fetch(`/api/tenant/posts?tenantId=${tenantId}&type=INTERNAL_ANNOUNCEMENTS`)
        .then(r => {
           if(!r.ok) throw new Error("Failed to fetch")
           return r.json()
        })
        .then(d => {
          setAnnouncements(d.data || d || [])
          setLoadingAnnouncements(false)
        })
        .catch(() => setLoadingAnnouncements(false))
    }
  }, [tenantId, activeTab])

  useEffect(() => {
    if (showComposeModal && tenantUsers.length === 0 && tenantId) {
      setLoadingUsers(true)
      fetch(`/api/tenant/users?tenantId=${tenantId}`)
        .then(r => r.json())
        .then(d => {
          const validUsers = (d.data || []).filter((u: any) => ["staf","admin","owner"].includes(u.role))
          setTenantUsers(validUsers)
          setLoadingUsers(false)
        })
        .catch(() => setLoadingUsers(false))
    }
  }, [showComposeModal, tenantId, tenantUsers.length])

  const submitComposeMessage = async () => {
    if (!composeForm.receiverId || !composeForm.body) { toast({ title:"Penerima dan pesan wajib diisi", variant:"destructive" }); return; }
    setSubmittingCompose(true)
    try {
      const res = await fetch("/api/tenant/messages", {
        method:"POST", headers: {"Content-Type":"application/json" },
        body: JSON.stringify({
          tenantId, receiverId: composeForm.receiverId, subject: composeForm.subject, body: composeForm.body
        })
      })
      if (!res.ok) throw new Error("Gagal mengirim pesan")
      toast({ title:"Berhasil", description:"Pesan terkirim." })
      setShowComposeModal(false)
      setComposeForm({ receiverId:"", subject:"", body:"" })
      
      setLoadingInternal(true)
      const d = await fetch(`/api/tenant/messages?tenantId=${tenantId}&type=inbox`).then(r => r.json())
      setMessages(Array.isArray(d) ? d : [])
      setLoadingInternal(false)
    } catch (error: any) {
      toast({ title:"Gagal", description: error.message, variant:"destructive" })
    } finally {
      setSubmittingCompose(false)
    }
  }

  const submitAnnouncement = async () => {
    if (!addForm.title || !addForm.content) { toast({ title:"Judul dan isi wajib diisi", variant:"destructive" }); return; }
    setSubmittingAnnounce(true)
    try {
      const slug = addForm.title.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"") +"-" + Date.now();
      const res = await fetch("/api/tenant/posts", {
        method:"POST", headers: {"Content-Type":"application/json" },
        body: JSON.stringify({
          tenantId, title: addForm.title, slug, content: addForm.content,
          type: addForm.target, status:"PUBLISHED"
        })
      })
      if (!res.ok) throw new Error("Gagal membuat pengumuman")
      toast({ title:"Berhasil", description:"Pengumuman berhasil diterbitkan." })
      setShowAddModal(false)
      setAddForm({ title:"", content:"", target:"PENGUMUMAN_SEMUA" })
      setLoadingAnnouncements(true)
      const d = await fetch(`/api/tenant/posts?tenantId=${tenantId}&type=INTERNAL_ANNOUNCEMENTS`).then(r => r.json())
      setAnnouncements(d.data || d || [])
    } catch (error: any) {
      toast({ title:"Gagal", description: error.message, variant:"destructive" })
    } finally {
      setSubmittingAnnounce(false)
    }
  }

  const openEditModal = (post: any) => {
    setEditForm({ id: post.id, title: post.title, content: post.content, target: post.type })
    setShowEditModal(true)
  }

  const submitEditAnnouncement = async () => {
    if (!editForm.title || !editForm.content) { toast({ title:"Judul dan isi wajib diisi", variant:"destructive" }); return; }
    setSubmittingEdit(true)
    try {
      const slug = editForm.title.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"") +"-" + Date.now();
      const res = await fetch(`/api/tenant/posts/${editForm.id}`, {
        method:"PUT", headers: {"Content-Type":"application/json" },
        body: JSON.stringify({
          tenantId, title: editForm.title, slug, content: editForm.content, type: editForm.target
        })
      })
      if (!res.ok) throw new Error("Gagal memperbarui pengumuman")
      toast({ title:"Berhasil", description:"Pengumuman diperbarui." })
      setShowEditModal(false)
      setLoadingAnnouncements(true)
      const d = await fetch(`/api/tenant/posts?tenantId=${tenantId}&type=INTERNAL_ANNOUNCEMENTS`).then(r => r.json())
      setAnnouncements(d.data || d || [])
    } catch (error: any) {
      toast({ title:"Gagal", description: error.message, variant:"destructive" })
    } finally {
      setSubmittingEdit(false)
    }
  }

  const deleteAnnouncement = async (id: string) => {
    try {
      const res = await fetch(`/api/tenant/posts/${id}?tenantId=${tenantId}`, { method:"DELETE" })
      if (!res.ok) throw new Error("Gagal menghapus pengumuman")
      toast({ title:"Berhasil", description:"Pengumuman dihapus." })
      setAnnouncements(p => p.filter(x => x.id !== id))
    } catch (error: any) {
      toast({ title:"Gagal", description: error.message, variant:"destructive" })
    }
  }

  // Website Messages Actions
  const markRead = async (id: string) => {
    if (!tenantId) return
    setSubmissions(p => p.map(s => s.id === id ? { ...s, isRead: true } : s))
    setUnread(p => Math.max(0, p - 1))
    await fetch(`/api/tenant/contact-submissions`, { 
      method:"PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tenantId, id })
    })
  }

  const markAllRead = async () => {
    if (!tenantId) return
    setSubmissions(p => p.map(s => ({ ...s, isRead: true })))
    setUnread(0)
    await fetch(`/api/tenant/contact-submissions`, { 
      method:"PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tenantId, all: true })
    })
  }

  const deleteSubmission = async (id: string) => {
    if (!tenantId) return
    const s = submissions.find(s => s.id === id)
    setSubmissions(p => p.filter(s => s.id !== id))
    if (s && !s.isRead) setUnread(p => Math.max(0, p - 1))
    const res = await fetch(`/api/tenant/contact-submissions`, { 
      method:"DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tenantId, id })
    })
    if (res.ok) toast({ title:"Berhasil", description:"Pesan dihapus." })
  }

  const toggleExpand = (id: string) => {
    if (expandedId === id) { setExpandedId(null); return }
    setExpandedId(id)
    const sub = submissions.find(s => s.id === id)
    if (sub && !sub.isRead) markRead(id)
  }

  return (
    <div className="space-y-6  pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Kotak Masuk & Pengumuman</h1>
          <p className="text-muted-foreground mt-1 text-sm">Kelola pesan masuk internal, pengunjung website, dan papan pengumuman.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 rounded-xl border p-1 w-fit">
        <Button variant="ghost" onClick={() => setActiveTab("pengumuman")}
          className={cn("px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2",
            activeTab ==="pengumuman" ?"bg-primary text-white" :"hover:bg-muted")}>
          <MessageSquare className="h-4 w-4" />
          Pengumuman
        </Button>
        <Button variant="ghost" onClick={() => setActiveTab("internal")}
          className={cn("px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2",
            activeTab ==="internal" ?"bg-primary text-white" :"hover:bg-muted")}>
          <Users className="h-4 w-4" />
          Pesan Internal (GTK)
        </Button>
        <Button variant="ghost" onClick={() => setActiveTab("website")}
          className={cn("px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2",
            activeTab ==="website" ?"bg-primary text-white" :"hover:bg-muted")}>
          <Globe className="h-4 w-4" />
          Pesan Website Publik
          {unread > 0 && (
            <span className={cn("rounded-full px-1.5 py-0.5 text-[10px] font-bold",
              activeTab ==="website" ?"bg-white text-primary" :"bg-primary text-white")}>
              {unread}
            </span>
          )}
        </Button>
      </div>

      {activeTab ==="internal" && (
        <InternalMessages
          messages={messages}
          loadingInternal={loadingInternal}
          showComposeModal={showComposeModal}
          setShowComposeModal={setShowComposeModal}
          composeForm={composeForm}
          setComposeForm={setComposeForm}
          loadingUsers={loadingUsers}
          tenantUsers={tenantUsers}
          submitComposeMessage={submitComposeMessage}
          submittingCompose={submittingCompose}
        />
      )}

      {activeTab ==="website" && (
        <WebsiteMessages
          submissions={submissions}
          loadingWebsite={loadingWebsite}
          unread={unread}
          markAllRead={markAllRead}
          expandedId={expandedId}
          toggleExpand={toggleExpand}
          deleteSubmission={deleteSubmission}
        />
      )}

      {activeTab ==="pengumuman" && (
        <Announcements
          announcements={announcements}
          loadingAnnouncements={loadingAnnouncements}
          showAddModal={showAddModal}
          setShowAddModal={setShowAddModal}
          addForm={addForm}
          setAddForm={setAddForm}
          submitAnnouncement={submitAnnouncement}
          submittingAnnounce={submittingAnnounce}
          showEditModal={showEditModal}
          setShowEditModal={setShowEditModal}
          editForm={editForm}
          setEditForm={setEditForm}
          submitEditAnnouncement={submitEditAnnouncement}
          submittingEdit={submittingEdit}
          openEditModal={openEditModal}
          deleteAnnouncement={deleteAnnouncement}
        />
      )}
    </div>
  )
}
