import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { logger } from "@/lib/logger"

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { headers: nextHeaders } = await import("next/headers")
    const headersList = await nextHeaders()
    let slug = headersList.get("x-tenant-slug")
    if (!slug) {
      const host = headersList.get("host") || ""
      const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "schoolpro.id"
      const hostWithoutPort = host.split(":")[0]
      if (hostWithoutPort.endsWith(`.${rootDomain}`)) {
        slug = hostWithoutPort.replace(`.${rootDomain}`, "")
      } else if (hostWithoutPort !== rootDomain && !hostWithoutPort.startsWith("www.")) {
        slug = hostWithoutPort.split(".")[0]
      }
    }
    const tenantUser = session?.user?.tenants?.find((t: any) => t.slug === slug)
    const tenantId = tenantUser?.id || session?.user?.tenants?.[0]?.id

    if (!tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const body = await req.json()
    const { billingTypeId, title, dueDate, month, year, notes } = body

    if (!billingTypeId || !title || !dueDate) {
      return NextResponse.json({ error: "Parameter billingTypeId, title, dan dueDate wajib diisi" }, { status: 400 })
    }

    const { billingQueue } = await import("@/lib/queue")

    // Masukkan ke BullMQ untuk digenerate massal
    await billingQueue.add("bulk-generate-invoices", {
      tenantId,
      billingTypeId,
      title,
      dueDate,
      month,
      year,
      notes,
      userId: session.user.id
    })

    const { db } = await import("@/lib/db")
    await db.auditLog.create({
      data: {
        tenantId,
        action: "ENQUEUE_BULK_INVOICE_GENERATION",
        entity: "Finance",
        userId: session.user.id || "SYSTEM"
      }
    }).catch(() => {})

    return NextResponse.json({ 
      success: true, 
      message: "Proses pembuatan tagihan massal sedang berjalan di latar belakang. Silakan cek halaman Tagihan dalam beberapa saat." 
    })
  } catch (error: any) {
    logger.error("Bulk Invoice Queue Error:", error)
    return NextResponse.json({ error: "Terjadi kesalahan server saat memulai job tagihan massal." }, { status: 500 })
  }
}
