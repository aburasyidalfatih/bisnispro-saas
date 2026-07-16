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
    if (!session?.user) return NextResponse.json({ error: "Login diperlukan untuk donasi via Wallet" }, { status: 401 })

    const parent = await db.studentParent.findFirst({
      where: { userId: session.user.id },
      include: { student: { include: { walletAccount: true } } },
    })
    const wallet = parent?.student?.walletAccount
    if (!wallet) return NextResponse.json({ error: "Wallet tidak ditemukan" }, { status: 404 })
    if (wallet.balance < amount) return NextResponse.json({ error: "Saldo wallet tidak mencukupi" }, { status: 400 })

    await db.$transaction(async (tx) => {
      // Potong saldo secara atomic
      const updatedWallet = await tx.walletAccount.update({ where: { id: wallet.id }, data: { balance: { decrement: amount } } })
      if (updatedWallet.balance < 0) {
        throw new Error("Saldo wallet tidak mencukupi")
      }
      const newBalance = updatedWallet.balance

      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          tenantId,
          type: "WITHDRAWAL",
          amount,
          balanceBefore: newBalance + amount,
          balanceAfter: newBalance,
          referenceId: campaignId,
          description: `Donasi: ${campaign.title}`,
          status: "SUCCESS",
        },
      })

      await tx.donation.create({
        data: {
          campaignId,
          tenantId,
          donorName: isAnonymous ? "Hamba Allah" : donorName,
          donorEmail,
          userId: session.user.id,
          amount,
          method: "WALLET",
          isAnonymous,
          message,
          status: "PAID",
          paidAt: new Date(),
        },
      })

      await tx.donationCampaign.update({
        where: { id: campaignId },
        data: { collectedAmount: { increment: amount } },
      })

      await tx.cashflow.create({
        data: {
          tenantId,
          type: "INCOME",
          category: "DONASI",
          amount,
          description: `Donasi: ${campaign.title} — ${donorName}`,
          referenceId: campaignId,
        },
      })
    })

    return NextResponse.json({ message: "Donasi berhasil dikirim!", method: "WALLET" })
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
    customerEmail: donorEmail || "donatur@schoolpro.id",
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
