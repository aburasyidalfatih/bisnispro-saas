import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

// POST: Campaign actions (pause, resume, update budget)
export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.isSuperAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const settings = await db.platformSetting.findMany({
      where: { key: { in: ["META_ADS_ACCESS_TOKEN", "META_ADS_ACCOUNT_ID"] } },
    })
    const token = settings.find(s => s.key === "META_ADS_ACCESS_TOKEN")?.value
    if (!token) return NextResponse.json({ error: "Meta Ads belum terhubung" }, { status: 400 })

    const { action, campaignId, budget } = await req.json()

    if (!campaignId) {
      return NextResponse.json({ error: "Campaign ID wajib diisi" }, { status: 400 })
    }

    let result: any

    switch (action) {
      case "pause": {
        const res = await fetch(`https://graph.facebook.com/v21.0/${campaignId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "PAUSED", access_token: token }),
        })
        result = await res.json()
        break
      }
      case "resume": {
        const res = await fetch(`https://graph.facebook.com/v21.0/${campaignId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "ACTIVE", access_token: token }),
        })
        result = await res.json()
        break
      }
      case "update_budget": {
        if (!budget || budget <= 0) {
          return NextResponse.json({ error: "Budget harus lebih dari 0" }, { status: 400 })
        }
        // Budget in Meta API is in cents
        const budgetInCents = Math.round(budget * 100)
        const res = await fetch(`https://graph.facebook.com/v21.0/${campaignId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ daily_budget: budgetInCents, access_token: token }),
        })
        result = await res.json()
        break
      }
      default:
        return NextResponse.json({ error: "Action tidak valid" }, { status: 400 })
    }

    if (result.error) {
      return NextResponse.json({ error: result.error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, result })
  } catch (error: any) {
    console.error("Meta Ads Action Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
