import React from"react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from"@/components/ui/card"
import { Button } from"@/components/ui/button"
import { Input } from"@/components/ui/input"
import { Label } from"@/components/ui/label"
import { User, Camera, Save, Info, KeyRound, Eye, EyeOff } from"lucide-react"
import { cn } from"@/lib/utils"

interface ProfileSettingsProps {
  session: any
  profileForm: { name: string; phone: string; email: string; bio: string }
  setProfileForm: React.Dispatch<React.SetStateAction<{ name: string; phone: string; email: string; bio: string }>>
  savingProfile: boolean
  avatarPreview: string
  setAvatarPreview: (val: string) => void
  setAvatarUrl: (val: string) => void
  uploadingAvatar: boolean
  avatarInputRef: React.RefObject<HTMLInputElement | null>
  handleAvatarUpload: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>
  handleSaveProfile: () => Promise<void>
  passwordForm: { current: string; newPass: string; confirm: string }
  setPasswordForm: React.Dispatch<React.SetStateAction<{ current: string; newPass: string; confirm: string }>>
  savingPassword: boolean
  showPw: { current: boolean; newPass: boolean; confirm: boolean }
  setShowPw: React.Dispatch<React.SetStateAction<{ current: boolean; newPass: boolean; confirm: boolean }>>
  handleChangePassword: () => Promise<void>
}

const pwFields = [
  { key:"current", label:"Password Saat Ini", placeholder:"••••••••" },
  { key:"newPass", label:"Password Baru", placeholder:"Minimal 8 karakter" },
  { key:"confirm", label:"Konfirmasi", placeholder:"Ulangi password baru" },
] as const

export function ProfileSettings({
  session, profileForm, setProfileForm, savingProfile, avatarPreview, setAvatarPreview,
  setAvatarUrl, uploadingAvatar, avatarInputRef, handleAvatarUpload, handleSaveProfile,
  passwordForm, setPasswordForm, savingPassword, showPw, setShowPw, handleChangePassword
}: ProfileSettingsProps) {
  return (
    <Card className="glass border-0">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
            <User className="h-4 w-4 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">Profil</CardTitle>
            <CardDescription>Informasi akun &amp; keamanan</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Avatar row */}
        <div className="flex items-center gap-3">
          <div className="relative shrink-0">
            <div className="h-14 w-14 rounded-full overflow-hidden border-2 border-border">
              {avatarPreview
                ? <img src={avatarPreview} alt="Avatar" className="h-full w-full object-cover" loading="lazy" decoding="async" />
                : <div className="flex h-full w-full items-center justify-center bg-primary/10">
                    <span className="text-lg font-bold text-primary">{profileForm.name?.charAt(0)?.toUpperCase() ||"?"}</span>
                  </div>
              }
            </div>
            <Button variant="outline" size="icon" onClick={() => avatarInputRef.current?.click()} disabled={uploadingAvatar}
              className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white shadow-md hover:bg-primary/90 border-0 p-0">
              {uploadingAvatar ? <div className="h-2.5 w-2.5 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <Camera className="h-2.5 w-2.5" />}
            </Button>
            <Input ref={avatarInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleAvatarUpload} />
          </div>
          <div>
            <p className="text-sm font-medium">{profileForm.name ||"—"}</p>
            <p className="text-xs text-muted-foreground">{session?.user?.email}</p>
            {avatarPreview && <Button onClick={() => { setAvatarPreview(""); setAvatarUrl("") }} className="text-xs text-destructive hover:underline">Hapus foto</Button>}
          </div>
        </div>

        {/* Nama + Telepon 2 kolom */}
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1.5">
            <Label className="text-xs">Nama Lengkap</Label>
            <Input value={profileForm.name} onChange={e => setProfileForm(p => ({ ...p, name: e.target.value }))} placeholder="Nama lengkap" className="rounded-xl h-9 text-sm" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">No. Telepon</Label>
            <Input value={profileForm.phone} onChange={e => setProfileForm(p => ({ ...p, phone: e.target.value }))} placeholder="08xxxxxxxxxx" className="rounded-xl h-9 text-sm" />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Email</Label>
          <Input value={profileForm.email} onChange={e => setProfileForm(p => ({ ...p, email: e.target.value }))} placeholder="email@contoh.com" className="rounded-xl h-9 text-sm" />
          <p className="text-[11px] text-muted-foreground -mt-1 flex items-center gap-1">
            <Info className="h-3 w-3 text-primary" />
            Gunakan email yang paling sering digunakan. Update rutin terkait SchoolPro akan disampaikan melalui email.
          </p>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Bio Singkat</Label>
          <textarea 
            value={profileForm.bio} 
            onChange={e => setProfileForm(p => ({ ...p, bio: e.target.value }))} 
            placeholder="Tuliskan bio singkat Anda..." 
            className="flex min-h-[80px] w-full rounded-xl border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" 
          />
          <p className="text-[11px] text-muted-foreground -mt-1">
            Ditampilkan sebagai profil penulis di bagian bawah artikel/berita yang Anda terbitkan.
          </p>
        </div>
        <Button className="flex items-center justify-center btn-gradient text-white border-0 rounded-xl w-full gap-2 h-9 px-4" onClick={handleSaveProfile} disabled={savingProfile}>
          {savingProfile ? <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <Save className="h-3.5 w-3.5" />}
          Simpan Profil
        </Button>

        {/* Separator */}
        <div className="flex items-center gap-2 py-1">
          <div className="flex-1 h-px bg-border" />
          <span className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
            <KeyRound className="h-3 w-3" /> Ganti Password
          </span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Password fields */}
        <div className="space-y-2">
          {pwFields.map(({ key, label, placeholder }) => (
            <div key={key} className="space-y-1.5">
              <Label className="text-xs">{label}</Label>
              <div className="relative">
                <Input
                  type={showPw[key] ?"text" :"password"}
                  value={passwordForm[key as keyof typeof passwordForm]}
                  onChange={e => setPasswordForm(p => ({ ...p, [key]: e.target.value }))}
                  placeholder={placeholder}
                  className="rounded-xl h-9 text-sm pr-9"
                />
                <Button variant="ghost" size="icon" type="button" onClick={() => setShowPw(p => ({ ...p, [key]: !p[key as keyof typeof showPw] }))}
                  className="absolute right-1 h-8 w-8 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPw[key as keyof typeof showPw] ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </Button>
              </div>
            </div>
          ))}
          {passwordForm.newPass && (
            <div className="flex gap-1">
              {[1,2,3,4].map(i => (
                <div key={i} className={cn("h-1 flex-1 rounded-full transition-colors",
                  passwordForm.newPass.length >= i * 3
                    ? i <= 1 ?"bg-destructive" : i <= 2 ?"bg-amber-500" : i <= 3 ?"bg-yellow-500" :"bg-emerald-500"
                    :"bg-muted"
                )} />
              ))}
            </div>
          )}
        </div>
        <Button className="flex items-center justify-center btn-gradient text-white border-0 rounded-xl w-full gap-2 h-9 px-4" onClick={handleChangePassword} disabled={savingPassword}>
          {savingPassword ? <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <KeyRound className="h-3.5 w-3.5" />}
          Ubah Password
        </Button>
      </CardContent>
    </Card>
  )
}
