import { db } from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const setting = await db.platformSetting.findUnique({
      where: { key: "FREE_PLAN_ACCESS" }
    })
    
    if (!setting || !setting.value) {
      return NextResponse.json({
        enable_ppdb: false,
        enable_finance: false,
        enable_whatsapp: false,
        enable_custom_domain: false,
        enable_analytics: false,
        enable_parent_portal: false
      })
    }
    
    return NextResponse.json(JSON.parse(setting.value))
  } catch (error) {
    return NextResponse.json({}, { status: 500 })
  }
}
