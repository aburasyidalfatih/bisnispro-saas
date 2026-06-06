import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import { Bell, CheckCircle2 } from "lucide-react"

export const dynamic = 'force-dynamic'

export default async function TenantNotificationsPage() {
  const session = await auth()
  if (!session?.user) {
    redirect("/login")
  }

  // Fetch tenant notifications
  const notifications = await db.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Semua Notifikasi</h2>
        <p className="text-muted-foreground">Lihat riwayat notifikasi akun Anda.</p>
      </div>

      <Card className="glass border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifikasi Sistem
          </CardTitle>
          <CardDescription>Menampilkan 50 notifikasi terakhir.</CardDescription>
        </CardHeader>
        <CardContent>
          {notifications.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">Belum ada notifikasi.</div>
          ) : (
            <div className="rounded-md border bg-card">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="px-4 py-3 font-medium">Waktu</TableHead>
                      <TableHead className="px-4 py-3 font-medium">Judul & Pesan</TableHead>
                      <TableHead className="px-4 py-3 font-medium">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {notifications.map((notif: any) => (
                      <TableRow key={notif.id} className="hover:bg-muted/30">
                        <TableCell className="px-4 py-3 whitespace-nowrap align-top">
                          {format(new Date(notif.createdAt), "dd MMM yyyy, HH:mm", { locale: id })}
                        </TableCell>
                        <TableCell className="px-4 py-3 align-top max-w-[400px] max-w-full">
                          <div className="font-semibold mb-1">{notif.title}</div>
                          <div className="text-sm text-muted-foreground">{notif.message}</div>
                        </TableCell>
                        <TableCell className="px-4 py-3 align-top">
                          {notif.isRead ? (
                            <span className="text-xs text-green-600 flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" /> Dibaca
                            </span>
                          ) : (
                            <Badge variant="secondary">Baru</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
