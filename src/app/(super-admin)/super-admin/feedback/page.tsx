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

export const metadata: Metadata = {
  title: "Feedback Laporan | Super Admin",
}

export default async function FeedbackPage() {
  const session = await auth()
  if (!session?.user?.isSuperAdmin) redirect("/login")

  const feedbacks = await db.systemFeedback.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      user: {
        select: { name: true, email: true },
      },
      tenant: {
        select: { name: true, slug: true },
      },
    },
  })

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
              Menampilkan seluruh masukan dari lembaga. Anda dapat mengubah statusnya untuk memudahkan pelacakan (tracking).
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
                <TableHead>Lembaga</TableHead>
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
        </CardContent>
      </Card>
    </div>
  )
}
