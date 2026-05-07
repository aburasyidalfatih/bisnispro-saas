"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Mail, Phone, BookOpen, GraduationCap, Info, User, Briefcase, Pencil, Save, X, Loader2 } from "lucide-react"
import { Staff } from "@prisma/client"

interface ProfilGTKFormProps {
  staff: Staff
  sessionImage?: string
  sessionEmail?: string
}

export function ProfilGTKForm({ staff, sessionImage, sessionEmail }: ProfilGTKFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    defaultValues: {
      name: staff.name || "",
      role: staff.role || "",
      email: staff.email || sessionEmail || "",
      phone: staff.phone || "",
      subject: staff.subject || "",
      education: staff.education || "",
      bio: staff.bio || ""
    }
  })

  const initials = staff.name
    .split(" ")
    .map(n => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  const onSubmit = async (data: any) => {
    setIsSaving(true)
    try {
      const res = await fetch("/api/panel-gtk/profil", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      })

      if (!res.ok) throw new Error("Gagal memperbarui profil")
      
      toast({ title: "Berhasil", description: "Profil berhasil diperbarui!" })
      setIsEditing(false)
      router.refresh()
    } catch (error) {
      console.error(error)
      toast({ variant: "destructive", title: "Gagal", description: "Terjadi kesalahan saat menyimpan data." })
    } finally {
      setIsSaving(false)
    }
  }

  const cancelEdit = () => {
    reset()
    setIsEditing(false)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Header Profile */}
      <Card className="glass border-0 shadow-lg shadow-primary/5 overflow-hidden relative">
        <div className="h-32 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent absolute top-0 left-0 right-0" />
        
        {/* Tombol Edit/Save Header */}
        <div className="absolute top-4 right-4 z-20 flex gap-2">
          {!isEditing ? (
            <Button type="button" onClick={() => setIsEditing(true)} variant="secondary" size="sm" className="bg-background/80 backdrop-blur hover:bg-background">
              <Pencil className="h-4 w-4 mr-2" />
              Edit Profil
            </Button>
          ) : (
            <>
              <Button type="button" onClick={cancelEdit} variant="outline" size="sm" className="bg-background/80 backdrop-blur hover:bg-background">
                <X className="h-4 w-4 mr-2" />
                Batal
              </Button>
              <Button type="submit" size="sm" disabled={isSaving} className="btn-gradient text-white">
                {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Simpan
              </Button>
            </>
          )}
        </div>

        <CardContent className="pt-16 pb-8 px-6 relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
          <Avatar className="h-28 w-28 ring-4 ring-background shadow-xl shrink-0">
            <AvatarImage src={staff.imageUrl || sessionImage || ""} alt={staff.name} className="object-cover" />
            <AvatarFallback className="bg-primary/10 text-primary text-3xl font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 mt-2 w-full">
            {isEditing ? (
              <div className="space-y-4 text-left w-full max-w-xl">
                <div>
                  <Label htmlFor="name">Nama Lengkap</Label>
                  <Input id="name" {...register("name", { required: "Nama wajib diisi" })} className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="role">Peran / Jabatan</Label>
                  <Input id="role" {...register("role")} className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="bio">Riwayat Singkat / Bio</Label>
                  <Textarea id="bio" {...register("bio")} className="mt-1 resize-none" rows={3} />
                </div>
              </div>
            ) : (
              <>
                <h1 className="text-2xl font-bold text-foreground tracking-tight">{staff.name}</h1>
                <div className="flex items-center justify-center sm:justify-start gap-2 mt-1">
                  <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-semibold tracking-wide">
                    {staff.role}
                  </span>
                </div>
                {staff.bio && (
                  <p className="text-sm text-muted-foreground mt-4 max-w-xl leading-relaxed">
                    {staff.bio}
                  </p>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Informasi Detail */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Kontak */}
        <Card className="glass border-0 shadow-md">
          <CardHeader className="pb-4 border-b border-border/50">
            <h3 className="font-semibold flex items-center gap-2">
              <Mail className="h-4 w-4 text-primary" />
              Informasi Kontak
            </h3>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <Mail className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground font-medium mb-1">Email</p>
                {isEditing ? (
                  <Input type="email" {...register("email")} className="h-8 text-sm" />
                ) : (
                  <p className="text-sm font-medium">{staff.email || sessionEmail || "Belum diatur"}</p>
                )}
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <Phone className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground font-medium mb-1">Nomor Telepon</p>
                {isEditing ? (
                  <Input type="tel" {...register("phone")} className="h-8 text-sm" />
                ) : (
                  <p className="text-sm font-medium">{staff.phone || "Belum diatur"}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Akademik */}
        <Card className="glass border-0 shadow-md">
          <CardHeader className="pb-4 border-b border-border/50">
            <h3 className="font-semibold flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-primary" />
              Data Akademik
            </h3>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <BookOpen className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground font-medium mb-1">Mata Pelajaran / Spesialisasi</p>
                {isEditing ? (
                  <Input {...register("subject")} className="h-8 text-sm" />
                ) : (
                  <p className="text-sm font-medium">{staff.subject || "Belum diatur"}</p>
                )}
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <GraduationCap className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground font-medium mb-1">Pendidikan Terakhir</p>
                {isEditing ? (
                  <Input {...register("education")} className="h-8 text-sm" />
                ) : (
                  <p className="text-sm font-medium">{staff.education || "Belum diatur"}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info Badge */}
      {!isEditing && (
        <div className="flex items-start gap-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
          <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
          <p className="text-xs text-blue-600/90 dark:text-blue-400 leading-relaxed">
            <strong>Pemberitahuan:</strong> Data profil ini disinkronisasi dengan portal informasi sekolah. Silakan tekan tombol Edit Profil jika ada pembaruan data akademik atau kontak Anda.
          </p>
        </div>
      )}
    </form>
  )
}
