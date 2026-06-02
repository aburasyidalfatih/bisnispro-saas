import { auth } from"@/lib/auth"
import { redirect } from"next/navigation"
import { InvoiceList } from"./_components/invoice-list"
import { FileText } from"lucide-react"

export default async function InvoicePage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const tenant = session.user.tenants?.[0]
  if (!tenant || tenant.plan ==="free") redirect("/admin")

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <FileText className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tagihan Siswa</h1>
          <p className="text-sm text-muted-foreground">Kelola tagihan SPP, uang gedung, dan biaya lainnya.</p>
        </div>
      </div>
      <InvoiceList tenantId={tenant.id} />
    </div>
  )
}
