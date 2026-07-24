import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { logger } from "@/lib/logger"

export async function POST(req: Request) {
  const session = await auth() as any
  const headersList = await headers()
  let slug = headersList.get("x-tenant-slug")
  
  if (!slug) {
    const host = headersList.get("host") || ""
    const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "bisnispro.test"
    if (host.endsWith(`.${rootDomain}`)) {
      slug = host.replace(`.${rootDomain}`, "")
    } else if (host !== rootDomain && !host.startsWith("www.")) {
      slug = host.split(".")[0]
    }
  }
  
  const tenant = session?.user?.tenants?.find((t: any) => t.slug === slug)
  if (!tenant) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { paymentId } = await req.json()
    if (!paymentId) return NextResponse.json({ error: "Missing paymentId" }, { status: 400 })

    const { cancelPendingPayment } = await import("@/features/finance/services/wallet.service")
    const result = await cancelPendingPayment(tenant.id, paymentId)
    return NextResponse.json(result)
  } catch (error: any) {
    logger.error("Billing cancel failed", error, { path: "/api/tenant/billing/cancel" })
    return NextResponse.json({ error: error.message || "Gagal membatalkan pembayaran" }, { status: 500 })
  }
}
