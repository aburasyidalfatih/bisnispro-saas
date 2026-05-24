import { db } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

// Default feature access per plan
const DEFAULT_PLAN_FEATURES: Record<string, Record<string, boolean>> = {
  free: {
    website_content: true,
    dashboard_analytics: true,
    data_master: true,
    ppdb: false,
    akademik: false,
    kehadiran: false,
    keuangan: false,
    e_kantin: false,
    donasi: false,
    laporan: false,
    broadcast_wa: false,
    whatsapp_gateway: false,
    custom_domain: false,
    payment_gateway: false,
    ai_settings: false,
    email_smtp: false,
    audit_log: false,
    portal_orangtua: false,
  },
  lite: {
    website_content: true,
    dashboard_analytics: true,
    data_master: true,
    ppdb: true,
    akademik: false,
    kehadiran: false,
    keuangan: false,
    e_kantin: false,
    donasi: false,
    laporan: true,
    broadcast_wa: false,
    whatsapp_gateway: true,
    custom_domain: true,
    payment_gateway: false,
    ai_settings: false,
    email_smtp: false,
    audit_log: false,
    portal_orangtua: true,
  },
  pro: {
    website_content: true,
    dashboard_analytics: true,
    data_master: true,
    ppdb: true,
    akademik: true,
    kehadiran: true,
    keuangan: true,
    e_kantin: true,
    donasi: true,
    laporan: true,
    broadcast_wa: true,
    whatsapp_gateway: true,
    custom_domain: true,
    payment_gateway: true,
    ai_settings: true,
    email_smtp: true,
    audit_log: true,
    portal_orangtua: true,
  },
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.isSuperAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const setting = await db.platformSetting.findUnique({
      where: { key: "PLAN_FEATURE_ACCESS" },
    })

    if (!setting || !setting.value) {
      return NextResponse.json(DEFAULT_PLAN_FEATURES)
    }

    // Merge with defaults to ensure new features are included
    const stored = JSON.parse(setting.value)
    const merged: Record<string, Record<string, boolean>> = {}
    for (const plan of ["free", "lite", "pro"]) {
      merged[plan] = {
        ...DEFAULT_PLAN_FEATURES[plan],
        ...(stored[plan] || {}),
      }
    }

    return NextResponse.json(merged)
  } catch (error) {
    console.error("[FEATURES_GET]", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.isSuperAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()

    await db.platformSetting.upsert({
      where: { key: "PLAN_FEATURE_ACCESS" },
      update: { value: JSON.stringify(body) },
      create: { key: "PLAN_FEATURE_ACCESS", value: JSON.stringify(body) },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[FEATURES_POST]", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
