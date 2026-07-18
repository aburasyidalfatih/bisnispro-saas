"use client"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

import { useEffect, useState } from"react"
import { useTenantBranding } from"@/components/providers/tenant-branding-provider"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from"@/components/ui/card"
import { Button } from"@/components/ui/button"
import { ConfirmDialog } from"@/components/shared/confirm-dialog"
import { toast } from"@/hooks/use-toast"
import { Plus, Trash2, FileText, Download, ExternalLink } from"lucide-react"
import Link from"next/link"
import { format } from"date-fns"

interface Document {
  id: string
  title: string
  description?: string
  fileUrl: string
  mimeType: string
  size: number
  type: string
  createdAt: string
}

export default function DocumentsPage() {
  const { branding, isLoadingLembaga } = useTenantBranding()
  const [loading, setLoading] = useState(true)
  const [documents, setDocuments] = useState<Document[]>([])

  const tenantId = branding.id

  const loadDocuments = () => {
    if (!tenantId) return
    setLoading(true)
    fetch(`/api/tenant/documents?tenantId=${tenantId}`)
      .then(r => r.json())
      .then(d => {
        setDocuments(Array.isArray(d) ? d : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    if (!isLoadingLembaga && tenantId) {
      loadDocuments()
    }
  }, [tenantId, isLoadingTenant])

  const deleteDocument = async (id: string) => {
    if (!tenantId) return
    try {
      const res = await fetch(`/api/tenant/documents/${id}?tenantId=${tenantId}`, { method:"DELETE" })
      if (res.ok) {
        toast({ title:"Dokumen dihapus" })
        loadDocuments()
      } else {
        const d = await res.json()
        toast({ title:"Gagal", description: d.error, variant:"destructive" })
      }
    } catch {
      toast({ title:"Gagal menghapus", variant:"destructive" })
    }
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return"0 B"
    const k = 1024
    const sizes = ["B","KB","MB","GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) +"" + sizes[i]
  }

  const getTypeLabel = (type: string) => {
    if (type ==="MATERI_TUGAS") return"Materi / Tugas"
    if (type ==="UNDUHAN_UMUM") return"Unduhan Umum"
    return type
  }

  if (loading) return <div className="skeleton h-64 rounded-2xl" />

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pusat Unduhan</h1>
          <p className="text-muted-foreground mt-1">Kelola dokumen materi pelajaran dan unduhan umum untuk website.</p>
        </div>
        <Button asChild className="gap-2 btn-gradient text-white border-0 rounded-xl flex items-center justify-center h-10 px-4">
          <Link href="/admin/website/documents/new">
            <Plus className="h-4 w-4" /> Tambah Dokumen
          </Link>
        </Button>
      </div>

      <Card className="glass border-0">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Daftar Dokumen</CardTitle>
          <CardDescription className="text-xs">Semua file yang dapat diunduh melalui website.</CardDescription>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <div className="py-12 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
              <p className="font-semibold mb-1">Belum ada dokumen</p>
              <p className="text-sm text-muted-foreground mb-4">Unggah dokumen baru untuk ditambahkan ke pusat unduhan.</p>
              <Button asChild variant="outline" className="rounded-xl">
                <Link href="/admin/website/documents/new">Unggah Sekarang</Link>
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="px-4 py-3 font-medium rounded-tl-lg">Judul Dokumen</TableHead>
                    <TableHead className="px-4 py-3 font-medium">Tipe</TableHead>
                    <TableHead className="px-4 py-3 font-medium">Ukuran</TableHead>
                    <TableHead className="px-4 py-3 font-medium">Tanggal Upload</TableHead>
                    <TableHead className="px-4 py-3 font-medium text-right rounded-tr-lg">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documents.map(doc => (
                    <TableRow key={doc.id} className="border-b last:border-0 hover:bg-muted/10 transition-colors">
                      <TableCell className="px-4 py-3">
                        <div className="font-medium text-foreground">{doc.title}</div>
                        {doc.description && <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{doc.description}</div>}
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                          {getTypeLabel(doc.type)}
                        </span>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-muted-foreground text-xs">
                        {formatBytes(doc.size)}
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(doc.createdAt), 'dd MMM yyyy')}
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button asChild variant="ghost" size="icon" className="h-8 w-8 text-primary hover:bg-primary/10 hover:text-primary" title="Download File">
                            <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" download>
                              <Download className="h-4 w-4" />
                            </a>
                          </Button>
                          <ConfirmDialog
                            trigger={
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            }
                            title="Hapus dokumen ini?"
                            description="Dokumen akan dihapus dari sistem."
                            confirmText="Ya, hapus"
                            onConfirm={() => deleteDocument(doc.id)}
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
