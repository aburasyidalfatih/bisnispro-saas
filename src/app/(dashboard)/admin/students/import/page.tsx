"use client"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

import { useState } from"react"
import { useSession } from"next-auth/react"
import { useRouter } from"next/navigation"
import { useToast } from"@/hooks/use-toast"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from"@/components/ui/card"
import { Button } from"@/components/ui/button"
import { ChevronLeft, Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Loader2 } from"lucide-react"
import Link from"next/link"
import Papa from"papaparse"

import { Crown } from"lucide-react"

export default function ImportStudentsPage() {
  const { data: session } = useSession()
  const tenantId = session?.user?.tenants?.[0]?.id
  const plan = (session?.user as any)?.tenants?.[0]?.plan ||"free"
  const router = useRouter()
  const { toast } = useToast()
  
  const [file, setFile] = useState<File | null>(null)
  const [parsedData, setParsedData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    if (file.type !=="text/csv" && !file.name.endsWith('.csv')) {
       setError("Harap unggah file dengan format .csv")
       return
    }

    setFile(file)
    setError(null)
    setSuccess(false)
    setParsedData([])

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
           setError("Terjadi kesalahan saat membaca file CSV. Pastikan format sesuai template.")
           return
        }
        
        // Validasi kolom
        const requiredColumns = ["Nama Lengkap","NIS","NISN","Email (Opsional)","Gender (L/P)"]
        const columns = Object.keys(results.data[0] as any)
        const missing = requiredColumns.filter(c => !columns.includes(c))
        
        if (missing.length > 0) {
           setError(`Kolom tidak lengkap! Kehilangan kolom: ${missing.join(",")}`)
           return
        }

        setParsedData(results.data)
      }
    })
  }

  const handleImport = async () => {
    if (!tenantId || parsedData.length === 0) return
    
    setLoading(true)
    try {
      const res = await fetch("/api/students/import", {
        method:"POST",
        headers: {"Content-Type":"application/json" },
        body: JSON.stringify({ tenantId, students: parsedData })
      })
      
      const result = await res.json()
      
      if (res.ok) {
        setSuccess(true)
        toast({ title:"Import Berhasil", description: `${result.count} siswa berhasil ditambahkan.` })
        setTimeout(() => router.push("/admin/students"), 2000)
      } else {
        setError(result.error ||"Gagal melakukan import")
        toast({ title:"Import Gagal", description: result.error, variant:"destructive" })
      }
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const downloadTemplate = () => {
    const csvContent ="Nama Lengkap,NIS,NISN,Email (Opsional),Gender (L/P),Nama Wali (Opsional)\nBudi Santoso,1001,0012345678,budi@email.com,L,Bapak Santoso\nSiti Aminah,1002,0012345679,,P,Ibu Aminah"
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download","template_import_siswa_schoolpro.csv")
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (plan ==="free") {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center border-0 shadow-xl rounded-3xl glass min-h-[60vh] max-w-3xl mx-auto">
        <div className="h-24 w-24 rounded-full bg-amber-500/10 flex items-center justify-center mb-6">
          <Crown className="h-12 w-12 text-amber-500" />
        </div>
        <h2 className="text-3xl font-bold tracking-tight mb-3">Fitur Premium</h2>
        <p className="text-lg text-muted-foreground max-w-md mb-8">
          Fasilitas Import Data Siswa secara massal (Excel/CSV) hanya tersedia untuk sekolah dengan paket berlangganan.
        </p>
        <Link href="/admin/billing">
          <Button size="lg" className="btn-gradient text-white rounded-xl px-10 shadow-lg glow-primary border-0 font-bold text-base h-12">
            Upgrade Paket Sekarang
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/students">
          <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl">
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Import Data Siswa</h1>
          <p className="text-sm text-muted-foreground">Tambahkan data siswa secara massal menggunakan file CSV.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
         {/* Kiri: Instruksi & Template */}
         <div className="space-y-6 md:col-span-1">
            <Card className="glass border-0 shadow-sm">
               <CardHeader className="bg-primary/5 border-b border-primary/10">
                  <CardTitle className="text-base flex items-center gap-2">
                     <FileSpreadsheet className="h-4 w-4 text-primary" /> Langkah Import
                  </CardTitle>
               </CardHeader>
               <CardContent className="p-5 space-y-4 text-sm">
                  <div className="flex gap-3">
                     <div className="h-6 w-6 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0">1</div>
                     <div>Unduh template CSV yang telah kami sediakan agar kolom sesuai dengan sistem.</div>
                  </div>
                  <div className="flex gap-3">
                     <div className="h-6 w-6 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0">2</div>
                     <div>Isi data siswa menggunakan Excel atau Google Sheets. (Jangan mengubah judul kolom).</div>
                  </div>
                  <div className="flex gap-3">
                     <div className="h-6 w-6 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0">3</div>
                     <div>Simpan (Save As) file Anda dalam format <b>.CSV (Comma delimited)</b>.</div>
                  </div>
                  <div className="flex gap-3">
                     <div className="h-6 w-6 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0">4</div>
                     <div>Unggah file tersebut ke sistem ini.</div>
                  </div>

                  <Button onClick={downloadTemplate} className="w-full mt-2 rounded-xl" variant="outline">
                     Unduh Template CSV
                  </Button>
               </CardContent>
            </Card>
         </div>

         {/* Kanan: Upload Area */}
         <div className="md:col-span-2 space-y-6">
            <Card className="glass border-0 shadow-sm">
               <CardContent className="p-8">
                  {success ? (
                     <div className="text-center py-10">
                        <CheckCircle2 className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold mb-2">Import Berhasil!</h2>
                        <p className="text-muted-foreground">Data siswa sedang disinkronisasi ke dalam sistem.</p>
                        <p className="text-xs text-muted-foreground mt-2">Mengarahkan kembali ke daftar siswa...</p>
                     </div>
                  ) : (
                     <>
                        <div className="border-2 border-dashed border-primary/30 rounded-2xl p-10 text-center hover:bg-primary/5 transition-colors relative">
                           <input 
                              type="file" 
                              accept=".csv" 
                              onChange={handleFileUpload}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                           />
                           <Upload className="h-12 w-12 text-primary/40 mx-auto mb-4" />
                           <h3 className="font-bold text-lg mb-1">Klik atau Tarik File CSV ke Sini</h3>
                           <p className="text-sm text-muted-foreground">Maksimal ukuran file: 5MB</p>
                        </div>

                        {error && (
                           <div className="mt-4 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-3 text-rose-600">
                              <AlertCircle className="h-5 w-5 shrink-0" />
                              <p className="text-sm font-medium">{error}</p>
                           </div>
                        )}

                        {parsedData.length > 0 && !error && (
                           <div className="mt-6 space-y-4">
                              <div className="flex items-center justify-between p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-700">
                                 <div className="flex items-center gap-3">
                                    <CheckCircle2 className="h-5 w-5" />
                                    <div>
                                       <p className="font-bold">File Valid!</p>
                                       <p className="text-xs opacity-80">{parsedData.length} baris data siswa siap di-import.</p>
                                    </div>
                                 </div>
                                 <Button 
                                    onClick={handleImport} 
                                    disabled={loading}
                                    className="btn-gradient text-white border-0 rounded-xl shadow-lg"
                                 >
                                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> :"Mulai Import"}
                                 </Button>
                              </div>

                              <div className="border rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                                 <Table>
                                    <TableHeader>
                                       <TableRow>
                                          <TableHead className="text-left p-3 font-semibold">Nama Lengkap</TableHead>
                                          <TableHead className="text-left p-3 font-semibold">NISN</TableHead>
                                          <TableHead className="text-left p-3 font-semibold">L/P</TableHead>
                                       </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                       {parsedData.slice(0, 50).map((row, i) => (
                                          <TableRow key={i}>
                                             <TableCell className="p-3">{row["Nama Lengkap"]}</TableCell>
                                             <TableCell className="p-3">{row["NISN"]}</TableCell>
                                             <TableCell className="p-3">{row["Gender (L/P)"]}</TableCell>
                                          </TableRow>
                                       ))}
                                    </TableBody>
                                 </Table>
                                 {parsedData.length > 50 && (
                                    <div className="text-center p-2 bg-muted/30 text-xs text-muted-foreground">
                                       Menampilkan 50 baris pertama dari {parsedData.length} baris...
                                    </div>
                                 )}
                              </div>
                           </div>
                        )}
                     </>
                  )}
               </CardContent>
            </Card>
         </div>
      </div>
    </div>
  )
}
