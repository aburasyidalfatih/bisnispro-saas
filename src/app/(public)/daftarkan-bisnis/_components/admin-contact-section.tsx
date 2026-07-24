import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { User, Mail, Phone } from "lucide-react"
import { cn } from "@/lib/utils"

export function AdminContactSection({ form, setForm }: any) {
  return (
    <Card className="glass border-0">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10"><User className="h-5 w-5 text-emerald-500" /></div>
          <div>
            <CardTitle>Kontak Penanggung Jawab</CardTitle>
            <CardDescription>Informasi admin utama bisnis</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Nama Lengkap</Label>
            <Input 
              required 
              value={form.adminName} 
              onChange={(e) => setForm({...form, adminName: e.target.value})}
              placeholder="Nama lengkap tanpa gelar" 
              className="rounded-xl h-11"
            />
          </div>
          <div className="space-y-2">
            <Label>Jabatan di Bisnis</Label>
            <Select
              value={form.adminPosition}
              onValueChange={(v) => setForm({...form, adminPosition: v})}
            >
              <SelectTrigger className="rounded-xl h-11">
                <SelectValue placeholder="Pilih jabatan..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Operator">Operator</SelectItem>
                <SelectItem value="Direktur / CEO">Direktur / CEO</SelectItem>
                <SelectItem value="Wakil Direktur / CEO">Wakil Direktur / CEO</SelectItem>
                <SelectItem value="Owner / Pendiri">Owner / Pendiri</SelectItem>
                <SelectItem value="Pimpinan Bisnis">Pimpinan Bisnis</SelectItem>
                <SelectItem value="Staf / Admin">Staf / Admin</SelectItem>
                <SelectItem value="Freelancer">Freelancer</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Email Penanggung Jawab</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                required type="email"
                value={form.adminEmail} 
                onChange={(e) => setForm({...form, adminEmail: e.target.value})}
                placeholder="emailanda@gmail.com" 
                className={cn(
                  "rounded-xl h-11 pl-10",
                  form.adminEmail && !form.adminEmail.toLowerCase().endsWith("@gmail.com") && "border-rose-500 focus-visible:ring-rose-500"
                )}
              />
            </div>
            {form.adminEmail && !form.adminEmail.toLowerCase().endsWith("@gmail.com") ? (
              <p className="text-[10px] text-rose-500 mt-1 font-medium">Harus menggunakan email @gmail.com yang aktif.</p>
            ) : (
              <p className="text-[10px] text-primary/80 mt-1 font-medium">Wajib menggunakan @gmail.com aktif, karena informasi penting akan dikirim ke email ini.</p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Nomor WhatsApp (Aktif)</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                required 
                value={form.adminPhone} 
                onChange={(e) => setForm({...form, adminPhone: e.target.value})}
                placeholder="0812345678xx" 
                className="rounded-xl h-11 pl-10"
              />
            </div>
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Password Akses</Label>
            <Input 
              required 
              type="password"
              value={form.password} 
              onChange={(e) => setForm({...form, password: e.target.value})}
              placeholder="Minimal 8 karakter" 
              className="rounded-xl h-11"
            />
            <p className="text-[10px] text-muted-foreground mt-1 font-medium">Buat password untuk login sebagai admin bisnis.</p>
          </div>
          <div className="space-y-2">
            <Label>Konfirmasi Password</Label>
            <Input 
              required 
              type="password"
              value={form.confirmPassword} 
              onChange={(e) => setForm({...form, confirmPassword: e.target.value})}
              placeholder="Ulangi password Anda" 
              className={cn(
                "rounded-xl h-11",
                form.confirmPassword && form.password !== form.confirmPassword && "border-rose-500 focus-visible:ring-rose-500"
              )}
            />
            {form.confirmPassword && form.password !== form.confirmPassword && (
              <p className="text-[10px] text-rose-500 mt-1 font-medium">Password tidak cocok.</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
