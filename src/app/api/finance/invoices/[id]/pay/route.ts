import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireTenantMembership } from "@/lib/api-utils"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { FinanceService } from "@/features/finance/services/finance.service"

const paySchema = z.object({
  tenantId: z.string(),
  amount: z.number().min(1),
  method: z.enum(["WALLET", "TRANSFER", "CASH", "TRIPAY"]),
  proofUrl: z.string().optional(),
  notes: z.string().optional(),
})

const verifySchema = z.object({
  tenantId: z.string(),
  paymentId: z.string(),
  action: z.enum(["VERIFIED", "REJECTED"]),
  notes: z.string().optional(),
})

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const parsed = paySchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const { tenantId, amount, method, proofUrl, notes } = parsed.data

  const { error: accessError } = await requireTenantMembership(tenantId);
    if (accessError) return accessError;

  try {
    const res = await FinanceService.processPayment({
      tenantId,
      invoiceId: id,
      amount,
      method,
      proofUrl,
      notes,
      userId: session.user.id
    })

    if (!res.success || !res.data) {
      return NextResponse.json({ error: res.error || "Pembayaran gagal diproses" }, { status: 400 })
    }

    const result = res.data

    return NextResponse.json(
      { message: result.message, paymentId: result.paymentId }, 
      { status: result.status === "PENDING" ? 201 : 200 }
    )
  } catch (error: any) {
    console.error("Payment error:", error)
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}

// Admin verifikasi pembayaran manual
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: invoiceId } = await params
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const parsed = verifySchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ error: "Data tidak valid", details: parsed.error.flatten() }, { status: 400 })
  }
  const { tenantId, paymentId, action, notes } = parsed.data

  const { error: accessError } = await requireTenantMembership(tenantId);
    if (accessError) return accessError;

  try {
    const res = await FinanceService.verifyPayment({
      tenantId,
      paymentId,
      action,
      notes,
      userId: session.user.id
    })

    if (!res.success || !res.data) {
      return NextResponse.json({ error: res.error || "Gagal memverifikasi pembayaran" }, { status: 400 })
    }

    return NextResponse.json({ message: res.data.message })
  } catch (error: any) {
    console.error("Verification error:", error)
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}
