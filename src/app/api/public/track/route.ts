import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { headers } from "next/headers"
import crypto from "crypto"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { tenantId, path, referrer, source, medium, campaign, sessionId } = body

    if (!tenantId || !path) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const headerList = await headers()
    const userAgent = headerList.get("user-agent") || ""
    const forwarded = headerList.get("x-forwarded-for")
    const ip = forwarded?.split(",")[0]?.trim() || headerList.get("x-real-ip") || "unknown"

    // Hash IP for privacy (don't store raw IP)
    const ipHash = crypto.createHash("sha256").update(ip + tenantId).digest("hex").slice(0, 16)

    // Parse device & browser from user-agent
    const device = parseDevice(userAgent)
    const browser = parseBrowser(userAgent)

    // Detect source from referrer if UTM not provided
    const detectedSource = source || detectSourceFromReferrer(referrer || "")

    await db.pageView.create({
      data: {
        tenantId,
        path,
        referrer: referrer?.substring(0, 500) || null,
        source: detectedSource || null,
        medium: medium || (detectedSource ? detectMedium(detectedSource) : null),
        campaign: campaign || null,
        device,
        browser,
        ipHash,
        sessionId: sessionId || null,
      }
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Track pageview error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

function detectSourceFromReferrer(referrer: string): string | null {
  if (!referrer) return "direct"
  
  const r = referrer.toLowerCase()
  
  // Search Engines
  if (r.includes("google.")) return "google"
  if (r.includes("bing.com")) return "bing"
  if (r.includes("yahoo.")) return "yahoo"
  if (r.includes("duckduckgo.")) return "duckduckgo"
  if (r.includes("yandex.")) return "yandex"
  if (r.includes("baidu.")) return "baidu"
  
  // Social Media
  if (r.includes("facebook.com") || r.includes("fb.com") || r.includes("fb.me") || r.includes("fbcdn.")) return "facebook"
  if (r.includes("instagram.com")) return "instagram"
  if (r.includes("threads.net")) return "threads"
  if (r.includes("twitter.com") || r.includes("t.co") || r.includes("x.com")) return "x-twitter"
  if (r.includes("tiktok.com")) return "tiktok"
  if (r.includes("youtube.com") || r.includes("youtu.be")) return "youtube"
  if (r.includes("linkedin.com")) return "linkedin"
  if (r.includes("pinterest.")) return "pinterest"
  
  // Messaging
  if (r.includes("wa.me") || r.includes("whatsapp.com") || r.includes("web.whatsapp")) return "whatsapp"
  if (r.includes("t.me") || r.includes("telegram.org")) return "telegram"
  
  // SchoolPro internal
  if (r.includes("schoolpro.id")) return "schoolpro"
  
  // Extract domain name as source
  try {
    const url = new URL(referrer)
    return url.hostname.replace("www.", "")
  } catch {
    return "other"
  }
}

function detectMedium(source: string): string {
  const searchEngines = ["google", "bing", "yahoo", "duckduckgo", "yandex", "baidu"]
  const socialMedia = ["facebook", "instagram", "threads", "x-twitter", "tiktok", "youtube", "linkedin", "pinterest"]
  const messaging = ["whatsapp", "telegram"]

  if (searchEngines.includes(source)) return "organic"
  if (socialMedia.includes(source)) return "social"
  if (messaging.includes(source)) return "messaging"
  if (source === "direct") return "direct"
  if (source === "schoolpro") return "internal"
  return "referral"
}

function parseDevice(ua: string): string {
  if (/mobile|android|iphone|ipod|blackberry|iemobile|opera mini/i.test(ua)) return "mobile"
  if (/ipad|tablet|playbook|silk/i.test(ua)) return "tablet"
  return "desktop"
}

function parseBrowser(ua: string): string {
  if (/edg/i.test(ua)) return "Edge"
  if (/opr|opera/i.test(ua)) return "Opera"
  if (/chrome|crios/i.test(ua)) return "Chrome"
  if (/firefox|fxios/i.test(ua)) return "Firefox"
  if (/safari/i.test(ua) && !/chrome/i.test(ua)) return "Safari"
  if (/msie|trident/i.test(ua)) return "IE"
  return "Other"
}
