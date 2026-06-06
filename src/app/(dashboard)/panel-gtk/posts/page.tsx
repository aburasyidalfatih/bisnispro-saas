"use client"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useTenantBranding } from "@/components/providers/tenant-branding-provider"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Edit, Eye, Clock, FileText, CheckCircle, XCircle } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { id } from "date-fns/locale"

interface Post {
  id: string
  title: string
  slug: string
  status: string
  type: string
  createdAt: string
  category?: { name: string } | null
}

export default function GTKPostsPage() {
  const { branding } = useTenantBranding()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!branding.id) return
    fetch(`/api/panel-gtk/posts?tenantId=${branding.id}`)
      .then(r => r.json())
      .then(d => {
        setPosts(Array.isArray(d) ? d : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [branding.id])

  return (
    <div className="space-y-6 pb-10 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Artikel Saya</h1>
          <p className="text-muted-foreground mt-1 text-sm">Kelola artikel dan berita yang Anda tulis.</p>
        </div>
        <Button asChild className="btn-gradient text-white rounded-xl shadow-sm hover:shadow-md transition-all gap-2">
          <Link href="/panel-gtk/posts/new">
            <Plus className="h-4 w-4" /> Tulis Artikel
          </Link>
        </Button>
      </div>

      <Card className="glass border-0">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="px-6 py-4 font-medium">Judul Artikel</TableHead>
                  <TableHead className="px-6 py-4 font-medium">Kategori</TableHead>
                  <TableHead className="px-6 py-4 font-medium">Tanggal</TableHead>
                  <TableHead className="px-6 py-4 font-medium">Status</TableHead>
                  <TableHead className="px-6 py-4 font-medium text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="px-6 py-8 text-center text-muted-foreground animate-pulse">Memuat data artikel...</TableCell>
                  </TableRow>
                ) : posts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                      <div className="flex flex-col items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
                          <FileText className="h-6 w-6 text-muted-foreground/50" />
                        </div>
                        <p>Anda belum menulis artikel apa pun.</p>
                        <Button asChild variant="outline" size="sm" className="mt-2 rounded-lg">
                          <Link href="/panel-gtk/posts/new">Mulai Menulis</Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  posts.map((post) => (
                    <TableRow key={post.id} className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors">
                      <TableCell className="px-6 py-4 font-medium text-foreground max-w-[300px] truncate">
                        {post.title}
                      </TableCell>
                      <TableCell className="px-6 py-4 text-muted-foreground">
                        {post.category?.name || "-"}
                      </TableCell>
                      <TableCell className="px-6 py-4 text-muted-foreground">
                        {format(new Date(post.createdAt), "dd MMM yyyy", { locale: id })}
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        {post.status === "PUBLISHED" && (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-600">
                            <CheckCircle className="h-3 w-3" /> Dipublikasikan
                          </span>
                        )}
                        {post.status === "PENDING" && (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-1 text-[11px] font-semibold text-amber-600">
                            <Clock className="h-3 w-3" /> Menunggu Review
                          </span>
                        )}
                        {post.status === "REJECTED" && (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/10 px-2.5 py-1 text-[11px] font-semibold text-rose-600">
                            <XCircle className="h-3 w-3" /> Ditolak / Perlu Revisi
                          </span>
                        )}
                        {post.status === "DRAFT" && (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-500/10 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                            <FileText className="h-3 w-3" /> Draf
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {post.status === "PUBLISHED" && (
                            <Button asChild variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-muted-foreground hover:bg-blue-500/10 hover:text-blue-600 transition-colors" title="Lihat di website">
                              <a href={`/berita/${post.slug}`} target="_blank" rel="noopener noreferrer">
                                <Eye className="h-4 w-4" />
                              </a>
                            </Button>
                          )}
                          <Button asChild variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors">
                            <Link href={`/panel-gtk/posts/${post.id}`} title="Edit Artikel">
                              <Edit className="h-4 w-4" />
                            </Link>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
