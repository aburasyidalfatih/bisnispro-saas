import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { saveFile } from "@/features/upload/services/upload.service"

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const formData = await req.formData()
    const file = formData.get("file") as File
    const paymentId = formData.get("paymentId") as string

    if (!file || !paymentId) {
      return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 })
    }

    const { db } = await import("@/lib/db")
    const payment = await db.payment.findUnique({ where: { id: paymentId } })
    if (!payment) {
      return NextResponse.json({ error: "Pembayaran tidak ditemukan" }, { status: 404 })
    }

    // Upload file using central upload service
    const uploaded = await saveFile(file, payment.tenantId, "proofs", ["image"])
    if (!uploaded.success || !uploaded.data) {
      return NextResponse.json({ error: uploaded.error || "Gagal mengupload bukti pembayaran" }, { status: 400 })
    }

    const proofUrl = uploaded.data.url

    const { submitManualTopupProof } = await import("@/features/finance/services/wallet.service")
    const result = await submitManualTopupProof(paymentId, proofUrl)
    return NextResponse.json(result)
  } catch (error: any) {
    console.error("Upload proof error:", error)
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}
