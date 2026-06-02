"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { toast } from "@/hooks/use-toast"
import { Loader2, UploadCloud } from "lucide-react"

export function UploadProofForm({ paymentId }: { paymentId: string }) {
  const [loading, setLoading] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const router = useRouter()

  const handleUpload = async () => {
    if (!file) return toast({ title: "Pilih file", variant: "destructive" })
    setLoading(true)
    
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("paymentId", paymentId)

      const res = await fetch("/api/gtk/ai/topup/manual", {
        method: "POST",
        body: formData
      })
      
      if (!res.ok) {
         const d = await res.json()
         throw new Error(d.error || "Gagal mengupload bukti pembayaran")
      }
      
      toast({ title: "Berhasil", description: "Bukti pembayaran berhasil diupload. Menunggu verifikasi admin." })
      router.refresh()
    } catch (error: any) {
      toast({ title: "Gagal", description: error.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4 pt-4 border-t border-border">
      <div>
         <p className="text-sm font-bold mb-2">Sudah Transfer?</p>
         <p className="text-xs text-muted-foreground mb-4">Upload bukti transfer Anda agar dapat segera diverifikasi oleh admin.</p>
         
         <div className="border-2 border-dashed border-primary/30 rounded-xl p-4 text-center hover:bg-primary/5 transition-colors cursor-pointer relative">
            <input 
               type="file" 
               accept="image/*" 
               className="absolute inset-0 opacity-0 cursor-pointer"
               onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
            {file ? (
               <div className="text-sm font-medium text-primary">
                  {file.name}
               </div>
            ) : (
               <div className="flex flex-col items-center justify-center gap-2">
                  <UploadCloud className="h-6 w-6 text-primary" />
                  <span className="text-xs font-semibold text-primary">Pilih foto/screenshot bukti transfer</span>
               </div>
            )}
         </div>
      </div>

      <Button 
         className="w-full rounded-xl h-12 font-bold shadow-md shadow-primary/20" 
         disabled={loading || !file} 
         onClick={handleUpload}
      >
         {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Upload Bukti Pembayaran"}
      </Button>
    </div>
  )
}
