import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const tenantId = (session.user as any).tenants?.[0]?.id
    if (!tenantId) {
      return NextResponse.json({ error: "No tenant" }, { status: 400 })
    }

    const url = new URL(req.url)
    const days = Number(url.searchParams.get("days") || "30")

    const now = new Date()
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const startOfToday = new Date(); startOfToday.setHours(0, 0, 0, 0)

    // All page views in the period
    const pageViews = await db.pageView.findMany({
      where: { tenantId, createdAt: { gte: startDate } },
      select: {
        path: true,
        source: true,
        medium: true,
        device: true,
        browser: true,
        ipHash: true,
        sessionId: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    })

    // --- Total Stats ---
    const totalViews = pageViews.length
    const uniqueVisitors = new Set(pageViews.map(pv => pv.sessionId || pv.ipHash)).size
    const todayViews = pageViews.filter(pv => pv.createdAt >= startOfToday).length
    const todayVisitors = new Set(
      pageViews.filter(pv => pv.createdAt >= startOfToday).map(pv => pv.sessionId || pv.ipHash)
    ).size

    // --- Traffic Sources ---
    const sourceMap = new Map<string, number>()
    pageViews.forEach(pv => {
      const src = pv.source || "direct"
      sourceMap.set(src, (sourceMap.get(src) || 0) + 1)
    })
    const trafficSources = [...sourceMap.entries()]
      .map(([name, views]) => ({ name, views }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 15)

    // --- Traffic Medium ---
    const mediumMap = new Map<string, number>()
    pageViews.forEach(pv => {
      const med = pv.medium || "unknown"
      mediumMap.set(med, (mediumMap.get(med) || 0) + 1)
    })
    const trafficMediums = [...mediumMap.entries()]
      .map(([name, views]) => ({ name, views }))
      .sort((a, b) => b.views - a.views)

    // --- Top Pages ---
    const pageMap = new Map<string, number>()
    pageViews.forEach(pv => {
      pageMap.set(pv.path, (pageMap.get(pv.path) || 0) + 1)
    })
    const topPages = [...pageMap.entries()]
      .map(([path, views]) => ({ path, views }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 15)

    // --- Device Breakdown ---
    const deviceMap = new Map<string, number>()
    pageViews.forEach(pv => {
      const dev = pv.device || "unknown"
      deviceMap.set(dev, (deviceMap.get(dev) || 0) + 1)
    })
    const devices = [...deviceMap.entries()]
      .map(([name, views]) => ({ name, views }))
      .sort((a, b) => b.views - a.views)

    // --- Browser Breakdown ---
    const browserMap = new Map<string, number>()
    pageViews.forEach(pv => {
      const br = pv.browser || "unknown"
      browserMap.set(br, (browserMap.get(br) || 0) + 1)
    })
    const browsers = [...browserMap.entries()]
      .map(([name, views]) => ({ name, views }))
      .sort((a, b) => b.views - a.views)

    // --- Daily Trend ---
    const dailyMap = new Map<string, { views: number; visitors: Set<string> }>()
    for (let i = Math.min(days, 30) - 1; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      const key = d.toLocaleDateString("id-ID", { day: "2-digit", month: "short" })
      dailyMap.set(key, { views: 0, visitors: new Set() })
    }
    pageViews.forEach(pv => {
      const key = pv.createdAt.toLocaleDateString("id-ID", { day: "2-digit", month: "short" })
      const entry = dailyMap.get(key)
      if (entry) {
        entry.views++
        entry.visitors.add(pv.sessionId || pv.ipHash || "unknown")
      }
    })
    const dailyTrend = [...dailyMap.entries()].map(([date, data]) => ({
      date,
      views: data.views,
      visitors: data.visitors.size,
    }))

    return NextResponse.json({
      totalViews,
      uniqueVisitors,
      todayViews,
      todayVisitors,
      trafficSources,
      trafficMediums,
      topPages,
      devices,
      browsers,
      dailyTrend,
      period: days,
    })
  } catch (error) {
    console.error("Visitor analytics error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
