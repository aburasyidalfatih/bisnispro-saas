import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { School, Phone, User, MailOpen, MailX, MoreHorizontal, Eye, Mail, CheckCircle, RefreshCcw, XCircle, Trash2, Clock } from "lucide-react"
import { cn, normalizeImageUrl } from "@/lib/utils"
import { checkDataCompleteness } from "@/lib/utils/data-completeness"
import { Application } from "./types"
import { Input } from "@/components/ui/input"

interface ApplicationTableProps {
  filteredApps: Application[]
  selectedIds: string[]
  toggleSelectAll: () => void
  toggleSelect: (id: string) => void
  viewDetail: (app: Application) => void
  handleResendEmail: (id: string) => void
  openActionModal: (app: Application | null, type: "APPROVED" | "REVISION" | "REJECTED" | "DELETE" | "RESEND_EMAIL", isBulk?: boolean) => void
}

export function ApplicationTable({
  filteredApps,
  selectedIds,
  toggleSelectAll,
  toggleSelect,
  viewDetail,
  handleResendEmail,
  openActionModal
}: ApplicationTableProps) {

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING": return <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 gap-1"><Clock className="h-3 w-3" /> Pending</Badge>
      case "APPROVED": return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 gap-1"><CheckCircle className="h-3 w-3" /> Disetujui</Badge>
      case "REVISION": return <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20 gap-1"><RefreshCcw className="h-3 w-3" /> Revisi</Badge>
      case "REJECTED": return <Badge variant="outline" className="bg-rose-500/10 text-rose-600 border-rose-500/20 gap-1"><XCircle className="h-3 w-3" /> Ditolak</Badge>
      default: return <Badge>{status}</Badge>
    }
  }

  return (
    <Card className="glass border-0 overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="px-4 py-3 w-10 text-center">
                <Input 
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 accent-primary"
                  checked={filteredApps.length > 0 && selectedIds.length === filteredApps.length} 
                  onChange={toggleSelectAll} 
                />
              </TableHead>
              <TableHead className="px-4 py-3 font-semibold">Bisnis (Perusahaan)</TableHead>
              <TableHead className="px-4 py-3 font-semibold">Penanggungjawab</TableHead>
              <TableHead className="px-4 py-3 font-semibold">Kota / Provinsi</TableHead>
              <TableHead className="px-4 py-3 font-semibold text-center">Jml. Klien</TableHead>
              <TableHead className="px-4 py-3 font-semibold">Affiliator</TableHead>
              <TableHead className="px-4 py-3 font-semibold">Status</TableHead>
              <TableHead className="px-4 py-3 font-semibold text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredApps.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Belum ada data pendaftaran yang sesuai pencarian.</TableCell>
              </TableRow>
            )}
            {filteredApps.map((app) => (
              <TableRow key={app.id} className={cn("hover:bg-muted/10 transition-colors", selectedIds.includes(app.id) && "bg-muted/30")}>
                <TableCell className="px-4 py-4 text-center">
                  <Input 
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 accent-primary"
                    checked={selectedIds.includes(app.id)} 
                    onChange={() => toggleSelect(app.id)} 
                  />
                </TableCell>
                <TableCell className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 shrink-0 bg-white border rounded-xl flex items-center justify-center overflow-hidden relative">
                      {app.logo ? (
                        <>
                          <img src={normalizeImageUrl(app.logo) || app.logo} 
                            alt="Logo" 
                            className="object-contain p-0.5 w-full h-full" 
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              const nextSibling = e.currentTarget.nextElementSibling as HTMLElement;
                              if (nextSibling) nextSibling.style.display = 'block';
                            }}
                          />
                          <School className="h-5 w-5 text-muted-foreground hidden" />
                        </>
                      ) : (
                        <School className="h-5 w-5 text-muted-foreground" />
                      )}
                      {(() => {
                        const result = checkDataCompleteness(app)
                        const color = result.level === 'complete' ? 'bg-emerald-500' : result.level === 'location' ? 'bg-amber-500' : 'bg-rose-500'
                        return <span className={`absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white ${color}`} title={result.level === 'complete' ? 'Data Lengkap' : result.level === 'location' ? 'Lokasi tidak cocok dataset' : `Kurang: ${result.missingFields.join(', ')}`} />
                      })()}
                    </div>
                    <div>
                      <p className="font-bold">{app.businessName}</p>
                      <p className="text-[10px] text-muted-foreground">Subdomain: <span className="text-primary">{app.businessSlug}.bisnispro.id</span></p>
                      <p className="text-[10px] text-muted-foreground/70 mt-0.5">Pengajuan: {new Date(app.createdAt).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="px-4 py-4">
                  <p className="font-medium">{app.adminName}</p>
                  <div className="flex flex-col gap-0.5 mt-0.5">
                    <p className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="h-3 w-3" /> {app.adminPhone}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1"><Mail className="h-3 w-3" /> {app.adminEmail}</p>
                  </div>
                </TableCell>
                <TableCell className="px-4 py-4">
                  <p className="font-medium">{app.regency}</p>
                  <p className="text-xs text-muted-foreground">{app.province}</p>
                </TableCell>
                <TableCell className="px-4 py-4 text-center">
                  <span className="font-semibold">{app.studentCount ? app.studentCount.toLocaleString('id-ID') : '-'}</span>
                </TableCell>
                <TableCell className="px-4 py-4">
                  {app.affiliate ? (
                    <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md w-fit">
                      <User className="h-3 w-3" /> {app.affiliate.user.name}
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell className="px-4 py-4">
                  <div className="flex flex-col gap-1.5 items-start">
                    {getStatusBadge(app.status)}
                    {(app.status === 'APPROVED' || app.status === 'PENDING') && (
                      app.emailOpenedAt ? (
                        <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20 gap-1 text-[10px] px-1.5 py-0" title={`Dibaca pada: ${new Date(app.emailOpenedAt).toLocaleString('id-ID')}`}>
                          <MailOpen className="h-3 w-3" /> Dibaca
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 gap-1 text-[10px] px-1.5 py-0" title="Email belum dibuka">
                          <MailX className="h-3 w-3" /> Belum Dibaca
                        </Badge>
                      )
                    )}
                  </div>
                </TableCell>
                <TableCell className="px-4 py-4 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuLabel>Tindakan</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => viewDetail(app)}>
                        <Eye className="h-4 w-4 mr-2 text-primary" /> Lihat Detail
                      </DropdownMenuItem>
                      {app.status === 'APPROVED' && !app.emailOpenedAt && (
                        <DropdownMenuItem onClick={() => handleResendEmail(app.id)}>
                          <Mail className="h-4 w-4 mr-2 text-blue-500" /> Kirim Ulang Email
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => openActionModal(app, "APPROVED")}>
                        <CheckCircle className="h-4 w-4 mr-2 text-emerald-500" /> Setujui
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openActionModal(app, "REVISION")}>
                        <RefreshCcw className="h-4 w-4 mr-2 text-blue-500" /> Revisi
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openActionModal(app, "REJECTED")} className="text-rose-600">
                        <XCircle className="h-4 w-4 mr-2" /> Tolak
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => openActionModal(app, "DELETE")} className="text-red-600 focus:text-red-700 focus:bg-red-50">
                        <Trash2 className="h-4 w-4 mr-2" /> Hapus Pengajuan
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  )
}
