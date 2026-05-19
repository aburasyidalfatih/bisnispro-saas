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

    return new NextResponse(outputBuffer, {
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
