import { NextResponse } from "next/server"
import { logger } from "@/lib/logger"

// Token verifikasi ini digunakan saat mengatur Webhook di dashboard Meta
// Pastikan token yang diisi di dashboard Meta sama dengan token ini.
const VERIFY_TOKEN = process.env.META_WA_VERIFY_TOKEN || ""

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const mode = searchParams.get("hub.mode")
  const token = searchParams.get("hub.verify_token")
  const challenge = searchParams.get("hub.challenge")

  // Meta akan mengirim GET request untuk memverifikasi URL Webhook
  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    logger.info("Meta Webhook Verified Successfully")
    // Harus merespon dengan hub.challenge tanpa format JSON
    return new NextResponse(challenge, { status: 200 })
  }

  logger.warn("Meta Webhook Verification Failed", { mode, token })
  return new NextResponse("Forbidden", { status: 403 })
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    // logger.info("Received Meta Webhook Event:", JSON.stringify(body))
    
    // Di sini Anda dapat menambahkan logika untuk menangani pesan masuk (jika diizinkan),
    // atau melacak status pesan (sent, delivered, read, failed).

    // Contoh:
    // if (body.object === "whatsapp_business_account") { ... }

    // Selalu respon dengan 200 OK agar Meta tidak mengirim ulang event secara terus-menerus
    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    logger.error("Meta Webhook POST Error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
