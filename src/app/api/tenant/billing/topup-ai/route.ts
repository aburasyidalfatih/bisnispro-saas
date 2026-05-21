import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { createAiAddonInvoice } from "@/features/finance/services/billing.service"
import { logger } from "@/lib/logger"
import { headers } from "next/headers"

export async function POST(req: Request) {
  const session = await auth() as any
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const headersList = await headers()
  let slug = headersList.get("x-tenant-slug")
  
  if (!slug) {
    const host = headersList.get("host") || ""
    const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "schoolpro.test"
    if (host.endsWith(`.${rootDomain}`)) {
      slug = host.replace(`.${rootDomain}`, "")
    } else if (host !== rootDomain && !host.startsWith("www.")) {
      slug = host.split(".")[0]
    }
  }

  const tenant = session?.user?.tenants?.find((t: any) => t.slug === slug)
  if (!tenant) return NextResponse.json({ error: "Tenant not found" }, { status: 404 })

  try {
    const { packageId } = await req.json()
    if (!packageId) return NextResponse.json({ error: "Package ID is required" }, { status: 400 })

    const res = await createAiAddonInvoice(tenant.id, packageId)

    if (!res.success || !res.data) {
      return NextResponse.json({ error: res.error || "Gagal membuat invoice tagihan AI" }, { status: 400 })
    }

    const result = res.data

    // Kirim notifikasi billing (async, non-blocking)
    import("@/features/finance/services/billing-notification.service").then(({ notifyInvoiceCreated, notifySuperAdminNewInvoice }) => {
      notifyInvoiceCreated(result.id).catch(() => {})
      notifySuperAdminNewInvoice(result.id).catch(() => {})
    }).catch(() => {})

    return NextResponse.json(result)
  } catch (error) {
    logger.error("Create AI top-up payment failed", error, { path: "/api/tenant/billing/topup-ai" })
    return NextResponse.json({ error: "Gagal membuat tagihan pembelian token AI" }, { status: 500 })
  }
}
