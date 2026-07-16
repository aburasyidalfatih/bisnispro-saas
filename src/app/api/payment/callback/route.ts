import { NextResponse } from "next/server"
import crypto from "crypto"
import { handleCallback } from "@/features/finance/services/payment.service"
import { logger } from "@/lib/logger"
import { apiHandler } from "@/lib/api-utils"

export const POST = apiHandler(async (req: Request) => {
  try {
    const rawBody = await req.text()
    const body = JSON.parse(rawBody)

    const callbackSignature = req.headers.get("x-callback-signature")
    if (!callbackSignature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 403 })
    }

    logger.info("Payment callback received", {
      merchantRef: body.merchant_ref,
      status: body.status,
    })

    const res = await handleCallback(body, rawBody, callbackSignature)

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
}, { rateLimit: 30, rateLimitWindowMs: 60000 })
