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
import { Mail, Phone, BookOpen, GraduationCap, Info, User, Briefcase, Pencil, Save, X, Loader2, Link as LinkIcon } from "lucide-react"
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
      bio: staff.bio || "",
      instagram: (staff as any).instagram || "",
      facebook: (staff as any).facebook || "",
      tiktok: (staff as any).tiktok || "",
      youtube: (staff as any).youtube || ""
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
              <Button type="submit" size="sm" disabled={isSaving} className="btn-gradient text-white flex items-center justify-center h-10 px-4">
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

      {/* Sosial Media */}
      <Card className="glass border-0 shadow-md">
        <CardHeader className="pb-4 border-b border-border/50">
          <h3 className="font-semibold flex items-center gap-2">
            <LinkIcon className="h-4 w-4 text-primary" />
            Sosial Media
          </h3>
        </CardHeader>
        <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-full bg-pink-500/10 flex items-center justify-center shrink-0 mt-0.5">
              <svg className="h-4 w-4 text-pink-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground font-medium mb-1">Instagram</p>
              {isEditing ? (
                <Input {...register("instagram")} placeholder="https://instagram.com/..." className="h-8 text-sm" />
              ) : (
                <p className="text-sm font-medium">{(staff as any).instagram || "-"}</p>
              )}
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-full bg-blue-600/10 flex items-center justify-center shrink-0 mt-0.5">
              <svg className="h-4 w-4 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground font-medium mb-1">Facebook</p>
              {isEditing ? (
                <Input {...register("facebook")} placeholder="https://facebook.com/..." className="h-8 text-sm" />
              ) : (
                <p className="text-sm font-medium">{(staff as any).facebook || "-"}</p>
              )}
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center shrink-0 mt-0.5">
              <svg className="h-4 w-4 text-slate-800 dark:text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground font-medium mb-1">TikTok</p>
              {isEditing ? (
                <Input {...register("tiktok")} placeholder="https://tiktok.com/@..." className="h-8 text-sm" />
              ) : (
                <p className="text-sm font-medium">{(staff as any).tiktok || "-"}</p>
              )}
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-full bg-red-600/10 flex items-center justify-center shrink-0 mt-0.5">
              <svg className="h-4 w-4 text-red-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"/><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"/></svg>
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground font-medium mb-1">YouTube</p>
              {isEditing ? (
                <Input {...register("youtube")} placeholder="https://youtube.com/c/..." className="h-8 text-sm" />
              ) : (
                <p className="text-sm font-medium">{(staff as any).youtube || "-"}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

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
