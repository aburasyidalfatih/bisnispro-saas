import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
"use client"

import { use, useEffect, useState } from"react"
import { useSession } from"next-auth/react"
import { useToast } from"@/hooks/use-toast"
import { Card, CardContent, CardHeader, CardTitle } from"@/components/ui/card"
import { Button } from"@/components/ui/button"
import { Input } from"@/components/ui/input"
import { Badge } from"@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from"@/components/ui/select"
import {
  ArrowLeft, Users, Search, Wallet, UserCheck,
  Loader2, Receipt, ChevronRight, BookOpen
} from"lucide-react"
import Link from"next/link"

export default function ClassroomDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data: session } = useSession()
  const { toast } = useToast()
  const tenant = session?.user?.tenants?.[0]
  const [classroom, setClassroom] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  useEffect(() => {
    if (!tenant) return
    fetch(`/api/classrooms/${id}?tenantId=${tenant.id}`)
      .then(r => r.json())
      .then(setClassroom)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [id, tenant])

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
  if (!classroom) return <div className="py-20 text-center text-muted-foreground">Kelas tidak ditemukan.</div>

  const filtered = search
    ? classroom.students?.filter((s: any) => s.name.toLowerCase().includes(search.toLowerCase()) || s.nis?.includes(search))
    : classroom.students

  const totalBalance = classroom.students?.reduce((a: number, s: any) => a + (s.walletAccount?.balance || 0), 0) || 0
  const fillPct = Math.round(((classroom._count?.students || 0) / (classroom.capacity || 30)) * 100)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/admin/students/classrooms">
          <Button variant="ghost" size="icon" className="rounded-xl"><ArrowLeft className="h-5 w-5" /></Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <BookOpen className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{classroom.name}</h1>
              <p className="text-sm text-muted-foreground">
                {classroom.level ? `Tingkat ${classroom.level} · ` :""}{classroom._count?.students || 0} siswa aktif
                {classroom.waliKelas ? ` · Wali: ${classroom.waliKelas.name}` :""}
              </p>
            </div>
          </div>
        </div>
        <Link href={`/admin/attendance/sessions?classroomId=${id}`}>
          <Button variant="outline" className="rounded-xl gap-2 hidden sm:flex">
            <ChevronRight className="h-4 w-4" /> Absensi Kelas
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label:"Total Siswa", value: classroom._count?.students || 0, icon: Users, color:"text-primary bg-primary/10" },
          { label:"Kapasitas", value: `${fillPct}% penuh`, icon: Users, color:"text-amber-600 bg-amber-500/10" },
          { label:"Total Saldo Wallet", value: `Rp ${totalBalance.toLocaleString("id-ID")}`, icon: Wallet, color:"text-indigo-600 bg-indigo-500/10" },
          { label:"Punya Wallet", value: classroom.students?.filter((s: any) => s.walletAccount).length || 0, icon: Wallet, color:"text-emerald-600 bg-emerald-500/10" },
        ].map((s, i) => (
          <Card key={i} className="glass border-0 shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${s.color}`}>
                <s.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="font-black">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Capacity bar */}
      <div className="px-1">
        <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
          <span>{classroom._count?.students || 0} siswa dari {classroom.capacity} kapasitas</span>
          <span>{fillPct}%</span>
        </div>
        <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${fillPct >= 90 ?"bg-red-500" : fillPct >= 70 ?"bg-amber-500" :"bg-emerald-500"}`}
            style={{ width: `${Math.min(fillPct, 100)}%` }}
          />
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Cari nama atau NIS..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9 rounded-xl glass border-0"
        />
      </div>

      {/* Students table */}
      <Card className="glass border-0 shadow-sm overflow-hidden">
        <CardHeader className="pb-2 flex-row items-center justify-between">
          <CardTitle className="text-base">Daftar Siswa</CardTitle>
          <Link href="/admin/students">
            <Button size="sm" variant="ghost" className="rounded-xl text-xs">Lihat Semua Siswa →</Button>
          </Link>
        </CardHeader>
        <div className="overflow-x-auto">
          {filtered?.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground text-sm">Tidak ada siswa ditemukan.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  {["#","Nama Siswa","NIS","Wallet","Ortu",""].map(h => (
                    <TableHead key={h} className="text-left px-4 py-3 text-xs font-bold text-muted-foreground uppercase">{h}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered?.map((s: any, i: number) => (
                  <TableRow key={s.id} className="hover:bg-white/50 dark:hover:bg-white/5 transition-colors">
                    <TableCell className="px-4 py-3 text-muted-foreground text-xs font-mono w-8">{i + 1}</TableCell>
                    <TableCell className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center font-bold text-primary text-xs shrink-0">
                          {s.name.charAt(0)}
                        </div>
                        <p className="font-semibold">{s.name}</p>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3 font-mono text-xs text-muted-foreground">{s.nis ||"—"}</TableCell>
                    <TableCell className="px-4 py-3">
                      {s.walletAccount
                        ? <span className="text-emerald-600 font-semibold text-xs">Rp {s.walletAccount.balance.toLocaleString("id-ID")}</span>
                        : <span className="text-muted-foreground text-xs">—</span>
                      }
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      {s.parents?.length > 0
                        ? <span className="flex items-center gap-1 text-xs text-emerald-600"><UserCheck className="h-3.5 w-3.5" /> {s.parents.length}</span>
                        : <span className="text-muted-foreground text-xs">—</span>
                      }
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <Link href={`/admin/students/${s.id}`}>
                        <Button size="sm" variant="outline" className="h-7 text-xs rounded-lg px-2">Detail</Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </Card>
    </div>
  )
}
