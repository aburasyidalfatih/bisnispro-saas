import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SettingsForm } from "./_components/settings-form"
import { ProfileForm } from "./_components/profile-form"
import { Building, User } from "lucide-react"

export default async function AffiliateSettingsPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const affiliate = await db.affiliateProfile.findUnique({
    where: { userId: session.user.id },
  })

  const user = await db.user.findUnique({
    where: { id: session.user.id }
  })

  if (!affiliate || !user) redirect("/login")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Pengaturan Akun</h1>
        <p className="text-muted-foreground mt-1 text-sm">Lengkapi data profil diri dan rekening bank Anda.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 items-start">
        <Card className="glass shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5 text-muted-foreground" />
              Profil Pribadi
            </CardTitle>
            <CardDescription>Data utama akun afiliasi Anda.</CardDescription>
          </CardHeader>
          <CardContent>
            <ProfileForm initialData={{
              name: user.name || "",
              email: user.email || "",
              phone: user.phone || ""
            }} />
          </CardContent>
        </Card>

        <Card className="glass shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Building className="h-5 w-5 text-muted-foreground" />
              Informasi Bank
            </CardTitle>
            <CardDescription>Komisi akan ditransfer ke rekening di bawah ini.</CardDescription>
          </CardHeader>
          <CardContent>
            <SettingsForm initialData={{
              bankName: affiliate.bankName || "",
              bankAccount: affiliate.bankAccount || "",
              accountName: affiliate.accountName || ""
            }} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
