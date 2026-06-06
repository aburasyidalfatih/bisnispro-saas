"use client"

import { useState, useRef, useEffect } from "react"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Camera, LogOut, KeyRound, Save, Loader2, CreditCard, User } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function ParentProfile() {
  const { data: session, update: updateSession } = useSession()
  const router = useRouter()
  
  const [profileForm, setProfileForm] = useState({ name: "", phone: "" })
  const [savingProfile, setSavingProfile] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState("")
  const [avatarUrl, setAvatarUrl] = useState("")
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const avatarInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!session?.user) return
    setProfileForm({ name: session.user.name || "", phone: (session.user as any).phone || "" })
    setAvatarPreview(session.user.image || "")
    setAvatarUrl(session.user.image || "")
  }, [session?.user])

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingAvatar(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      fd.append("subDir", "avatars")
      const tenantId = session?.user?.tenants?.[0]?.id
      if (tenantId) fd.append("tenantId", tenantId)
      
      const res = await fetch("/api/upload", { method: "POST", body: fd })
      const d = await res.json()
      if (res.ok && d.url) { 
         setAvatarPreview(d.url)
         setAvatarUrl(d.url)
         // Langsung save profile
         await fetch("/api/user/profile", {
            method: "PUT", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: profileForm.name, phone: profileForm.phone, avatar: d.url }),
         })
         await updateSession({ forceRefresh: true })
         toast({ title: "Foto profil diperbarui" }) 
      }
      else toast({ title: "Gagal upload", description: d.error, variant: "destructive" })
    } catch { toast({ title: "Gagal upload", variant: "destructive" }) }
    finally { setUploadingAvatar(false); e.target.value = "" }
  }

  const handleSaveProfile = async () => {
    setSavingProfile(true)
    const res = await fetch("/api/user/profile", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: profileForm.name, phone: profileForm.phone, avatar: avatarUrl || null }),
    })
    setSavingProfile(false)
    if (res.ok) {
      await updateSession({ forceRefresh: true })
      toast({ title: "Profil disimpan" })
    } else {
      toast({ title: "Gagal menyimpan", variant: "destructive" })
    }
  }

  // Fake Data for visual matching
  const parentData = {
    id: "PRNT-882190",
    hubungan: "Ayah Kandung",
    alamat: "Jl. Pendidikan No. 123, Jakarta",
    pekerjaan: "Wiraswasta"
  }

  return (
    <div className="pb-10 font-sans">
      {/* Top Header */}
      <div className="bg-primary rounded-b-[2.5rem] pt-6 pb-24 px-6 relative z-0">
        <div className="flex items-center gap-3 text-primary-foreground mb-6">
          <Button onClick={() => router.push("/ortu")} className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
             <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="font-bold text-lg">Profil Orang Tua</h1>
        </div>
      </div>

      <div className="-mt-20 relative z-10 px-5 flex flex-col items-center">
         {/* Avatar Container */}
         <div className="relative mb-3">
            <div className="h-24 w-24 rounded-full border-4 border-background overflow-hidden bg-muted shadow-xl flex items-center justify-center">
               {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar" className="h-full w-full object-cover" />
               ) : (
                  <User className="h-10 w-10 text-muted-foreground" />
               )}
               {uploadingAvatar && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                     <Loader2 className="h-6 w-6 text-white animate-spin" />
                  </div>
               )}
            </div>
            <Button 
               onClick={() => avatarInputRef.current?.click()}
               className="absolute bottom-0 right-0 h-8 w-8 bg-background border border-border rounded-full flex items-center justify-center text-primary shadow-sm hover:bg-muted transition-colors"
            >
               <Camera className="h-4 w-4" />
            </Button>
            <Input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
         </div>

         {/* Name & Subtitle */}
         <h2 className="text-xl font-bold text-foreground text-center mb-1">{profileForm.name || "Nama Orang Tua"}</h2>
         <p className="text-xs text-muted-foreground text-center mb-6">
            {parentData.hubungan} &bull; ID: {parentData.id}
         </p>

         {/* Data Diri Card */}
         <div className="w-full bg-card rounded-2xl shadow-sm border border-border overflow-hidden mb-5">
            <div className="bg-primary/5 px-4 py-3 border-b border-border flex items-center gap-2">
               <CreditCard className="h-4 w-4 text-primary" />
               <h3 className="font-bold text-sm text-foreground">Informasi Orang Tua</h3>
            </div>
            <div className="p-4 space-y-4">
               <div className="flex justify-between items-center border-b border-border/50 pb-3">
                  <span className="text-xs text-muted-foreground w-1/3">Nama Lengkap</span>
                  <Input 
                     value={profileForm.name} 
                     onChange={e => setProfileForm(p => ({...p, name: e.target.value}))} 
                     className="text-xs font-semibold text-foreground text-right w-2/3 bg-transparent border-none focus:outline-none focus:ring-0 p-0" 
                  />
               </div>
               <div className="flex justify-between items-center border-b border-border/50 pb-3">
                  <span className="text-xs text-muted-foreground w-1/3">Telepon/WA</span>
                  <Input 
                     value={profileForm.phone} 
                     onChange={e => setProfileForm(p => ({...p, phone: e.target.value}))} 
                     className="text-xs font-semibold text-foreground text-right w-2/3 bg-transparent border-none focus:outline-none focus:ring-0 p-0" 
                     placeholder="Belum diatur"
                  />
               </div>
               <div className="flex justify-between items-center border-b border-border/50 pb-3">
                  <span className="text-xs text-muted-foreground">Email Akun</span>
                  <span className="text-xs font-semibold text-foreground">{session?.user?.email}</span>
               </div>
               <div className="flex justify-between items-center border-b border-border/50 pb-3">
                  <span className="text-xs text-muted-foreground">Pekerjaan</span>
                  <span className="text-xs font-semibold text-foreground">{parentData.pekerjaan}</span>
               </div>
               <div className="flex justify-between items-center border-b border-border/50 pb-3">
                  <span className="text-xs text-muted-foreground">Alamat</span>
                  <span className="text-xs font-semibold text-foreground text-right max-w-[60%] line-clamp-2">{parentData.alamat}</span>
               </div>
               <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Status Akun</span>
                  <span className="text-xs font-semibold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">Aktif</span>
               </div>
            </div>
         </div>

         {/* Save Button for Profile Updates */}
         <Button 
            onClick={handleSaveProfile} 
            disabled={savingProfile}
            className="w-full btn-gradient text-white rounded-xl py-3 text-sm font-bold shadow-lg shadow-primary/20 mb-5 flex justify-center items-center gap-2 hover:opacity-90 transition-opacity"
         >
            {savingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Simpan Perubahan
         </Button>

         {/* Keamanan & Akun */}
         <div className="w-full bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
            <div className="bg-primary/5 px-4 py-3 border-b border-border flex items-center gap-2">
               <KeyRound className="h-4 w-4 text-primary" />
               <h3 className="font-bold text-sm text-foreground">Keamanan & Akun</h3>
            </div>
            <div className="p-2">
               <Button variant="outline" className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-muted/50 transition-colors">
                  <span className="text-sm font-medium text-foreground">Ubah Password</span>
                  <span className="text-muted-foreground">→</span>
               </Button>
               <Button 
                  onClick={async () => {
                     await signOut({ redirect: false })
                     window.location.href = "/login"
                  }} 
                  className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-destructive/5 text-destructive transition-colors mt-1"
               >
                  <span className="text-sm font-bold flex items-center gap-2"><LogOut className="h-4 w-4" /> Keluar Aplikasi</span>
               </Button>
            </div>
         </div>

      </div>
    </div>
  )
}
