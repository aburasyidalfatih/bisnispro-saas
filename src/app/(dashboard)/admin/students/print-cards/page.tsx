import { auth } from"@/lib/auth"
import { db } from"@/lib/db"
import { redirect } from"next/navigation"
import Link from"next/link"
import { Building, Filter, Printer, ArrowLeft, ShieldCheck, Wallet } from"lucide-react"
import { Button } from"@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from"@/components/ui/select"
import QRCodeClient from"@/components/ui/qr-code"
import { PrintButton } from"./_components/print-button"

export default async function PrintCardsPage({
  searchParams,
}: {
  searchParams: Promise<{ classroomId?: string }>
}) {
  const { classroomId } = await searchParams
  const session = await auth()
  const tenantId = session?.user?.tenants?.[0]?.id

  if (!tenantId) redirect("/login")

  const tenant = await db.tenant.findUnique({
    where: { id: tenantId },
  })

  const classrooms = await db.classroom.findMany({
    where: { tenantId },
    orderBy: { name:"asc" }
  })

  let students: any[] = []
  if (classroomId) {
    students = await db.student.findMany({
      where: { tenantId, classroomId: classroomId ==="all" ? undefined : classroomId },
      include: { classroom: true, walletAccount: true },
      orderBy: { name:"asc" }
    })
  }

  return (
    <div className="space-y-6">
      {/* Header and Filter (Hidden on Print) */}
      <div className="print:hidden space-y-4">
        <div className="flex items-center gap-3">
          <Link href="/admin/students">
            <Button variant="ghost" size="icon" className="rounded-xl"><ArrowLeft className="h-5 w-5" /></Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold">Cetak ID Card & QR Tabungan</h1>
            <p className="text-sm text-muted-foreground">Pilih kelas untuk mencetak kartu secara massal.</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border flex flex-col sm:flex-row gap-4 items-center justify-between">
           <form className="flex gap-3 w-full sm:w-auto">
              <div className="flex items-center gap-2">
                 <Filter className="h-4 w-4 text-muted-foreground" />
                 <Select name="classroomId" defaultValue={classroomId ||""}>
                   <SelectTrigger className="w-full sm:w-48 bg-background">
                     <SelectValue placeholder="-- Pilih Kelas --" />
                   </SelectTrigger>
                   <SelectContent>
                     <SelectItem value="all">Semua Siswa</SelectItem>
                     {classrooms.map(c => (
                       <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                     ))}
                   </SelectContent>
                 </Select>
              </div>
             <Button type="submit" className="rounded-lg">Tampilkan</Button>
           </form>

           {students.length > 0 && (
             <PrintButton count={students.length} />
           )}
        </div>
      </div>

      {/* Print Area */}
      {classroomId && students.length === 0 ? (
         <div className="p-10 text-center text-muted-foreground print:hidden">Tidak ada siswa di kelas ini.</div>
      ) : (
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 print:grid-cols-2 print:gap-4 print:p-0">
           {students.map((student) => (
             <div key={student.id} className="relative w-full aspect-[1.58] max-w-[85.6mm] sm:h-[53.98mm] rounded-xl border-2 border-gray-200 bg-white overflow-hidden flex flex-col shadow-sm print:shadow-none print:break-inside-avoid">
                {/* ID Card Background / Header */}
                <div className="bg-primary/10 h-1/3 w-full absolute top-0 left-0 border-b border-primary/20"></div>
                
                <div className="relative z-10 flex flex-col h-full p-4">
                   {/* School Info */}
                   <div className="flex items-center gap-2 mb-3">
                      <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center shrink-0">
                         <Building className="h-4 w-4 text-primary-foreground" />
                      </div>
                      <div className="flex-1">
                         <p className="text-[10px] font-bold uppercase tracking-tight leading-tight line-clamp-1">{tenant?.name}</p>
                         <p className="text-[8px] text-muted-foreground">KARTU PELAJAR & E-KANTIN</p>
                      </div>
                   </div>

                   {/* Student Info & QR */}
                   <div className="flex justify-between items-center flex-1 gap-2">
                      <div className="flex-1 min-w-0">
                         <p className="text-sm font-black uppercase leading-none mb-1 line-clamp-2">{student.name}</p>
                         <div className="space-y-0.5 mt-2">
                            <p className="text-[9px] font-mono text-gray-500">NIS: <span className="font-bold text-black">{student.nis ||"-"}</span></p>
                            <p className="text-[9px] font-mono text-gray-500">Kelas: <span className="font-bold text-black">{student.classroom?.name ||"-"}</span></p>
                            <p className="text-[9px] font-mono text-gray-500 flex items-center gap-1 mt-1">
                               <Wallet className="h-2.5 w-2.5 text-emerald-600" />
                               <span className={student.walletAccount ?"text-emerald-700 font-medium" :"text-gray-400"}>
                                 {student.walletAccount ?"Wallet Aktif" :"Non-Wallet"}
                               </span>
                            </p>
                         </div>
                      </div>
                       <div className="shrink-0 bg-white p-1.5 rounded-lg border shadow-sm">
                         <QRCodeClient
                           value={student.id}
                           size={60}
                           level="M"
                         />
                       </div>
                   </div>

                   {/* Footer */}
                   <div className="mt-3 flex items-center justify-between border-t pt-1.5">
                      <div className="flex items-center gap-1 text-primary">
                         <ShieldCheck className="h-3 w-3" />
                         <span className="text-[7px] font-bold">SchoolPro Digital ID</span>
                      </div>
                      <span className="text-[7px] text-gray-400 font-mono">ID: {student.id.slice(-6).toUpperCase()}</span>
                   </div>
                </div>
             </div>
           ))}
         </div>
      )}

      {/* Print Styles */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page { margin: 10mm; size: A4; }
          body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
      `}} />
    </div>
  )
}
