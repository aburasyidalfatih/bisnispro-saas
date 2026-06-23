"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Link as LinkIcon, UserPlus } from "lucide-react"

interface ClaimStudentModalProps {
  children?: React.ReactNode
}

export function ClaimStudentModal({ children }: ClaimStudentModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [nisn, setNisn] = useState("")
  const [birthDate, setBirthDate] = useState("")
  const [relation, setRelation] = useState("AYAH")
  
  const router = useRouter()
  const { toast } = useToast()

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nisn || !birthDate) return

    setIsLoading(true)
    try {
      const res = await fetch("/api/ortu/sync-student", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nisn, birthDate, relation })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Gagal menautkan data siswa")
      }

      toast({
        title: "Berhasil! 🎉",
        description: data.message,
      })
      
      setIsOpen(false)
      setNisn("")
      setBirthDate("")
      router.refresh()
    } catch (err: any) {
      toast({
        title: "Gagal Menautkan",
        description: err.message,
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" className="gap-2">
            <UserPlus className="h-4 w-4" />
            Tautkan Data Anak
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LinkIcon className="h-5 w-5 text-primary" />
              Tautkan Data Anak
            </DialogTitle>
            <DialogDescription>
              Masukkan NISN dan Tanggal Lahir anak Anda yang sudah terdaftar di database sekolah.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="nisn">NISN Siswa</Label>
              <Input
                id="nisn"
                placeholder="Contoh: 0012345678"
                value={nisn}
                onChange={(e) => setNisn(e.target.value)}
                required
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="birthDate">Tanggal Lahir</Label>
              <Input
                id="birthDate"
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="relation">Hubungan Keluarga</Label>
              <Select value={relation} onValueChange={setRelation}>
                <SelectTrigger id="relation">
                  <SelectValue placeholder="Pilih hubungan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AYAH">Ayah</SelectItem>
                  <SelectItem value="IBU">Ibu</SelectItem>
                  <SelectItem value="WALI">Wali</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={isLoading || !nisn || !birthDate}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Mencari...
                </>
              ) : (
                "Cari & Tautkan"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
