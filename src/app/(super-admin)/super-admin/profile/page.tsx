"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { User, Shield, Lock, Save, Loader2 } from "lucide-react"
import { toast } from "@/hooks/use-toast"

export default function SuperAdminProfilePage() {
  const { data: session, update } = useSession()
  const [loading, setLoading] = useState(false)
  const [savingPwd, setSavingPwd] = useState(false)
  
  const [profileForm, setProfileForm] = useState({
    name: "",
    email: "",
    phone: "",
  })

  const [pwdForm, setPwdForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  useEffect(() => {
    if (session?.user) {
      setProfileForm({
        name: session.user.name || "",
        email: session.user.email || "",
        phone: (session.user as any).phone || "",
      })
    }
  }, [session])

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: profileForm.name,
          email: profileForm.email,
          phone: profileForm.phone,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Gagal memperbarui profil")
      }

      toast({ title: "Berhasil", description: data.message })
      // Update session to reflect changes
      await update()
    } catch (err: any) {
      toast({ title: "Gagal", description: err.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (pwdForm.newPassword !== pwdForm.confirmPassword) {
      toast({ title: "Gagal", description: "Konfirmasi password tidak cocok", variant: "destructive" })
      return
    }

    setSavingPwd(true)
    try {
      const res = await fetch("/api/user/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: pwdForm.currentPassword,
          newPassword: pwdForm.newPassword,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Gagal mengganti password")
      }

      toast({ title: "Berhasil", description: data.message })
      setPwdForm({ currentPassword: "", newPassword: "", confirmPassword: "" })
    } catch (err: any) {
      toast({ title: "Gagal", description: err.message, variant: "destructive" })
    } finally {
      setSavingPwd(false)
    }
  }

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Profil Super Admin</h1>
        <p className="text-muted-foreground mt-1">Kelola informasi pribadi dan keamanan akun utama Anda.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* === INFORMASI PROFIL === */}
        <Card className="glass border-0">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                <User className="h-4 w-4 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Informasi Dasar</CardTitle>
                <CardDescription>Ubah nama dan alamat email login Anda.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="space-y-2">
                <Label>Nama Lengkap</Label>
                <Input 
                  required 
                  value={profileForm.name} 
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })} 
                  className="rounded-xl"
                  placeholder="Nama Admin"
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input 
                  required 
                  type="email" 
                  value={profileForm.email} 
                  onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })} 
                  className="rounded-xl"
                  placeholder="admin@schoolpro.id"
                />
              </div>
              <div className="space-y-2">
                <Label>Nomor WhatsApp (Opsional)</Label>
                <Input 
                  type="text" 
                  value={profileForm.phone} 
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} 
                  className="rounded-xl"
                  placeholder="08123456789"
                />
              </div>
              <Button type="submit" disabled={loading} className="w-full sm:w-auto rounded-xl btn-gradient flex items-center justify-center h-10 px-4">
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Simpan Profil
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* === KEAMANAN & PASSWORD === */}
        <Card className="glass border-0">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10">
                <Shield className="h-4 w-4 text-amber-500" />
              </div>
              <div>
                <CardTitle className="text-lg">Keamanan Akun</CardTitle>
                <CardDescription>Ganti password untuk menjaga keamanan akses.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div className="space-y-2">
                <Label>Password Saat Ini</Label>
                <Input 
                  required 
                  type="password" 
                  value={pwdForm.currentPassword} 
                  onChange={(e) => setPwdForm({ ...pwdForm, currentPassword: e.target.value })} 
                  className="rounded-xl"
                  placeholder="••••••••"
                />
              </div>
              <div className="space-y-2">
                <Label>Password Baru</Label>
                <Input 
                  required 
                  type="password" 
                  value={pwdForm.newPassword} 
                  onChange={(e) => setPwdForm({ ...pwdForm, newPassword: e.target.value })} 
                  className="rounded-xl"
                  placeholder="Minimal 8 karakter"
                />
              </div>
              <div className="space-y-2">
                <Label>Konfirmasi Password Baru</Label>
                <Input 
                  required 
                  type="password" 
                  value={pwdForm.confirmPassword} 
                  onChange={(e) => setPwdForm({ ...pwdForm, confirmPassword: e.target.value })} 
                  className="rounded-xl"
                  placeholder="Ketik ulang password baru"
                />
              </div>
              <Button type="submit" disabled={savingPwd} className="w-full sm:w-auto rounded-xl bg-amber-500 hover:bg-amber-600 text-white">
                {savingPwd ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Lock className="mr-2 h-4 w-4" />}
                Ganti Password
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
