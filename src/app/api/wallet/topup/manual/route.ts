import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { put } from "@vercel/blob"

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

    const payment = await db.payment.findUnique({
      where: { id: paymentId }
    })

    if (!payment) {
      return NextResponse.json({ error: "Pembayaran tidak ditemukan" }, { status: 404 })
    }

    // Upload file to vercel blob
    const blob = await put(`proofs/${paymentId}-${file.name}`, file, {
      access: 'public',
    })

    const currentMeta = payment.metadata as any
    await db.payment.update({
      where: { id: paymentId },
      data: {
        status: "PENDING_VERIFICATION",
        metadata: {
           ...currentMeta,
           proofUrl: blob.url
        }
      }
    })

    return NextResponse.json({ success: true, url: blob.url })
  } catch (error: any) {
    console.error("Upload proof error:", error)
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}
