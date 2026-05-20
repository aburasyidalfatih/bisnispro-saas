import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // Return only active packages for tenants
  const packages = await db.aiTokenPackage.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" }
  })
  
  return NextResponse.json(packages)
}
