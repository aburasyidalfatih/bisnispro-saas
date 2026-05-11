import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { createAiAddonInvoice } from "@/lib/services/billing"
import { headers } from "next/headers"
import { z } from "zod"
import { parseBody } from "@/lib/api-utils"

const aiAddonSchema = z.object({
  packageKey: z.string().min(1, "Paket wajib dipilih"),
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
      slug = host.split(".")[0]
    }
  }

  const tenantUser = session?.user?.tenants?.find((t: any) => t.slug === slug)
  if (!tenantUser || !["owner", "admin"].includes(tenantUser.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const parsed = await parseBody(req, aiAddonSchema)
  if (parsed.error) return parsed.error

  try {
    const invoice = await createAiAddonInvoice(tenantUser.id, parsed.data.packageKey)
    return NextResponse.json(invoice)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Gagal membuat tagihan top-up AI" }, { status: 400 })
  }
}
