import { NextRequest, NextResponse } from "next/server"
import sharp from "sharp"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const imageUrl = searchParams.get("url")

    if (!imageUrl) {
      return new NextResponse("Missing url parameter", { status: 400 })
    }

    // SSRF Protection: Validasi URL dan blokir internal/private IPs
    try {
      const parsedUrl = new URL(imageUrl)
      
      // Hanya izinkan HTTP / HTTPS
      if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
        return new NextResponse("Invalid protocol", { status: 400 })
      }

      // Blokir Private / Internal IP ranges (127.x, 10.x, 192.168.x, 172.16-31.x, localhost)
      const hostname = parsedUrl.hostname.toLowerCase()
      const isPrivateIP = /(^127\.)|(^10\.)|(^172\.1[6-9]\.)|(^172\.2[0-9]\.)|(^172\.3[0-1]\.)|(^192\.168\.)|(^0\.0\.0\.0)/.test(hostname)
      
      // Jika di production, blokir localhost dan IP private
      if (process.env.NODE_ENV === "production" && (isPrivateIP || hostname === "localhost" || hostname === "[::1]")) {
        return new NextResponse("SSRF Attempt Blocked: Internal IPs are not allowed", { status: 403 })
      }
    } catch (e) {
      return new NextResponse("Invalid URL format", { status: 400 })
    }

    // Fetch the original image
    const response = await fetch(imageUrl)
    if (!response.ok) {
      return new NextResponse("Failed to fetch image", { status: 400 })
    }

    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Convert to JPEG using sharp
    // This ensures Facebook and WhatsApp can read it (they don't fully support WebP)
    const outputBuffer = await sharp(buffer)
      .resize(1200, 630, { fit: "cover", position: "center" })
      .jpeg({ quality: 80 })
      .toBuffer()

    return new NextResponse(new Uint8Array(outputBuffer), {
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    })
  } catch (error) {
    console.error("OG Proxy Error:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
