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

    // 1. Fetch campaigns
    const campaignsRes = await fetch(
      `https://graph.facebook.com/v21.0/act_${accountId}/campaigns?fields=id,name,status,objective,daily_budget,lifetime_budget,start_time,stop_time&limit=50&access_token=${token}`
    )
    const campaignsData = await campaignsRes.json()
    if (campaignsData.error) return NextResponse.json({ error: campaignsData.error.message }, { status: 400 })

    // 2. Fetch insights per campaign
    const insightsRes = await fetch(
      `https://graph.facebook.com/v21.0/act_${accountId}/insights?fields=campaign_id,campaign_name,spend,impressions,clicks,cpc,ctr,reach,frequency,actions,cost_per_action_type&date_preset=${datePreset}&level=campaign&limit=50&access_token=${token}`
    )
    const insightsData = await insightsRes.json()

    // 3. Fetch account-level summary
    const summaryRes = await fetch(
      `https://graph.facebook.com/v21.0/act_${accountId}/insights?fields=spend,impressions,clicks,cpc,ctr,reach,frequency,actions&date_preset=${datePreset}&access_token=${token}`
    )
    const summaryData = await summaryRes.json()

    // 4. Fetch daily trend (last 14 days or period)
    let dailyTrend: any[] = []
    try {
      const dailyRes = await fetch(
        `https://graph.facebook.com/v21.0/act_${accountId}/insights?fields=spend,impressions,clicks,reach,actions&date_preset=${datePreset}&time_increment=1&limit=60&access_token=${token}`
      )
      const dailyData = await dailyRes.json()
      dailyTrend = (dailyData.data || []).map((d: any) => ({
        date: d.date_start,
        spend: parseFloat(d.spend || '0'),
        impressions: parseInt(d.impressions || '0'),
        clicks: parseInt(d.clicks || '0'),
        reach: parseInt(d.reach || '0'),
        leads: parseInt(d.actions?.find((a: any) => a.action_type === "lead")?.value || '0'),
      }))
    } catch { /* ignore */ }

    // 5. Fetch age & gender breakdown
    let ageGenderBreakdown: any[] = []
    try {
      const ageRes = await fetch(
        `https://graph.facebook.com/v21.0/act_${accountId}/insights?fields=spend,impressions,clicks,reach,actions&date_preset=${datePreset}&breakdowns=age,gender&limit=100&access_token=${token}`
      )
      const ageData = await ageRes.json()
      ageGenderBreakdown = (ageData.data || []).map((d: any) => ({
        age: d.age,
        gender: d.gender === 'male' ? 'Pria' : d.gender === 'female' ? 'Wanita' : d.gender,
        spend: parseFloat(d.spend || '0'),
        impressions: parseInt(d.impressions || '0'),
        clicks: parseInt(d.clicks || '0'),
        reach: parseInt(d.reach || '0'),
        leads: parseInt(d.actions?.find((a: any) => a.action_type === "lead")?.value || '0'),
      }))
    } catch { /* ignore */ }

    // 6. Fetch placement breakdown
    let placementBreakdown: any[] = []
    try {
      const placeRes = await fetch(
        `https://graph.facebook.com/v21.0/act_${accountId}/insights?fields=spend,impressions,clicks,reach,actions&date_preset=${datePreset}&breakdowns=publisher_platform,platform_position&limit=50&access_token=${token}`
      )
      const placeData = await placeRes.json()
      placementBreakdown = (placeData.data || []).map((d: any) => ({
        platform: d.publisher_platform || 'unknown',
        position: d.platform_position || 'unknown',
        spend: parseFloat(d.spend || '0'),
        impressions: parseInt(d.impressions || '0'),
        clicks: parseInt(d.clicks || '0'),
        reach: parseInt(d.reach || '0'),
      }))
    } catch { /* ignore */ }

    // Process campaigns with insights
    const campaigns = (campaignsData.data || []).map((c: any) => {
      const insight = (insightsData.data || []).find((i: any) => i.campaign_id === c.id)
      const leads = insight?.actions?.find((a: any) => a.action_type === "lead")?.value || 0
      const costPerLead = insight?.cost_per_action_type?.find((a: any) => a.action_type === "lead")?.value || 0

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
        frequency: insight ? parseFloat(insight.frequency || '0') : 0,
        leads: parseInt(leads),
        costPerLead: parseFloat(costPerLead),
      }
    })

    // Account summary
    const summary = summaryData.data?.[0] || {}
    const totalLeads = summary.actions?.find((a: any) => a.action_type === "lead")?.value || 0

    // Generate smart recommendations
    const activeCampaigns = campaigns.filter((c: any) => c.status === 'ACTIVE' && c.spend > 0)
    const recommendations: { type: string; title: string; message: string; campaignName?: string }[] = []

    if (activeCampaigns.length > 0) {
      // Best performing campaign (lowest CPC with > 10 clicks)
      const withClicks = activeCampaigns.filter((c: any) => c.clicks >= 10)
      if (withClicks.length > 0) {
        const best = withClicks.reduce((a: any, b: any) => a.cpc < b.cpc ? a : b)
        recommendations.push({
          type: 'success',
          title: '🏆 Kampanye Terbaik',
          message: `"${best.name}" memiliki CPC terendah (Rp ${Math.round(best.cpc).toLocaleString('id-ID')}) dengan ${best.clicks} clicks. Pertimbangkan untuk naikkan budget kampanye ini.`,
          campaignName: best.name,
        })
      }

      // Worst performing (highest CPC)
      if (withClicks.length > 1) {
        const worst = withClicks.reduce((a: any, b: any) => a.cpc > b.cpc ? a : b)
        if (worst.cpc > 2000) {
          recommendations.push({
            type: 'warning',
            title: '⚠️ CPC Tinggi',
            message: `"${worst.name}" memiliki CPC Rp ${Math.round(worst.cpc).toLocaleString('id-ID')}. Pertimbangkan untuk optimasi targeting atau jeda kampanye ini.`,
            campaignName: worst.name,
          })
        }
      }

      // Low CTR warning
      const lowCtr = activeCampaigns.filter((c: any) => c.ctr < 1 && c.impressions > 500)
      lowCtr.forEach((c: any) => {
        recommendations.push({
          type: 'info',
          title: '📉 CTR Rendah',
          message: `"${c.name}" hanya ${c.ctr.toFixed(2)}% CTR. Coba ganti creative/copy iklan untuk meningkatkan daya tarik.`,
          campaignName: c.name,
        })
      })

      // High frequency warning
      const highFreq = activeCampaigns.filter((c: any) => c.frequency > 3)
      highFreq.forEach((c: any) => {
        recommendations.push({
          type: 'warning',
          title: '🔄 Frekuensi Tinggi',
          message: `"${c.name}" sudah ditampilkan ${c.frequency.toFixed(1)}x per orang. Audience mungkin sudah jenuh — perluas targeting atau ganti creative.`,
          campaignName: c.name,
        })
      })
    }

    // Budget recommendation
    const totalSpend = parseFloat(summary.spend || '0')
    const totalClicks = parseInt(summary.clicks || '0')
    if (totalSpend > 0 && totalClicks > 0) {
      const avgCpc = totalSpend / totalClicks
      if (avgCpc < 500) {
        recommendations.push({
          type: 'success',
          title: '💰 CPC Efisien',
          message: `Rata-rata CPC Anda Rp ${Math.round(avgCpc).toLocaleString('id-ID')} — sangat efisien! Pertimbangkan untuk scaling budget.`,
        })
      }
    }

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
        frequency: parseFloat(summary.frequency || '0'),
      },
      dailyTrend,
      ageGenderBreakdown,
      placementBreakdown,
      recommendations,
      datePreset,
    })
  } catch (error: any) {
    console.error("Meta Campaigns Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
