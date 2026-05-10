import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { saveFile } from "@/lib/services/upload"

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

    const payment = await db.invoicePayment.findUnique({
      where: { id: paymentId }
    })

    if (!payment) {
      return NextResponse.json({ error: "Pembayaran tidak ditemukan" }, { status: 404 })
    }

    // Upload file using central upload service
    const uploaded = await saveFile(file, payment.tenantId, "proofs", ["image"])
    
    // Create public URL
    const proofUrl = uploaded.path.startsWith("http") ? uploaded.path : `/uploads/${uploaded.name}`

    await db.invoicePayment.update({
      where: { id: paymentId },
      data: {
        status: "PENDING_VERIFICATION", // Update from PENDING to PENDING_VERIFICATION so UI knows proof is uploaded
        proofUrl: proofUrl
      }
    })

    return NextResponse.json({ success: true, url: proofUrl })
  } catch (error: any) {
    console.error("Upload invoice proof error:", error)
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}
