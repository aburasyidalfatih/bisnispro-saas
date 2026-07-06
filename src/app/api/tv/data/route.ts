import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const slug = searchParams.get("slug")
    const dayOfWeek = parseInt(searchParams.get("day") || "1")

    if (!slug) {
      return NextResponse.json({ error: "Missing slug" }, { status: 400 })
    }

    // Get Tenant
    const tenant = await db.tenant.findUnique({
      where: { slug }
    })

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 })
    }

    // Get schedules for today
    const schedules = await db.schedule.findMany({
      where: {
        tenantId: tenant.id,
        dayOfWeek: dayOfWeek,
      },
      include: {
        subject: { select: { name: true } },
        classroom: { select: { name: true, level: true } },
        staff: { select: { name: true, imageUrl: true } }
      },
      orderBy: { startTime: 'asc' }
    })

    // Let's get active donation campaign
    const donation = await db.donationCampaign.findFirst({
      where: { tenantId: tenant.id, isActive: true, isPublic: true },
      orderBy: { createdAt: 'desc' }
    })

    // Get "Guru Piket" from settings if configured
    let piket = []
    const settings = (tenant.settings as Record<string, any>) || {}
    
    if (settings.piketSettings && settings.piketSettings[dayOfWeek]) {
      piket = settings.piketSettings[dayOfWeek]
    } else {
      // Fallback: get 2 random staff members
      const staffCount = await db.staff.count({ where: { tenantId: tenant.id } })
      const skip = Math.max(0, Math.floor(Math.random() * (staffCount - 2)))
      const randomStaff = await db.staff.findMany({
        where: { tenantId: tenant.id },
        take: 2,
        skip: skip,
        select: { name: true, role: true }
      })
      piket = randomStaff.map(s => ({
        id: s.name,
        time: "Hari Ini",
        names: `${s.name} (${s.role || "Guru"})`
      }))
    }

    return NextResponse.json({
      tenant: {
        id: tenant.id,
        name: tenant.name,
        logo: tenant.logo,
        settings: tenant.settings,
      },
      schedules,
      donation,
      piket
    })

  } catch (error) {
    console.error("[TV_API_ERROR]", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
