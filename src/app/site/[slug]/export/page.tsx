import { notFound } from "next/navigation"
import { getTenantLayoutData } from "@/features/tenant/services/tenant-modular.service"
import { ExportCapability } from "../_components/export-capability"
import { RfqForm } from "../_components/rfq-form"

export default async function ExportCapabilityPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const tenant = await getTenantLayoutData(slug)
  if (!tenant || !(tenant.settings as any)?.exportProfile?.enabled) notFound()
  return <main><ExportCapability tenant={tenant as any} base={`/site/${slug}`} /><section className="bg-muted/30 py-14 md:py-20"><div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8"><RfqForm slug={slug} /></div></section></main>
}
