import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function POST(req: Request) {
  try {
    const { ref } = await req.json()

    if (!ref) {
      return NextResponse.json({ error: "Missing ref parameter" }, { status: 400 })
    }

    const affiliate = await db.affiliateProfile.findFirst({
      where: {
        OR: [
          { referralCode: { equals: ref, mode: "insensitive" } },
          { referralCode: { equals: `ref-${ref}`, mode: "insensitive" } }
        ],
        isActive: true
      }
    })

    if (!affiliate) {
      return NextResponse.json({ error: "Affiliate not found" }, { status: 404 })
    }

    await db.affiliateProfile.update({
      where: { id: affiliate.id },
      data: { clicks: { increment: 1 } }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Track referral error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
