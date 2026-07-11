import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const slug = searchParams.get("slug")
    const dayParam = searchParams.get("day")

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

    // Check feature access
    const plan = tenant.plan?.toLowerCase() || "free"
    const setting = await db.platformSetting.findUnique({
      where: { key: "PLAN_FEATURE_ACCESS" }
    })
    const allPlans = setting?.value ? JSON.parse(setting.value) : {}
    const planAccess = allPlans[plan] || {}

    if (!planAccess.school_tv) {
      return NextResponse.json({ error: "Feature School TV tidak aktif untuk tenant ini" }, { status: 403 })
    }

    let dayOfWeek: number
    if (dayParam) {
      dayOfWeek = parseInt(dayParam)
    } else {
      const settings = (tenant.settings as Record<string, any>) || {}
      const timeZone = settings.timezone || "Asia/Jakarta"
      const tzDate = new Date(new Date().toLocaleString("en-US", { timeZone }))
      dayOfWeek = tzDate.getDay()
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

    // Fetch all staff members to track their teaching locations
    const allStaff = await db.staff.findMany({
      where: { tenantId: tenant.id },
      select: { id: true, name: true, role: true, imageUrl: true }
    })

    return NextResponse.json({
      tenant: {
        id: tenant.id,
        name: tenant.name,
        logo: tenant.logo,
        settings: tenant.settings,
      },
      schedules,
      donation,
      piket,
      allStaff
    })

  } catch (error) {
    console.error("[TV_API_ERROR]", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
