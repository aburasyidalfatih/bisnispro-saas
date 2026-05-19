import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireTenantAccess } from "@/lib/guards/tenant-guard"
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

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const parsed = paySchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const { tenantId, amount, method, proofUrl, notes } = parsed.data

  try { await requireTenantAccess(tenantId) } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 403 }) }

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

  const { tenantId, paymentId, action, notes } = await req.json() // action: VERIFIED | REJECTED

  try { await requireTenantAccess(tenantId) } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 403 }) }

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
