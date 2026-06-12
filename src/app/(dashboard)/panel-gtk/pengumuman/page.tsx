"use client"

import { useEffect, useState } from "react"
import DOMPurify from "isomorphic-dompurify"
import { useTenantBranding } from "@/components/providers/tenant-branding-provider"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Loader2, Bell } from "lucide-react"
import { format } from "date-fns"
import { id } from "date-fns/locale"

export default function GuruPengumumanPage() {
  const { branding } = useTenantBranding()
  const tenantId = branding.id

  const [loading, setLoading] = useState(true)
  const [announcements, setAnnouncements] = useState<any[]>([])

  const fetchAnnouncements = () => {
    if (!tenantId) return
    setLoading(true)
    fetch(`/api/tenant/posts?tenantId=${tenantId}&type=PENGUMUMAN_GTK`, { cache: "no-store" })
      .then(r => {
         if(!r.ok) throw new Error("Failed to fetch")
         return r.json()
      })
      .then(d => {
        const data = d.data || d || []
        setAnnouncements(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    fetchAnnouncements()
  }, [tenantId])

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pengumuman</h1>
          <p className="text-muted-foreground mt-1 text-sm">Informasi dan kebijakan penting dari Admin Sekolah.</p>
        </div>
      </div>

      <Card className="glass border-0 min-h-[400px]">
        <CardContent className="p-6">
          <div className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : announcements.length === 0 ? (
              <div className="text-center py-16 flex flex-col items-center">
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                  <Bell className="h-6 w-6 text-muted-foreground/50" />
                </div>
                <p className="text-muted-foreground">Tidak ada pengumuman saat ini.</p>
              </div>
            ) : (
              announcements.map((post) => (
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
                  <div className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content || "") }} />
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
