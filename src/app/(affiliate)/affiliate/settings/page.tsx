import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SettingsForm } from "./_components/settings-form"
import { Building } from "lucide-react"

export default async function AffiliateSettingsPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const affiliate = await db.affiliateProfile.findUnique({
    where: { userId: session.user.id },
  })

  if (!affiliate) redirect("/login")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Pengaturan Rekening</h1>
        <p className="text-muted-foreground mt-1 text-sm">Lengkapi data rekening bank Anda untuk keperluan pencairan komisi.</p>
      </div>

      <Card className="glass shadow-sm max-w-2xl">
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
  )
}
