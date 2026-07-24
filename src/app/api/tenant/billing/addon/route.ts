import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { createAddonInvoice } from "@/features/finance/services/billing.service"
import { headers } from "next/headers"
import { z } from "zod"
import { parseBody } from "@/lib/api-utils"

const addonSchema = z.object({
  studentCount: z.number().min(1, "Jumlah klien minimal 1"),
  discountCode: z.string().optional()
})

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

  const tenantUser = session?.user?.tenants?.find((t: any) => t.slug === slug)
  if (!tenantUser || !["owner", "admin"].includes(tenantUser.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const parsed = await parseBody(req, addonSchema)
  if (parsed.error) return parsed.error

  try {
    const result = await createAddonInvoice(tenantUser.id, parsed.data.studentCount, parsed.data.discountCode)
    
    if (!result.success || !result.data) {
      return NextResponse.json({ error: result.error || "Gagal membuat tagihan penambahan kuota" }, { status: 400 })
    }

    const invoice = result.data

    // Kirim notifikasi billing (async, non-blocking)
    import("@/features/finance/services/billing-notification.service").then(({ notifyInvoiceCreated, notifySuperAdminNewInvoice }) => {
      notifyInvoiceCreated(invoice.id).catch(() => {})
      notifySuperAdminNewInvoice(invoice.id).catch(() => {})
    }).catch(() => {})

    return NextResponse.json(invoice)
  } catch (error: any) {
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}
