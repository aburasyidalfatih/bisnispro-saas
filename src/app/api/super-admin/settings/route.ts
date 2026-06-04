import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET() {
  const session = await auth()
  if (!session?.user?.isSuperAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const settings = await db.platformSetting.findMany()
  const map: Record<string, string> = {}
  settings.forEach((s) => { map[s.key] = s.value })
  return NextResponse.json(map)
}

export async function PUT(req: Request) {
  const session = await auth()
  if (!session?.user?.isSuperAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const body = await req.json()
  
  // Jika body adalah object key-value (Batch Update)
  if (typeof body === 'object' && !body.key) {
    const updates = Object.entries(body).map(([key, value]) => 
      db.platformSetting.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) },
      })
    )
    await Promise.all(updates)

    // Jika INVOICE_EXPIRY_DAYS diubah, update semua invoice PENDING
    let affectedInvoices = 0
    if (body.INVOICE_EXPIRY_DAYS !== undefined) {
      const days = Math.max(1, Number(body.INVOICE_EXPIRY_DAYS) || 1)
      const msPerDay = 24 * 60 * 60 * 1000

      const pendingPayments = await db.payment.findMany({
        where: { status: "pending" },
        select: { id: true, createdAt: true }
      })

      if (pendingPayments.length > 0) {
        await Promise.all(
          pendingPayments.map(p =>
            db.payment.update({
              where: { id: p.id },
              data: {
                expiredAt: new Date(p.createdAt.getTime() + days * msPerDay)
              }
            })
          )
        )
        affectedInvoices = pendingPayments.length
      }
    }

    // Jika AFFILIATE_DEFAULT_CASHBACK_PERCENTAGE diubah, update kupon cashback affiliate
    if (body.AFFILIATE_DEFAULT_CASHBACK_PERCENTAGE !== undefined) {
      const newPct = Math.max(0, Number(body.AFFILIATE_DEFAULT_CASHBACK_PERCENTAGE) || 0)
      await db.discountCode.updateMany({
        where: { 
          type: "CASHBACK",
          affiliateId: { not: null }
        },
        data: {
          percentage: newPct
        }
      })
    }

    return NextResponse.json({ 
      message: "Pengaturan batch berhasil disimpan",
      affectedInvoices
    })
  }

  // Support single update (legacy)
  const { platformSettingSchema } = await import("@/features/super-admin/schemas/super-admin.schema")
  const { key, value } = body
  
  await db.platformSetting.upsert({
    where: { key },
    update: { value: String(value) },
    create: { key, value: String(value) },
  })

  return NextResponse.json({ message: "Setting disimpan" })
}
