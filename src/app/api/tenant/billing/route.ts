import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"

export const dynamic = "force-dynamic"

export async function GET() {
  const session = await auth() as any
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

  const tenantUser = session?.user?.tenants?.find((t: any) => t.slug === slug)
  if (!tenantUser) return NextResponse.json({ error: "Unauthorized", slug_detected: slug }, { status: 401 })

  try {
    const { getBillingDashboardData } = await import("@/features/finance/services/wallet.service")
    const result = await getBillingDashboardData(tenantUser.id)
    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}
