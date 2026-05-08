import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireTenantMembership } from "@/lib/api-utils"
import { z } from "zod"
import { auth } from "@/lib/auth"

const campaignSchema = z.object({
  tenantId: z.string(),
  title: z.string().min(3),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  targetAmount: z.number().min(1),
  startDate: z.string(),
  endDate: z.string().optional(),
  isPublic: z.boolean().default(true),
  slug: z.string().optional(),
})

export async function GET(req: Request) {
  const url = new URL(req.url)
  const tenantId = url.searchParams.get("tenantId")
  if (!tenantId) return NextResponse.json({ error: "tenantId diperlukan" }, { status: 400 })
  const { error } = await requireTenantMembership(tenantId)
  if (error) return error

  const campaigns = await db.donationCampaign.findMany({
    where: { tenantId, deletedAt: null },
    include: { _count: { select: { donations: true } } },
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json(campaigns)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const parsed = campaignSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const { tenantId, ...data } = parsed.data
  const { error } = await requireTenantMembership(tenantId)
  if (error) return error

  // Auto-generate slug jika tidak ada
  const slug = data.slug || data.title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")

  const campaign = await db.donationCampaign.create({
    data: {
      tenantId,
      ...data,
      slug,
      startDate: new Date(data.startDate),
      endDate: data.endDate ? new Date(data.endDate) : null,
    },
  })
  return NextResponse.json(campaign, { status: 201 })
}
