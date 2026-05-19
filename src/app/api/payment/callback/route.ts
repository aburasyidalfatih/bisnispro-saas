import { NextResponse } from "next/server"
import crypto from "crypto"
import { handleCallback } from "@/features/finance/services/payment.service"
import { logger } from "@/lib/logger"

export async function POST(req: Request) {
  try {
    const body = await req.json()

    // Verifikasi signature dari Tripay
    const signature = crypto
      .createHmac("sha256", process.env.TRIPAY_PRIVATE_KEY || "")
      .update(JSON.stringify(body))
      .digest("hex")

    const callbackSignature = req.headers.get("x-callback-signature")
    if (callbackSignature !== signature) {
      logger.warn("Payment callback: invalid signature", {
        merchantRef: body.merchant_ref,
      })
      return NextResponse.json({ error: "Invalid signature" }, { status: 403 })
    }

    logger.info("Payment callback received", {
      merchantRef: body.merchant_ref,
      status: body.status,
    })

    const res = await handleCallback(body)

    if (!res.success) {
      logger.warn("Payment callback processing failed", {
        merchantRef: body.merchant_ref,
        error: res.error
      })
      return NextResponse.json({ error: res.error }, { status: 400 })
    }

    const result = res.data

    logger.info("Payment callback processed", {
      paymentId: result?.id,
      status: result?.status,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error("Payment callback error", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
