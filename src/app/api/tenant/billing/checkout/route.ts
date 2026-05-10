import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { createUpgradeInvoice } from "@/lib/services/billing"
import { headers } from "next/headers"
import { logger } from "@/lib/logger"

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

  try {
    const { studentCount, discountCode } = await req.json()
    const result = await createUpgradeInvoice(tenantId, studentCount, discountCode)
    
    return NextResponse.json(result)
  } catch (error) {
    logger.error("Billing checkout failed", error, { path: "/api/tenant/billing/checkout" })
    return NextResponse.json({ error: "Terjadi kesalahan saat memproses pembayaran" }, { status: 500 })
  }
}
