import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET() {
  try {
    const keys = ["app_logo", "platform_name", "platform_tagline", "GOOGLE_CLIENT_ID"]
    const settings = await db.platformSetting.findMany({
      where: { key: { in: keys } },
    })

    const data: Record<string, any> = {
      app_logo: "/logo-schoolpro.png", // fallback
      platform_name: "SchoolPro",
      platform_tagline: "Solusi Manajemen Sekolah Digital",
      googleAuthEnabled: false,
    }

    settings.forEach(s => {
      if (s.value) {
        if (s.key === "GOOGLE_CLIENT_ID") {
          data.googleAuthEnabled = true
        } else {
          data[s.key] = s.value
        }
      }
    })

    if (!data.googleAuthEnabled && process.env.GOOGLE_CLIENT_ID) {
      data.googleAuthEnabled = true
    }

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ 
      app_logo: "/logo-schoolpro.png",
      platform_name: "SchoolPro",
    })
  }
}
