import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export const dynamic = "force-dynamic"
export const revalidate = 0

// Public endpoint - returns plan info including features (no auth needed)
export async function GET() {
  const plans = await db.subscriptionPlan.findMany({
    where: { isActive: true },
    select: {
      slug: true,
      name: true,
      description: true,
      price: true,
      interval: true,
      maxTeamMembers: true,
      maxStorage: true,
      monthlyAiTokens: true,
      features: true,
      isPopular: true,
    },
    orderBy: { sortOrder: "asc" },
  })

  // Normalize features for each plan (handle both array and JSON string)
  const normalized = plans.map((plan) => ({
    ...plan,
    features: normFeatures(plan.features),
  }))

  return NextResponse.json(normalized, {
    headers: { "Cache-Control": "no-store, max-age=0" },
  })
}

function normFeatures(raw: any): string[] {
  if (!raw) return []
  if (Array.isArray(raw)) return raw.filter((f: any) => typeof f === "string")
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? parsed.filter((f: any) => typeof f === "string") : []
    } catch { return [] }
  }
  return []
}
