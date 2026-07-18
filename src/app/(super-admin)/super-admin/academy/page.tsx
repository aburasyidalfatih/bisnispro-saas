"use client"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useEffect, useState, useCallback } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  GraduationCap, Search, Pencil, Trash2,
  MoreHorizontal, Plus
} from "lucide-react"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { ServerPagination } from "@/components/shared/server-pagination"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import Link from "next/link"

interface CourseRow {
  id: string
  title: string
  slug: string
  price: number
  isPublished: boolean
  createdAt: string
  author: { name: string } | null
  _count: {
    enrollments: number
    modules: number
  }
}

export default function AcademyPage() {
  const [courses, setCourses] = useState<CourseRow[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const limit = 10

  const fetchCourses = useCallback(() => {
    setLoading(true)
    fetch(`/api/super-admin/academy?page=${page}&limit=${limit}&search=${search}`)
      .then(r => r.json())
      .then(data => {
        setCourses(data.data || [])
        setTotal(data.total || 0)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [page, search])

  useEffect(() => { fetchCourses() }, [fetchCourses])

  const handleDelete = async (id: string, title: string) => {
    const res = await fetch(`/api/super-admin/academy/${id}`, {
      method: "DELETE",
    })
    if (res.ok) {
      toast({ title: "Kelas dihapus", description: `Kelas ${title} berhasil dihapus.` })
      fetchCourses()
    } else {
      toast({ title: "Gagal", description: "Tidak dapat menghapus kelas.", variant: "destructive" })
    }
  }

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div className="flex-1">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Academy (LMS)</h1>
          <p className="text-muted-foreground mt-1 text-xs sm:text-sm">Kelola kelas dan pelatihan untuk Admin Lembaga ({total} kelas)</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/super-admin/academy/create">
            <Button className="gap-2 rounded-xl">
              <Plus className="h-4 w-4" />
              Buat Kelas Baru
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Cari judul kelas..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="pl-9 rounded-xl"
          />
        </div>
      </div>

      <Card className="glass border-0 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b bg-muted/30">
                <TableHead className="px-4 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-widest">Judul Kelas</TableHead>
                <TableHead className="px-4 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-widest">Harga</TableHead>
                <TableHead className="px-4 py-4 text-center text-xs font-bold text-muted-foreground uppercase tracking-widest">Modul</TableHead>
                <TableHead className="px-4 py-4 text-center text-xs font-bold text-muted-foreground uppercase tracking-widest">Peserta</TableHead>
                <TableHead className="px-4 py-4 text-center text-xs font-bold text-muted-foreground uppercase tracking-widest">Status</TableHead>
                <TableHead className="px-4 py-4 text-right text-xs font-bold text-muted-foreground uppercase tracking-widest">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                [...Array(3)].map((_, i) => (
                  <TableRow key={i} className="border-b">
                    <TableCell className="px-4 py-5" colSpan={6}><div className="skeleton h-10 w-full rounded-xl" /></TableCell>
                  </TableRow>
                ))
              ) : courses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="px-4 py-20 text-center">
                    <GraduationCap className="h-12 w-12 mx-auto text-muted-foreground/20 mb-4" />
                    <p className="text-muted-foreground italic">Belum ada kelas yang dibuat.</p>
                  </TableCell>
                </TableRow>
              ) : (
                courses.map((c) => (
                  <TableRow key={c.id} className="hover:bg-muted/20 transition-all group">
                    <TableCell className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary font-bold shadow-sm">
                          <GraduationCap className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold truncate max-w-[250px]">{c.title}</p>
                          <p className="text-[10px] text-muted-foreground font-mono">Dibuat: {formatDate(c.createdAt)}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-4">
                      <span className="font-bold text-sm">
                        {c.price === 0 ? <span className="text-emerald-600">GRATIS</span> : `Rp ${c.price.toLocaleString("id-ID")}`}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 py-4 text-center">
                      <span className="font-bold">{c._count.modules}</span>
                    </TableCell>
                    <TableCell className="px-4 py-4 text-center">
                      <span className="font-bold">{c._count.enrollments}</span>
                    </TableCell>
                    <TableCell className="px-4 py-4 text-center">
                      <span className={cn(
                        "inline-flex items-center text-[10px] font-bold uppercase rounded-full px-2.5 py-1",
                        c.isPublished ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600"
                      )}>
                        {c.isPublished ? "Published" : "Draft"}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 py-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl hover:bg-primary/10 hover:text-primary transition-all">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 glass rounded-2xl p-2 shadow-2xl border-0 ring-1 ring-black/5">
                          <Link href={`/super-admin/academy/${c.slug}/edit`}>
                            <DropdownMenuItem className="gap-2 rounded-xl h-10 cursor-pointer">
                              <Pencil className="h-4 w-4 text-primary" />
                              <span className="font-medium text-sm">Edit Kelas</span>
                            </DropdownMenuItem>
                          </Link>
                          <Link href={`/super-admin/academy/${c.slug}/modules`}>
                            <DropdownMenuItem className="gap-2 rounded-xl h-10 cursor-pointer">
                              <GraduationCap className="h-4 w-4 text-blue-500" />
                              <span className="font-medium text-sm">Kelola Materi</span>
                            </DropdownMenuItem>
                          </Link>
                          <DropdownMenuSeparator className="bg-border/40 my-1" />
                          <ConfirmDialog
                            trigger={
                              <DropdownMenuItem className="gap-2 rounded-xl h-10 cursor-pointer text-rose-600" onSelect={(e) => e.preventDefault()}>
                                <Trash2 className="h-4 w-4" />
                                <span className="font-bold text-sm">Hapus Kelas</span>
                              </DropdownMenuItem>
                            }
                            title={`Hapus kelas "${c.title}"?`}
                            description="Tindakan ini akan menghapus permanen kelas beserta seluruh materi dan data pendaftaran di dalamnya."
                            confirmText="Ya, Hapus"
                            onConfirm={() => handleDelete(c.id, c.title)}
                          />
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-border/40 bg-muted/10">
            <ServerPagination page={page} totalPages={totalPages} total={total} onPageChange={setPage} />
          </div>
        )}
      </Card>
    </div>
  )
}
