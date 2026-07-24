import { requireTenantMembership } from "@/lib/api-utils"
import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { z } from "zod"
import { createTransaction } from "@/features/finance/services/payment.service"

const donateSchema = z.object({
  campaignId: z.string(),
  tenantId: z.string(),
  donorName: z.string().min(1),
  donorEmail: z.string().email().optional(),
  amount: z.number().min(1000),
  method: z.enum(["WALLET", "TRIPAY", "MANUAL"]),
  message: z.string().optional(),
  isAnonymous: z.boolean().default(false),
  paymentChannel: z.string().optional(), // Untuk TRIPAY
})

export async function POST(req: Request) {
  const session = await auth()
  const body = await req.json()
  const parsed = donateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const { campaignId, tenantId, amount, method, paymentChannel, donorName, donorEmail, message, isAnonymous } = parsed.data
  const { error: accessError } = await requireTenantMembership(tenantId as string);
  if (accessError) return accessError;

  const campaign = await db.donationCampaign.findFirst({
    where: { id: campaignId, tenantId, isActive: true, deletedAt: null },
  })
  if (!campaign) return NextResponse.json({ error: "Kampanye tidak aktif atau tidak ditemukan" }, { status: 404 })

  // === DONASI VIA WALLET ===
  if (method === "WALLET") {
    return NextResponse.json({ error: "Metode pembayaran WALLET tidak lagi didukung" }, { status: 400 })
  }

  // === DONASI VIA MANUAL ===
  if (method === "MANUAL") {
    const donation = await db.donation.create({
      data: {
        campaignId,
        tenantId,
        userId: session?.user?.id,
        donorName: isAnonymous ? "Hamba Allah" : donorName,
        donorEmail,
        amount,
        method: "MANUAL",
        isAnonymous,
        message,
        status: "PENDING",
      },
    })
    return NextResponse.json({ message: "Donasi manual berhasil dicatat", donationId: donation.id })
  }

  // === DONASI VIA TRIPAY ===
  if (!paymentChannel) return NextResponse.json({ error: "Pilih metode pembayaran" }, { status: 400 })

  const tripayResult = await createTransaction({
    tenantId,
    plan: "DONATION",
    amount,
    method: paymentChannel,
    customerName: donorName,
    customerEmail: donorEmail || "donatur@bisnispro.id",
    metadata: { campaignId, isAnonymous, message, donorName },
  })

  if (!tripayResult.success) return NextResponse.json({ error: tripayResult.error }, { status: 500 })

  // Simpan donasi dengan status PENDING
  await db.donation.create({
    data: {
      campaignId,
      tenantId,
      userId: session?.user?.id,
      donorName: isAnonymous ? "Hamba Allah" : donorName,
      donorEmail,
      amount,
      method: "TRIPAY",
      reference: tripayResult.data.reference,
      isAnonymous,
      message,
      status: "PENDING",
    },
  })

  return NextResponse.json({ message: "Transaksi dibuat", checkoutUrl: tripayResult.data.checkout_url })
}
