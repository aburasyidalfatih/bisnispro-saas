import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

// GET: Fetch Meta Ads settings
export async function GET() {
  const session = await auth()
  if (!session?.user?.isSuperAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const settings = await db.platformSetting.findMany({
      where: { key: { in: ["META_ADS_ACCESS_TOKEN", "META_ADS_ACCOUNT_ID"] } },
    })

    const token = settings.find(s => s.key === "META_ADS_ACCESS_TOKEN")?.value || ""
    const accountId = settings.find(s => s.key === "META_ADS_ACCOUNT_ID")?.value || ""

    // Verify connection by fetching account info
    let connected = false
    let accountName = ""
    if (token && accountId) {
      try {
        const cleanId = accountId.replace(/^act_/, "")
        const res = await fetch(
          `https://graph.facebook.com/v21.0/act_${cleanId}?fields=name,account_status,currency,timezone_name&access_token=${token}`
        )
        const data = await res.json()
        if (data.name && !data.error) {
          connected = true
          accountName = data.name
        }
      } catch {
        // Connection failed
      }
    }

    return NextResponse.json({
      connected,
      accountName,
      accountId: accountId ? accountId.replace(/^act_/, "") : "",
      hasToken: !!token,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST: Save Meta Ads credentials
export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.isSuperAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { accessToken, accountId } = await req.json()

    if (!accessToken || !accountId) {
      return NextResponse.json({ error: "Access Token dan Ad Account ID wajib diisi" }, { status: 400 })
    }

    // Verify credentials with Meta API
    const cleanId = accountId.replace(/^act_/, "")
    const verifyRes = await fetch(
      `https://graph.facebook.com/v21.0/act_${cleanId}?fields=name,account_status,currency&access_token=${accessToken}`
    )
    const verifyData = await verifyRes.json()

    if (verifyData.error) {
      return NextResponse.json({
        error: `Meta API Error: ${verifyData.error.message}`,
      }, { status: 400 })
    }

    // Save to platform settings
    await db.platformSetting.upsert({
      where: { key: "META_ADS_ACCESS_TOKEN" },
      create: { key: "META_ADS_ACCESS_TOKEN", value: accessToken },
      update: { value: accessToken },
    })

    await db.platformSetting.upsert({
      where: { key: "META_ADS_ACCOUNT_ID" },
      create: { key: "META_ADS_ACCOUNT_ID", value: cleanId },
      update: { value: cleanId },
    })

    return NextResponse.json({
      success: true,
      accountName: verifyData.name,
      message: `Berhasil terhubung ke akun "${verifyData.name}"`,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE: Disconnect Meta Ads
export async function DELETE() {
  const session = await auth()
  if (!session?.user?.isSuperAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    await db.platformSetting.deleteMany({
      where: { key: { in: ["META_ADS_ACCESS_TOKEN", "META_ADS_ACCOUNT_ID"] } },
    })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
