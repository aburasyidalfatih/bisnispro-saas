import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.isSuperAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const settings = await db.platformSetting.findMany({
      where: { key: { in: ["META_ADS_ACCESS_TOKEN", "META_ADS_ACCOUNT_ID"] } },
    })
    const token = settings.find(s => s.key === "META_ADS_ACCESS_TOKEN")?.value
    const accountId = settings.find(s => s.key === "META_ADS_ACCOUNT_ID")?.value

    if (!token || !accountId) {
      return NextResponse.json({ error: "Meta Ads belum terhubung" }, { status: 400 })
    }

    const { searchParams } = new URL(req.url)
    const datePreset = searchParams.get("date_preset") || "this_month"

    // Fetch campaigns
    const campaignsRes = await fetch(
      `https://graph.facebook.com/v21.0/act_${accountId}/campaigns?fields=id,name,status,objective,daily_budget,lifetime_budget,start_time,stop_time&limit=50&access_token=${token}`
    )
    const campaignsData = await campaignsRes.json()

    if (campaignsData.error) {
      return NextResponse.json({ error: campaignsData.error.message }, { status: 400 })
    }

    // Fetch insights per campaign
    const insightsRes = await fetch(
      `https://graph.facebook.com/v21.0/act_${accountId}/insights?fields=campaign_id,campaign_name,spend,impressions,clicks,cpc,ctr,reach,frequency,actions&date_preset=${datePreset}&level=campaign&limit=50&access_token=${token}`
    )
    const insightsData = await insightsRes.json()

    // Fetch account-level summary
    const summaryRes = await fetch(
      `https://graph.facebook.com/v21.0/act_${accountId}/insights?fields=spend,impressions,clicks,cpc,ctr,reach,actions&date_preset=${datePreset}&access_token=${token}`
    )
    const summaryData = await summaryRes.json()

    // Process campaigns with insights
    const campaigns = (campaignsData.data || []).map((c: any) => {
      const insight = (insightsData.data || []).find((i: any) => i.campaign_id === c.id)
      const leads = insight?.actions?.find((a: any) => a.action_type === "lead")?.value || 0
      const pageViews = insight?.actions?.find((a: any) => a.action_type === "landing_page_view")?.value || 0

      return {
        id: c.id,
        name: c.name,
        status: c.status,
        objective: c.objective,
        dailyBudget: c.daily_budget ? parseInt(c.daily_budget) / 100 : 0,
        lifetimeBudget: c.lifetime_budget ? parseInt(c.lifetime_budget) / 100 : 0,
        startTime: c.start_time,
        stopTime: c.stop_time,
        spend: insight ? parseFloat(insight.spend || '0') : 0,
        impressions: insight ? parseInt(insight.impressions || '0') : 0,
        clicks: insight ? parseInt(insight.clicks || '0') : 0,
        cpc: insight ? parseFloat(insight.cpc || '0') : 0,
        ctr: insight ? parseFloat(insight.ctr || '0') : 0,
        reach: insight ? parseInt(insight.reach || '0') : 0,
        leads: parseInt(leads),
        pageViews: parseInt(pageViews),
      }
    })

    // Account summary
    const summary = summaryData.data?.[0] || {}
    const totalLeads = summary.actions?.find((a: any) => a.action_type === "lead")?.value || 0

    return NextResponse.json({
      campaigns,
      summary: {
        totalSpend: parseFloat(summary.spend || '0'),
        totalImpressions: parseInt(summary.impressions || '0'),
        totalClicks: parseInt(summary.clicks || '0'),
        totalReach: parseInt(summary.reach || '0'),
        avgCpc: parseFloat(summary.cpc || '0'),
        avgCtr: parseFloat(summary.ctr || '0'),
        totalLeads: parseInt(totalLeads),
      },
      datePreset,
    })
  } catch (error: any) {
    console.error("Meta Campaigns Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
