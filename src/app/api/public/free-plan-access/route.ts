import { db } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

const DEFAULT_FREE_ACCESS: Record<string, boolean> = {
  enable_ppdb: false,
  enable_finance: false,
  enable_whatsapp: false,
  enable_custom_domain: false,
  enable_analytics: false,
  enable_parent_portal: false,
}

// Mapping dari key baru ke key lama (backward compat)
const KEY_MAP: Record<string, string> = {
  ppdb: "enable_ppdb",
  keuangan: "enable_finance",
  e_kantin: "enable_finance",
  whatsapp_gateway: "enable_whatsapp",
  custom_domain: "enable_custom_domain",
  dashboard_analytics: "enable_analytics",
  portal_orangtua: "enable_parent_portal",
  website_content: "enable_website",
  data_master: "enable_data_master",
  akademik: "enable_akademik",
  kehadiran_guru: "enable_kehadiran_guru",
  kehadiran_siswa: "enable_kehadiran_siswa",
  donasi: "enable_donasi",
  laporan: "enable_analytics",
  broadcast_wa: "enable_broadcast_wa",
  payment_gateway: "enable_finance",
  ai_settings: "enable_ai",
  email_smtp: "enable_email",
  audit_log: "enable_audit_log",
}

export async function GET(req: NextRequest) {
  try {
    const plan = req.nextUrl.searchParams.get("plan") || "free"

    // Coba baca dari key baru dulu
    const newSetting = await db.platformSetting.findUnique({
      where: { key: "PLAN_FEATURE_ACCESS" },
    })

    if (newSetting?.value) {
      const allPlans = JSON.parse(newSetting.value)
      const normalizedPlan = plan.toLowerCase()
      const planAccess = allPlans[normalizedPlan] || allPlans["free"] || {}

      // Convert ke format lama untuk backward compatibility dengan hook
      const legacyFormat: Record<string, boolean> = { ...DEFAULT_FREE_ACCESS }
      for (const [newKey, oldKey] of Object.entries(KEY_MAP)) {
        if (planAccess[newKey] !== undefined) {
          legacyFormat[oldKey] = planAccess[newKey]
        }
      }
      
      // Keep enable_kehadiran for backward compatibility (mapped to student attendance / pro)
      legacyFormat["enable_kehadiran"] = !!planAccess["kehadiran_siswa"]

      // Juga return raw plan access untuk hook baru
      return NextResponse.json({
        ...legacyFormat,
        _plan_access: planAccess,
      })
    }

    // Fallback ke key lama (FREE_PLAN_ACCESS)
    const oldSetting = await db.platformSetting.findUnique({
      where: { key: "FREE_PLAN_ACCESS" },
    })

    if (!oldSetting || !oldSetting.value) {
      return NextResponse.json({
        ...DEFAULT_FREE_ACCESS,
        _plan_access: {},
      })
    }

    return NextResponse.json({
      ...JSON.parse(oldSetting.value),
      _plan_access: {},
    })
  } catch (error) {
    return NextResponse.json({
      ...DEFAULT_FREE_ACCESS,
      _plan_access: {},
    }, { status: 500 })
  }
}
