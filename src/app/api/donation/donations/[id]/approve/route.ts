import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  try {
    const donation = await db.donation.findUnique({
      where: { id },
      include: { campaign: true },
    })

    if (!donation) {
      return NextResponse.json({ error: "Donasi tidak ditemukan" }, { status: 404 })
    }

    if (donation.status === "PAID") {
      return NextResponse.json({ error: "Donasi sudah disetujui sebelumnya" }, { status: 400 })
    }

    await db.$transaction(async (tx) => {
      // 1. Update status donasi ke PAID
      await tx.donation.update({
        where: { id },
        data: {
          status: "PAID",
          paidAt: new Date(),
        },
      })

      // 2. Increment collectedAmount di kampanye
      await tx.donationCampaign.update({
        where: { id: donation.campaignId },
        data: {
          collectedAmount: { increment: donation.amount },
        },
      })

      // 3. Tambahkan ke Arus Kas (Cashflow)
      await tx.cashflow.create({
        data: {
          tenantId: donation.tenantId,
          type: "INCOME",
          category: "DONASI",
          amount: donation.amount,
          description: `Donasi Manual: ${donation.campaign.title} — ${donation.donorName}`,
          referenceId: donation.campaignId,
        },
      })
    })

    return NextResponse.json({ success: true, message: "Donasi berhasil disetujui!" })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
