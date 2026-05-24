import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { subscriptionPlanSchema } from "@/features/super-admin/schemas/super-admin.schema"
import { logger } from "@/lib/logger"

function safeParseFeatures(features: string | undefined): string[] {
  if (!features || features === "[]" || features === "") return []
  try {
    const parsed = JSON.parse(features)
    if (Array.isArray(parsed)) {
      return parsed.filter((f: any) => typeof f === "string" && f.trim() !== "")
    }
    return []
  } catch {
    return []
  }
}

export async function GET() {
  const session = await auth()
  if (!session?.user?.isSuperAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const plans = await db.subscriptionPlan.findMany({
    orderBy: { sortOrder: "asc" }
  })
  
  return NextResponse.json(plans)
}

// POST disabled — plans are fixed (free, lite, pro)
export async function POST() {
  return NextResponse.json(
    { error: "Paket sudah dipatenkan (Free, Lite, Pro). Tidak bisa menambah paket baru." },
    { status: 403 }
  )
}

export async function PUT(req: Request) {
  const session = await auth()
  if (!session?.user?.isSuperAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  try {
    const body = await req.json()
    const { id, ...data } = body
    if (!id) return NextResponse.json({ error: "ID is required" }, { status: 400 })
    
    const validated = subscriptionPlanSchema.parse(data)
    
    const plan = await db.subscriptionPlan.update({
      where: { id },
      data: {
        ...validated,
        features: safeParseFeatures(validated.features)
      }
    })

    return NextResponse.json(plan)
  } catch (error) {
    logger.error("Plan update failed", error, { path: "/api/super-admin/plans" })
    return NextResponse.json({ error: "Gagal memperbarui paket" }, { status: 400 })
  }
}

// DELETE disabled — plans are fixed (free, lite, pro)
export async function DELETE() {
  return NextResponse.json(
    { error: "Paket sudah dipatenkan (Free, Lite, Pro). Tidak bisa menghapus paket." },
    { status: 403 }
  )
}
