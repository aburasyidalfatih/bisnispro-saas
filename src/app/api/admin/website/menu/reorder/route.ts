import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  const session = await auth()
  const tenantId = (session?.user as any)?.tenants?.[0]?.id

  if (!session || !tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { items } = await req.json()
    // items is an array of { id, order, parentId }

    if (!Array.isArray(items)) {
      return NextResponse.json({ error: "Invalid data format" }, { status: 400 })
    }

    // Execute in transaction
    await db.$transaction(
      items.map((item: any) => 
        db.websiteMenu.update({
          where: { id: item.id, tenantId },
          data: { 
            order: item.order,
            parentId: item.parentId || null
          }
        })
      )
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[WEBSITE_MENU_REORDER]", error)
    return NextResponse.json({ error: "Internal Error" }, { status: 500 })
  }
}
