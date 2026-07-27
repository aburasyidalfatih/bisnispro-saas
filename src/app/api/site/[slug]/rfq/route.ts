import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { rfqSchema } from "@/features/contact/schemas/rfq.schema"
import { rateLimit } from "@/lib/rate-limit"
import { logger } from "@/lib/logger"

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const ipAddress = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "anonymous"
    const { success } = await rateLimit(`rfq:${ipAddress}`, 5, 600_000)
    if (!success) return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 })
    const tenant = await db.tenant.findUnique({
      where: { slug },
      select: { id: true },
    })

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 })
    }

    const body = await req.json()
    const parsed = rfqSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues.map(issue => issue.message).join(", ") }, { status: 400 })
    const { deliveryTerms, targetTimeline, privacyConsent: _privacyConsent, companyWebsite: _companyWebsite, additionalMessage, ...rfqData } = parsed.data
    const context = [
      additionalMessage,
      deliveryTerms && `Requested delivery terms: ${deliveryTerms}`,
      targetTimeline && `Target timeline: ${targetTimeline}`,
    ].filter(Boolean).join("\n\n") || null

    const rfqSubmission = await db.rfqSubmission.create({
      data: {
        tenantId: tenant.id,
        ...rfqData,
        additionalMessage: context,
        ipAddress,
      },
    })

    const admins = await db.tenantUser.findMany({ where: { tenantId: tenant.id, role: { in: ["owner", "admin"] } }, select: { userId: true } })
    if (admins.length) await db.notification.createMany({ data: admins.map(admin => ({ tenantId: tenant.id, userId: admin.userId, title: `New RFQ from ${rfqData.buyerName}`, message: `${rfqData.productInterest}${rfqData.country ? ` · ${rfqData.country}` : ""}`, type: "info", channel: "inapp", metadata: { rfqId: rfqSubmission.id, email: rfqData.buyerEmail } })) })
    logger.info("RFQ submitted", { tenantId: tenant.id, slug, rfqId: rfqSubmission.id })
    return NextResponse.json({ success: true, data: rfqSubmission }, { status: 201 })
  } catch (error: any) {
    logger.error("RFQ submission failed", error, { path: "/api/site/[slug]/rfq" })
    return NextResponse.json(
      { error: "Failed to submit RFQ" },
      { status: 400 }
    )
  }
}
