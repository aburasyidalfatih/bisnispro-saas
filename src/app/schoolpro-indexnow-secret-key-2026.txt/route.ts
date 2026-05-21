import { NextResponse } from "next/server"
import { INDEXNOW_KEY } from "@/lib/seo/indexnow.service"

export async function GET() {
  return new NextResponse(INDEXNOW_KEY, {
    status: 200,
    headers: {
      "Content-Type": "text/plain",
      "Cache-Control": "public, max-age=86400, s-maxage=86400", // Cache 1 hari
    },
  })
}
