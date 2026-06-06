import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { School, MapPin, User, Clock, RefreshCcw, CheckCircle, XCircle } from "lucide-react"
import { normalizeImageUrl } from "@/lib/utils"
import { Application } from "./types"

interface ApplicationDetailModalProps {
  open: boolean
  setOpen: (open: boolean) => void
  selectedApp: Application | null
}

export function ApplicationDetailModal({ open, setOpen, selectedApp }: ApplicationDetailModalProps) {
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-3xl glass border-0 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detail Pendaftaran Tenant</DialogTitle>
          <DialogDescription>Data lengkap pengajuan operasional platform.</DialogDescription>
        </DialogHeader>
        {selectedApp && (
          <div className="space-y-6 py-4">
            {/* Header with Logo & Status */}
            <div className="flex items-center gap-4 bg-muted/20 p-4 rounded-xl border">
              <div className="h-16 w-16 shrink-0 bg-white border rounded-xl flex items-center justify-center overflow-hidden">
                {selectedApp.logo ? (
                  <>
                    <img src={normalizeImageUrl(selectedApp.logo) || selectedApp.logo} 
                      alt="Logo" 
                      className="object-contain p-1 w-full h-full" 
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const nextSibling = e.currentTarget.nextElementSibling as HTMLElement;
                        if (nextSibling) nextSibling.style.display = 'block';
                      }}
                    />
                    <School className="h-8 w-8 text-muted-foreground hidden" />
                  </>
                ) : (
                  <School className="h-8 w-8 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-lg truncate">{selectedApp.schoolName}</h3>
                <p className="text-sm text-muted-foreground truncate">
                  https://{selectedApp.schoolSlug}.schoolpro.id
                </p>
              </div>
              <div>{getStatusBadge(selectedApp.status)}</div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Informasi Sekolah */}
              <div className="space-y-4">
                <h4 className="font-bold border-b pb-2 flex items-center gap-2"><School className="h-4 w-4" /> Informasi Sekolah</h4>
                <div className="grid grid-cols-2 gap-y-3 text-sm">
                  <div className="text-muted-foreground">Nama Sekolah</div>
                  <div className="font-medium">{selectedApp.schoolName}</div>
                  
                  <div className="text-muted-foreground">Status Lembaga</div>
                  <div className="font-medium">{selectedApp.schoolStatus || '-'}</div>
                  
                  <div className="text-muted-foreground">NPSN</div>
                  <div className="font-medium">{selectedApp.npsn || '-'}</div>
                  
                  <div className="text-muted-foreground">Subdomain</div>
                  <div className="font-medium text-primary">{selectedApp.schoolSlug}.schoolpro.id</div>

                  <div className="text-muted-foreground">Jumlah Siswa</div>
                  <div className="font-medium">{selectedApp.studentCount ? selectedApp.studentCount.toLocaleString('id-ID') : '-'}</div>
                </div>
              </div>

              {/* Lokasi */}
              <div className="space-y-4">
                <h4 className="font-bold border-b pb-2 flex items-center gap-2"><MapPin className="h-4 w-4" /> Lokasi</h4>
                <div className="grid grid-cols-2 gap-y-3 text-sm">
                  <div className="text-muted-foreground">Provinsi</div>
                  <div className="font-medium">{selectedApp.province || '-'}</div>

                  <div className="text-muted-foreground">Kabupaten/Kota</div>
                  <div className="font-medium">{selectedApp.regency || '-'}</div>

                  <div className="text-muted-foreground col-span-2 mt-1">Alamat Lengkap</div>
                  <div className="col-span-2 font-medium bg-muted/20 p-2 rounded-lg text-xs leading-relaxed">
                    {selectedApp.address || '-'}
                  </div>
                </div>
              </div>

              {/* Penanggung Jawab */}
              <div className="space-y-4">
                <h4 className="font-bold border-b pb-2 flex items-center gap-2"><User className="h-4 w-4" /> Penanggung Jawab</h4>
                <div className="grid grid-cols-2 gap-y-3 text-sm">
                  <div className="text-muted-foreground">Nama Admin</div>
                  <div className="font-medium">{selectedApp.adminName}</div>
                  
                  <div className="text-muted-foreground">Jabatan</div>
                  <div className="font-medium">{selectedApp.adminPosition || '-'}</div>
                  
                  <div className="text-muted-foreground">Email</div>
                  <div className="font-medium truncate">{selectedApp.adminEmail}</div>
                  
                  <div className="text-muted-foreground">WhatsApp</div>
                  <div className="font-medium">{selectedApp.adminPhone}</div>
                </div>
              </div>

              {/* Metadata */}
              <div className="space-y-4">
                <h4 className="font-bold border-b pb-2 flex items-center gap-2"><Clock className="h-4 w-4" /> Metadata</h4>
                <div className="grid grid-cols-2 gap-y-3 text-sm">
                  <div className="text-muted-foreground">Tanggal Daftar</div>
                  <div className="font-medium">{new Date(selectedApp.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</div>

                  <div className="text-muted-foreground">Terakhir Diperbarui</div>
                  <div className="font-medium">{selectedApp.updatedAt ? new Date(selectedApp.updatedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}</div>

                  {selectedApp.affiliate && (
                    <>
                      <div className="text-muted-foreground">Affiliator</div>
                      <div className="font-bold text-emerald-600 flex items-center gap-1.5">
                        <User className="h-3 w-3" /> {selectedApp.affiliate.user.name}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Admin Message (Catatan Revisi/Penolakan) */}
            {selectedApp.adminMessage && (
              <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-4 space-y-1">
                <h5 className="font-bold text-sm flex items-center gap-2">
                  <RefreshCcw className="h-4 w-4" /> Catatan Admin
                </h5>
                <p className="text-sm leading-relaxed">{selectedApp.adminMessage}</p>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
