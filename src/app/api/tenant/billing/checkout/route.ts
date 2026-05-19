import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { createUpgradeInvoice } from "@/features/finance/services/billing.service"
import { headers } from "next/headers"
import { logger } from "@/lib/logger"
import { z } from "zod"
import { parseBody } from "@/lib/api-utils"

const checkoutSchema = z.object({
  studentCount: z.number().int().min(0, "Jumlah siswa tidak valid"),
  discountCode: z.string().optional(),
  planSlug: z.string().optional().default("pro")
})

export async function POST(req: Request) {
  const session = await auth() as any
  const headersList = await headers()
  let slug = headersList.get("x-tenant-slug")
  
  if (!slug) {
    const host = headersList.get("host") || ""
    const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "schoolpro.test"
    if (host.endsWith(`.${rootDomain}`)) {
      slug = host.replace(`.${rootDomain}`, "")
    } else if (host !== rootDomain && !host.startsWith("www.")) {
      slug = host.split(".")[0] // Fallback local test
    }
  }
  
  const tenant = session?.user?.tenants?.find((t: any) => t.slug === slug)
  if (!tenant) return NextResponse.json({ error: "Unauthorized", slug_detected: slug }, { status: 401 })
  const tenantId = tenant.id

  const parsed = await parseBody(req, checkoutSchema)
  if (parsed.error) return parsed.error

  try {
    const res = await createUpgradeInvoice(tenantId, parsed.data.studentCount, parsed.data.discountCode, parsed.data.planSlug)
    
    if (!res.success || !res.data) {
      return NextResponse.json({ error: res.error || "Terjadi kesalahan saat memproses pembayaran" }, { status: 400 })
    }

    const result = res.data

    // Kirim notifikasi billing (async, non-blocking)
    import("@/features/finance/services/billing-notification.service").then(({ notifyInvoiceCreated, notifySuperAdminNewInvoice }) => {
      notifyInvoiceCreated(result.id).catch(() => {})
      notifySuperAdminNewInvoice(result.id).catch(() => {})
    }).catch(() => {})

    return NextResponse.json(result)
  } catch (error: any) {
    logger.error("Billing checkout failed", error, { path: "/api/tenant/billing/checkout" })
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}
