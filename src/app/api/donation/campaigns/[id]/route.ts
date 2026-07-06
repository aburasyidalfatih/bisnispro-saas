import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const url = new URL(req.url)
  const tenantId = url.searchParams.get("tenantId")

  const campaign = await db.donationCampaign.findFirst({
    where: { id, deletedAt: null, ...(tenantId ? { tenantId } : {}) },
    include: {
      donations: {
        orderBy: { createdAt: "desc" },
      },
    },
  })

  if (!campaign) return NextResponse.json({ error: "Kampanye tidak ditemukan" }, { status: 404 })
  return NextResponse.json(campaign)
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const { tenantId, ...data } = body

  const campaign = await db.donationCampaign.update({
    where: { id },
    data: {
      ...data,
      endDate: data.endDate ? new Date(data.endDate) : undefined,
    },
  })
  return NextResponse.json(campaign)
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await db.donationCampaign.update({ where: { id }, data: { deletedAt: new Date(), isActive: false } })
  return NextResponse.json({ message: "Kampanye dinonaktifkan" })
}
