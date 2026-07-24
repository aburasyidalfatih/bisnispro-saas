import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"

import { headers } from "next/headers"

export async function POST(req: Request) {
  const session = await auth() as any
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

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
  const tenantId = tenant?.id

  try {
    const { code } = await req.json()
    if (!code) {
      return NextResponse.json({ error: "Kode diskon wajib diisi" }, { status: 400 })
    }

    const { validateDiscountCode } = await import("@/features/finance/services/wallet.service")
    const result = await validateDiscountCode(code, tenantId)
    return NextResponse.json(result)
  } catch (error: any) {
    const status = error.message?.includes("tidak ditemukan") ? 404 : 400
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status })
  }
}
