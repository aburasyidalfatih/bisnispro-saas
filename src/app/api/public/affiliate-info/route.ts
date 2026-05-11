import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const ref = searchParams.get("ref")

  if (!ref) {
    return NextResponse.json({ error: "Missing ref parameter" }, { status: 400 })
  }

  try {
    const affiliate = await db.affiliateProfile.findFirst({
      where: {
        OR: [
          { referralCode: { equals: ref, mode: "insensitive" } },
          { referralCode: { equals: `ref-${ref}`, mode: "insensitive" } }
        ],
        isActive: true
      },
      include: {
        user: { select: { name: true } }
      }
    })

    if (!affiliate) {
      return NextResponse.json({ error: "Affiliate not found" }, { status: 404 })
    }

    return NextResponse.json({ name: affiliate.user.name })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
