"use client"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

import { useEffect, useState } from"react"
import { useTenantBranding } from"@/components/providers/tenant-branding-provider"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from"@/components/ui/card"
import { Button } from"@/components/ui/button"
import { ConfirmDialog } from"@/components/shared/confirm-dialog"
import { toast } from"@/hooks/use-toast"
import { Plus, Edit2, Trash2, FileText, Globe, Clock, XCircle, ImageIcon, Eye } from"lucide-react"
import Link from"next/link"
import Image from"next/image"
import { format } from"date-fns"
import { normalizeImageUrl } from"@/lib/utils"

interface Post {
  id: string
  title: string
  slug: string
  type: string
  status: string
  createdAt: string
  featuredImage?: string | null
  author: { name: string }
  category?: { name: string } | null
}

export default function PengumumanPage() {
  const { branding, isLoadingTenant } = useTenantBranding()
  const typeFilter ="PENGUMUMAN"
  
  const [loading, setLoading] = useState(true)
  const [posts, setPosts] = useState<Post[]>([])

  const tenantId = branding.id

  const loadPosts = () => {
    if (!tenantId) return
    setLoading(true)
    const url = `/api/tenant/posts?tenantId=${tenantId}${typeFilter ? `&type=${typeFilter}` :""}`
    fetch(url)
      .then(r => r.json())
      .then(d => {
        setPosts(Array.isArray(d) ? d : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    if (!isLoadingTenant && tenantId) {
      loadPosts()
    }
  }, [tenantId, isLoadingTenant, typeFilter])

  const deletePost = async (id: string) => {
    if (!tenantId) return
    try {
      const res = await fetch(`/api/tenant/posts/${id}?tenantId=${tenantId}`, { method:"DELETE" })
      if (res.ok) {
        toast({ title:"Artikel dihapus" })
        loadPosts()
      } else {
        const d = await res.json()
        toast({ title:"Gagal", description: d.error, variant:"destructive" })
      }
    } catch {
      toast({ title:"Gagal menghapus", variant:"destructive" })
    }
  }

  if (loading) return <div className="skeleton h-64 rounded-2xl" />

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{typeFilter ==="PENGUMUMAN" ?"Pengumuman" :"Artikel & Pos"}</h1>
          <p className="text-muted-foreground mt-1">{typeFilter ==="PENGUMUMAN" ?"Kelola papan pengumuman sekolah untuk siswa dan publik." :"Kelola pos editorial, blog guru, dan pengumuman."}</p>
        </div>
        <Button asChild className="gap-2 btn-gradient text-white border-0 rounded-xl flex items-center justify-center h-10 px-4">
          <Link href={`/admin/website/pengumuman/new`}>
            <Plus className="h-4 w-4" /> Tulis Pengumuman Baru
          </Link>
        </Button>
      </div>

      <Card className="glass border-0">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Daftar {typeFilter ==="PENGUMUMAN" ?"Pengumuman" :"Artikel"}</CardTitle>
          <CardDescription className="text-xs">Daftar semua {typeFilter ==="PENGUMUMAN" ?"pengumuman" :"tulisan"} yang ada di website sekolah.</CardDescription>
        </CardHeader>
        <CardContent>
          {posts.length === 0 ? (
            <div className="py-12 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
              <p className="font-semibold mb-1">Belum ada pengumuman</p>
              <p className="text-sm text-muted-foreground mb-4">Mulai tulis pengumuman pertama Anda untuk website.</p>
              <Button asChild variant="outline" className="rounded-xl">
                <Link href="/admin/website/pengumuman/new">Tulis Sekarang</Link>
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="px-4 py-3 font-medium rounded-tl-lg">Judul Artikel</TableHead>
                    <TableHead className="px-4 py-3 font-medium">Tipe</TableHead>
                    <TableHead className="px-4 py-3 font-medium">Status</TableHead>
                    <TableHead className="px-4 py-3 font-medium">Penulis</TableHead>
                    <TableHead className="px-4 py-3 font-medium">Tanggal</TableHead>
                    <TableHead className="px-4 py-3 font-medium text-right rounded-tr-lg">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {posts.map(post => (
                    <TableRow key={post.id} className="border-b last:border-0 hover:bg-muted/10 transition-colors">
                      <TableCell className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {normalizeImageUrl(post.featuredImage) ? (
                            <div className="relative h-10 w-16 shrink-0 rounded overflow-hidden border">
                              <Image 
                                src={normalizeImageUrl(post.featuredImage)!} 
                                alt={post.title} 
                                fill 
                                className="object-cover" 
                                
                                onError={(e) => {
                                  const target = e.currentTarget
                                  target.style.display = 'none'
                                  if (target.parentElement) {
                                    target.parentElement.classList.add('flex', 'items-center', 'justify-center', 'bg-muted/50')
                                    target.parentElement.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-muted-foreground"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>'
                                  }
                                }}
                              />
                            </div>
                          ) : (
                            <div className="flex h-10 w-16 shrink-0 items-center justify-center rounded border bg-muted/50">
                              <ImageIcon className="h-4 w-4 text-muted-foreground" />
                            </div>
                          )}
                          <div>
                            <div className="font-medium text-foreground line-clamp-1" title={post.title}>{post.title}</div>
                            <div className="text-[11px] text-muted-foreground font-mono mt-0.5 line-clamp-1">/{post.slug}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-primary/10 text-primary">
                          {post.type.replace('_', ' ')}
                        </span>
                        {post.category?.name && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground ml-1">
                            {post.category.name}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        {post.status ==="PUBLISHED" && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-500/10 px-2 rounded-full py-0.5">
                            <Globe className="h-3 w-3" /> Publik
                          </span>
                        )}
                        {post.status ==="PENDING" && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 bg-blue-500/10 px-2 rounded-full py-0.5">
                            <Clock className="h-3 w-3" /> Perlu Review
                          </span>
                        )}
                        {post.status ==="REJECTED" && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 bg-rose-500/10 px-2 rounded-full py-0.5">
                            <XCircle className="h-3 w-3" /> Ditolak
                          </span>
                        )}
                        {post.status ==="DRAFT" && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 bg-amber-500/10 px-2 rounded-full py-0.5">
                            <FileText className="h-3 w-3" /> Draft
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-muted-foreground">{post.author?.name}</TableCell>
                      <TableCell className="px-4 py-3 text-muted-foreground">{format(new Date(post.createdAt), 'dd MMM yyyy')}</TableCell>
                      <TableCell className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {post.status ==="PUBLISHED" && (
                            <Button asChild variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:bg-primary/10 hover:text-blue-600" title="Lihat di website">
                              <a href={`/pengumuman/${post.slug}`} target="_blank" rel="noopener noreferrer">
                                <Eye className="h-4 w-4" />
                              </a>
                            </Button>
                          )}
                          <Button asChild variant="ghost" size="icon" className="h-8 w-8 text-primary hover:bg-primary/10 hover:text-primary">
                            <Link href={`/admin/website/pengumuman/${post.id}`}>
                              <Edit2 className="h-4 w-4" />
                            </Link>
                          </Button>
                          <ConfirmDialog
                            trigger={
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            }
                            title="Hapus artikel ini?"
                            description="Tindakan ini tidak dapat dibatalkan."
                            confirmText="Ya, hapus"
                            onConfirm={() => deletePost(post.id)}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
