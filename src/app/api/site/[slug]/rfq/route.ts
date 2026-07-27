import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { rfqSchema } from "@/features/contact/schemas/rfq.schema"

export async function POST(
  req: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const tenant = await db.tenant.findUnique({
      where: { slug: params.slug },
      select: { id: true },
    })

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 })
    }

    const body = await req.json()
    const validatedData = rfqSchema.parse(body)

    const ipAddress = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || null

    const rfqSubmission = await db.rfqSubmission.create({
      data: {
        tenantId: tenant.id,
        ...validatedData,
        ipAddress,
      },
    })

    return NextResponse.json({ success: true, data: rfqSubmission }, { status: 200 })
  } catch (error: any) {
    console.error("RFQ Submission Error:", error)
    return NextResponse.json(
      { error: "Failed to submit RFQ" },
      { status: 400 }
    )
  }
}
