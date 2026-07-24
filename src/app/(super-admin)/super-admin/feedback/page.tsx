import { Metadata } from "next"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from "date-fns"
import { id } from "date-fns/locale"
import { SystemFeedbackStatusAction } from "./_components/status-action"
import { ExportFeedbackButton } from "./_components/export-button"
import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "Feedback Laporan | Super Admin",
}

export default async function FeedbackPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const session = await auth()
  if (!session?.user?.isSuperAdmin) redirect("/login")

  const resolvedParams = await searchParams
  const pageParam = resolvedParams?.page
  const page = parseInt(Array.isArray(pageParam) ? pageParam[0] : (pageParam || "1"))
  const limit = 20
  const skip = (page - 1) * limit

  const [feedbacks, total] = await Promise.all([
    db.systemFeedback.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
      skip,
      include: {
        user: {
          select: { name: true, email: true },
        },
        tenant: {
          select: { name: true, slug: true },
        },
      },
    }),
    db.systemFeedback.count()
  ])
  const totalPages = Math.ceil(total / limit)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Feedback & Laporan</h2>
        <p className="text-muted-foreground">
          Kelola laporan bug, permintaan fitur, dan testimoni dari pengguna tenant.
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <CardTitle>Daftar Laporan</CardTitle>
            <CardDescription className="mt-1">
              Menampilkan seluruh masukan dari bisnis. Anda dapat mengubah statusnya untuk memudahkan pelacakan (tracking).
            </CardDescription>
          </div>
          <ExportFeedbackButton data={feedbacks} />
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tanggal</TableHead>
                <TableHead>Pengirim</TableHead>
                <TableHead>Bisnis</TableHead>
                <TableHead>Tipe</TableHead>
                <TableHead>Pesan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {feedbacks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Belum ada feedback yang dikirim.
                  </TableCell>
                </TableRow>
              ) : (
                feedbacks.map((f: any) => (
                  <TableRow key={f.id}>
                    <TableCell className="whitespace-nowrap">
                      {formatDistanceToNow(f.createdAt, { addSuffix: true, locale: id })}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{f.user.name}</span>
                        <span className="text-xs text-muted-foreground">{f.user.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {f.tenant ? (
                        <div className="flex flex-col">
                          <span className="font-medium">{f.tenant.name}</span>
                          <span className="text-xs text-muted-foreground">/{f.tenant.slug}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-xs italic">Sistem/Non-tenant</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                        f.type === "BUG_REPORT" ? "destructive" :
                        f.type === "FEATURE_REQUEST" ? "default" : "secondary"
                      }>
                        {f.type.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <p className="truncate text-sm" title={f.message}>
                        {f.message}
                      </p>
                    </TableCell>
                    <TableCell>
                      <Badge variant={f.status === "PENDING" ? "outline" : f.status === "REVIEWED" ? "secondary" : "default"}>
                        {f.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <SystemFeedbackStatusAction id={f.id} currentStatus={f.status} message={f.message} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <span className="text-xs text-muted-foreground">Total {total} data · Halaman {page} dari {totalPages}</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" asChild disabled={page <= 1} className={page <= 1 ? "pointer-events-none opacity-50" : ""}>
                  <Link href={`/super-admin/feedback?page=${page - 1}`}>
                    <ChevronLeft className="h-4 w-4 mr-1" /> Prev
                  </Link>
                </Button>
                <Button variant="outline" size="sm" asChild disabled={page >= totalPages} className={page >= totalPages ? "pointer-events-none opacity-50" : ""}>
                  <Link href={`/super-admin/feedback?page=${page + 1}`}>
                    Next <ChevronRight className="h-4 w-4 ml-1" />
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
